import fs from "fs";
import path from "path";
import { exec } from "child_process";
import type {
  Account,
  AccountWithStatus,
  ProcessInfo,
  LiveProcessFallback,
  SwitchResult,
  TaskStatusResult,
  ActionResult,
} from "~/lib/types";

// Resolve base directory holding accounts.json, pids/, and PowerShell scripts
export function getBaseDir(): string {
  if (process.env.ACCOUNTS_BASE_DIR && fs.existsSync(process.env.ACCOUNTS_BASE_DIR)) {
    return path.resolve(process.env.ACCOUNTS_BASE_DIR);
  }
  // Check local bridge/ folder inside claude_accounts_switcher
  const localBridge = path.resolve(process.cwd(), "bridge");
  if (fs.existsSync(path.join(localBridge, "accounts.json"))) {
    return localBridge;
  }
  // Check relative bridge if running from a subdirectory
  const parentBridge = path.resolve(process.cwd(), "..", "bridge");
  if (fs.existsSync(path.join(parentBridge, "accounts.json"))) {
    return parentBridge;
  }
  // Fallback to parent directory
  const parentDir = path.resolve(process.cwd(), "..");
  if (fs.existsSync(path.join(parentDir, "accounts.json"))) {
    return parentDir;
  }
  return process.cwd();
}

const BASE_DIR = getBaseDir();
const ACCOUNTS_FILE = path.join(BASE_DIR, "accounts.json");
const PIDS_DIR = path.join(BASE_DIR, "pids");

if (!fs.existsSync(PIDS_DIR)) {
  try {
    fs.mkdirSync(PIDS_DIR, { recursive: true });
  } catch {
    // Ignore if already created
  }
}

export function getAccounts(): Account[] {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, "utf8");
      return JSON.parse(data) as Account[];
    }
  } catch (e) {
    console.error("Error reading accounts.json:", e);
  }
  return [];
}

export function saveAccounts(accounts: Account[]): void {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf8");
}

export function runPS(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const encoded = Buffer.from(cmd, "utf16le").toString("base64");
    exec(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
      { timeout: 15000 },
      (err, stdout, stderr) => {
        resolve({
          stdout: (stdout || "").trim(),
          stderr: (stderr || "").trim(),
          code: err ? err.code || 1 : 0,
        });
      }
    );
  });
}

export function runPSFile(
  filePath: string,
  args = ""
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const cmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${filePath}" ${args}`;
    exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
      resolve({
        stdout: (stdout || "").trim(),
        stderr: (stderr || "").trim(),
        code: err ? err.code || 1 : 0,
      });
    });
  });
}

export function readPidMarker(accountId: string): number | null {
  const file = path.join(PIDS_DIR, `${accountId}.pid`);
  try {
    if (fs.existsSync(file)) {
      const parsed = parseInt(fs.readFileSync(file, "utf8").trim(), 10);
      return isNaN(parsed) ? null : parsed;
    }
  } catch {
    // Return null on read error
  }
  return null;
}

export function writePidMarker(accountId: string, pid: number): void {
  const file = path.join(PIDS_DIR, `${accountId}.pid`);
  try {
    fs.writeFileSync(file, String(pid), "utf8");
  } catch {
    // Ignore marker write error
  }
}

