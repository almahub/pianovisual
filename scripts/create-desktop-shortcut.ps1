$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$launcher = Join-Path $repoRoot "scripts\start-pianovisual.bat"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "PianoVisual.lnk"

if (-not (Test-Path $launcher)) {
  throw "Launcher non trovato: $launcher"
}

$wshell = New-Object -ComObject WScript.Shell
$shortcut = $wshell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WorkingDirectory = $repoRoot
$shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
$shortcut.Description = "Avvia PianoVisual"
$shortcut.Save()

Write-Host "Shortcut creato: $shortcutPath"

