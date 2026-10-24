export interface Account {
  id: string;
  label: string;
  email?: string;
  isPrimary: boolean;
  color?: string;
}

export interface AccountWithStatus extends Account {
  isRunning: boolean;
  isLaunching?: boolean;
  pid: number | null;
  memoryMb: number;
  hasWindow: boolean;
}

export interface ProcessInfo {
  Id: number;
  Name: string;
  WorkingSet: number;
  MainWindowHandle: number;
  HasWindow: boolean;
}

export interface LiveProcessFallback {
  Id: number;
  CommandLine: string;
  WorkingSet: number;
  MainWindowHandle: number;
}

export interface SwitchResult {
  success: boolean;
  action: "launched" | "switched" | "focused";
  previousAccount?: string | null;
  method?: string;
  error?: string;
  account?: Account;
}

export interface TaskStatusResult {
  allRegistered: boolean;
  missing: string[];
  taskCount: number;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  output?: string;
}