export function clearPidMarker(accountId: string): void {
  const file = path.join(PIDS_DIR, `${accountId}.pid`);
  try {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {
    // Ignore marker delete error
  }
}

export async function getProcessInfo(pid: number): Promise<ProcessInfo | null> {
  if (!pid) return null;
  const ps = `
$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
if ($p -and ($p.Name -like "claude*")) {
    [PSCustomObject]@{
        Id = $p.Id
        Name = $p.Name
        WorkingSet = $p.WorkingSet64
        MainWindowHandle = $p.MainWindowHandle.ToInt64()
        HasWindow = ($p.MainWindowHandle.ToInt64() -ne 0)
    } | ConvertTo-Json -Compress
}
`;
  const res = await runPS(ps);
  if (!res.stdout) return null;
  try {
    return JSON.parse(res.stdout) as ProcessInfo;
  } catch {
    return null;
  }
}

export async function getLiveProcessesByCmd(): Promise<LiveProcessFallback[]> {
  const ps = `
$results = @()
$procs = Get-Process -Name "claude" -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    try {
        $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $($p.Id)" -ErrorAction SilentlyContinue
        $cmd = if ($wmi) { $wmi.CommandLine } else { "" }
        if (-not ($cmd -match '--type=')) {
            $results += [PSCustomObject]@{
                Id              = $p.Id
                CommandLine     = if ($cmd) { $cmd } else { "" }
                WorkingSet      = $p.WorkingSet64
                MainWindowHandle = $p.MainWindowHandle.ToInt64()
            }
        }
    } catch {}
}
$results | ConvertTo-Json -Compress -Depth 3
`;
  const res = await runPS(ps);
  if (!res.stdout) return [];
  try {
    const parsed = JSON.parse(res.stdout);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export async function getAccountsWithStatus(): Promise<AccountWithStatus[]> {
  const accounts = getAccounts();
  const fallbackProcs = await getLiveProcessesByCmd();

  const results = await Promise.all(
    accounts.map(async (acc): Promise<AccountWithStatus> => {
      const markedPid = readPidMarker(acc.id);
      if (markedPid) {
        const info = await getProcessInfo(markedPid);
        if (info) {
          return {
            ...acc,
            isRunning: true,
            pid: markedPid,
            memoryMb: Math.round(Number(info.WorkingSet || 0) / (1024 * 1024)),
            hasWindow: info.HasWindow,
          };
        } else {
          clearPidMarker(acc.id);
        }
      }

      let matching: LiveProcessFallback | undefined = undefined;
      if (acc.isPrimary) {
        const secondaryDirs = accounts
          .filter((a) => !a.isPrimary)
          .map((a) => `Claude-${a.id}`);
        matching = fallbackProcs.find((p) => {
          const cmd = p.CommandLine || "";
          if (!cmd) return false;
          const refsSecondary = secondaryDirs.some((d) => cmd.includes(d));
          return !refsSecondary && !cmd.includes("--user-data-dir");
        });
      } else {
        matching = fallbackProcs.find((p) => {
          const cmd = p.CommandLine || "";
          return cmd.includes(`Claude-${acc.id}`);
        });
      }

      if (matching) {
        writePidMarker(acc.id, matching.Id);
        return {
          ...acc,
          isRunning: true,
          pid: matching.Id,
          memoryMb: Math.round(Number(matching.WorkingSet || 0) / (1024 * 1024)),
          hasWindow: matching.MainWindowHandle !== 0,
        };
      }

      return {
        ...acc,
        isRunning: false,
        pid: null,
        memoryMb: 0,
        hasWindow: false,
      };
    })
  );

  return results;
}

export function getTaskName(accountId: string): string {
  return `Claude-Launch-${accountId}`;
}

export async function checkTasksRegistered(): Promise<TaskStatusResult> {
  const accounts = getAccounts();
  const taskNames = accounts.map((a) => getTaskName(a.id));

  const ps = `
$names = @(${taskNames.map((n) => `"${n}"`).join(",")})
$results = @{}
foreach ($name in $names) {
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    $results[$name] = ($null -ne $task)
}
$results | ConvertTo-Json -Compress
`;
  const res = await runPS(ps);
  let statusMap: Record<string, boolean> = {};
  try {
    statusMap = JSON.parse(res.stdout || "{}");
  } catch {
    // Ignore parse errors
  }

  const missing = taskNames.filter((n) => !statusMap[n]);
  return {
    allRegistered: missing.length === 0,
    missing,
    taskCount: taskNames.length,
  };
}

export function launchViaScheduledTask(
  accountId: string
): Promise<{ success: boolean; method: string; error?: string }> {
  return new Promise((resolve) => {
    const taskName = getTaskName(accountId);
    exec(`schtasks /run /tn "${taskName}"`, { timeout: 10000 }, (err, _stdout, stderr) => {
      if (err) {
        console.error(`[Launch] Task "${taskName}" failed:`, stderr || err.message);
        const script = path.join(BASE_DIR, `launch_${accountId}.ps1`);
        if (fs.existsSync(script)) {
          runPSFile(script).then((r) =>
            resolve({ success: r.code === 0, method: "direct" })
          );
        } else {
          resolve({ success: false, error: stderr || err.message, method: "task" });
        }
      } else {
        console.log(`[Launch] Task "${taskName}" triggered successfully`);
        resolve({ success: true, method: "task" });
      }
    });
  });
}

export async function focusInstance(
  pid: number
): Promise<{ success: boolean; output: string }> {
  if (!pid) return { success: false, output: "No PID" };
  const ps = `
$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
if ($p -and $p.MainWindowHandle -ne 0) {
    Add-Type @"
        using System; using System.Runtime.InteropServices;
        public class WinFocus {
            [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int n);
            [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
            [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
        }
"@ -ErrorAction SilentlyContinue
    if ([WinFocus]::IsIconic($p.MainWindowHandle)) {
        [WinFocus]::ShowWindowAsync($p.MainWindowHandle, 9) | Out-Null
    }
    [WinFocus]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
    Write-Output "focused"
} else {
    $wsh = New-Object -ComObject WScript.Shell
    $wsh.AppActivate(${pid}) | Out-Null
    Write-Output "activated"
}
`;
  const res = await runPS(ps);
  return { success: res.code === 0, output: res.stdout };
}

export async function closeInstance(account: Account): Promise<{ success: boolean }> {
  const accountId = account?.id;
  const markedPid = accountId ? readPidMarker(accountId) : null;
  const taskName = accountId ? getTaskName(accountId) : null;

  // 1. Terminate the scheduled task if it is currently in 'Running' state
  if (taskName) {
    await new Promise<void>((resolve) => {
      exec(`schtasks /end /tn "${taskName}"`, () => resolve());
    });
  }

  // 2. Kill target PID tree if known
  if (markedPid) {
    await new Promise<void>((resolve) => {
      exec(`taskkill /F /T /PID ${markedPid}`, () => resolve());
    });
  }

  // 3. Gracefully signal window close and force-kill local Claude processes
  const psKill = `
$procs = Get-Process -Name "claude" -ErrorAction SilentlyContinue
if ($procs) {
    $procs | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object {
        $_.CloseMainWindow() | Out-Null
    }
    Start-Sleep -Milliseconds 200
    & taskkill.exe /F /T /IM Claude.exe 2>&1 | Out-Null
    Stop-Process -Name "claude" -Force -ErrorAction SilentlyContinue
}
`;
  await runPS(psKill);

  // 4. Fallback check: if any Claude process still lingers (e.g. running elevated from previous session),
  // trigger the elevated scheduled task "Claude-Close-All"
  const checkPs = `(Get-Process -Name "claude" -ErrorAction SilentlyContinue).Count`;
  const checkRes = await runPS(checkPs);
  const remainingCount = parseInt(checkRes.stdout.trim() || "0", 10);
  if (remainingCount > 0) {
    console.log(
      `[Close] Lingering Claude processes (${remainingCount}) detected. Invoking elevated emergency terminator...`
    );
    await new Promise<void>((resolve) => {
      exec(`schtasks /run /tn "Claude-Close-All"`, () => resolve());
    });
    // Brief delay to allow elevated taskkill to finish
    await new Promise((r) => setTimeout(r, 600));
  }

  // 5. Clean up PID marker
  if (accountId) {
    clearPidMarker(accountId);
  }

  return { success: true };
}

export async function closeAllInstances(): Promise<{ success: boolean }> {
  // Local taskkill first
  await new Promise<void>((resolve) => {
    exec(`taskkill /F /T /IM Claude.exe`, () => resolve());
  });
  await runPS(`Stop-Process -Name "claude" -Force -ErrorAction SilentlyContinue`);

  // Elevated fallback
  const checkPs = `(Get-Process -Name "claude" -ErrorAction SilentlyContinue).Count`;
  const checkRes = await runPS(checkPs);
  if (parseInt(checkRes.stdout.trim() || "0", 10) > 0) {
    await new Promise<void>((resolve) => {
      exec(`schtasks /run /tn "Claude-Close-All"`, () => resolve());
    });
    await new Promise((r) => setTimeout(r, 600));
  }

  // Clear all PID markers
  try {
    if (fs.existsSync(PIDS_DIR)) {
      const files = fs.readdirSync(PIDS_DIR);
      for (const file of files) {
        if (file.endsWith(".pid")) {
          fs.unlinkSync(path.join(PIDS_DIR, file));
        }
      }
    }
  } catch {
    // Ignore marker cleanup error
  }

  return { success: true };
}


export async function switchInstance(accountId: string): Promise<SwitchResult> {
  const accounts = await getAccountsWithStatus();
  const target = accounts.find((a) => a.id === accountId);
  if (!target) {
    return { success: false, error: "Account not found", action: "launched" };
  }

  // If target is already running, bring it to focus
  if (target.isRunning && target.pid) {
    await focusInstance(target.pid);
    return { success: true, action: "focused", account: target };
  }

  // Auto-close any conflicting active account
  const runningOther = accounts.find((a) => a.isRunning && a.id !== target.id);
  let previousAccountLabel: string | null = null;
  if (runningOther) {
    previousAccountLabel = runningOther.label || runningOther.id;
    console.log(
      `[Switch] Closing active account "${previousAccountLabel}" before launching "${target.label || target.id}"`
    );
    await closeInstance(runningOther);
    clearPidMarker(runningOther.id);
    await new Promise((r) => setTimeout(r, 1200));
  }

  const result = await launchViaScheduledTask(target.id);
  return {
    success: result.success,
    action: runningOther ? "switched" : "launched",
    previousAccount: previousAccountLabel,
    method: result.method,
    error: result.error,
    account: target,
  };
}

export async function syncMcp(): Promise<ActionResult> {
  const script = path.join(BASE_DIR, "Sync-McpConfig.ps1");
  const result = await runPSFile(script);
  return { success: result.code === 0, output: result.stdout };
}

export async function openProfileFolder(
  accountId: string
): Promise<ActionResult> {
  const accounts = getAccounts();
  const acc = accounts.find((a) => a.id === accountId);
  if (!acc) return { success: false, error: "Account not found" };

  const appData = process.env.APPDATA || "";
  const folder = acc.isPrimary
    ? path.join(appData, "Claude")
    : path.join(appData, `Claude-${acc.id}`);

  if (!fs.existsSync(folder)) {
    try {
      fs.mkdirSync(folder, { recursive: true });
    } catch {
      // Ignore if cannot create
    }
  }

  exec(`explorer.exe "${folder}"`);
  return { success: true };
}

export async function renameAccount(
  oldName: string,
  newName: string
): Promise<ActionResult> {
  if (!oldName || !newName) {
    return { success: false, error: "Both oldName and newName are required" };
  }
  const script = path.join(BASE_DIR, "Rename-Account.ps1");
  const result = await runPSFile(script, `-OldName "${oldName}" -NewName "${newName}"`);
  if (result.code === 0) {
    const accounts = getAccounts();
    const acc = accounts.find((a) => a.id === oldName);
    if (acc) {
      acc.id = newName;
      acc.label = newName;
    }
    saveAccounts(accounts);
    return { success: true };
  } else {
    return { success: false, error: result.stderr || "Rename script failed" };
  }
}


