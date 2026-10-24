' Silent launcher for PowerShell scripts without any console window flash
Set shell = CreateObject("WScript.Shell")
If WScript.Arguments.Count > 0 Then
    Dim scriptPath, cmd, i
    scriptPath = WScript.Arguments(0)
    cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & scriptPath & """"
    For i = 1 To WScript.Arguments.Count - 1
        cmd = cmd & " """ & WScript.Arguments(i) & """"
    Next
    shell.Run cmd, 0, False
End If
