$ErrorActionPreference = 'Stop'

$dryRun = $false
foreach ($argument in $args) {
    switch ($argument) {
        { $_ -in '-h', '--help' } {
            Write-Output 'Usage: powershell -File scripts\update_desktop_icon.ps1 [-n|--dry-run] [-h|--help]'
            Write-Output 'Updates the current Windows user''s Pixel Run desktop shortcut from icons\icon-512.png.'
            exit 0
        }
        { $_ -in '-n', '--dry-run' } { $dryRun = $true }
        default { throw "Unknown option: $argument" }
    }
}

if ($env:OS -ne 'Windows_NT') {
    throw 'This script requires Windows.'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceIcon = Join-Path $repoRoot 'icons\icon-512.png'
$converterScript = Join-Path $PSScriptRoot 'create_desktop_icon.py'
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Pixel Run.lnk'
$iconDirectory = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'PixelRun\Icons'

if (-not (Test-Path -LiteralPath $sourceIcon -PathType Leaf)) {
    throw "Source icon not found: $sourceIcon"
}
if (-not (Test-Path -LiteralPath $shortcutPath -PathType Leaf)) {
    throw "Pixel Run desktop shortcut not found: $shortcutPath"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
if ($shortcut.Arguments -notmatch '--app-id=') {
    throw "Shortcut does not appear to be an installed browser app: $shortcutPath"
}

$iconHash = (Get-FileHash -LiteralPath $sourceIcon -Algorithm SHA256).Hash.Substring(0, 12).ToLowerInvariant()
$destinationIcon = Join-Path $iconDirectory "Pixel Run-$iconHash.ico"
$iconLocation = "$destinationIcon,0"

Write-Output "Shortcut: $shortcutPath"
Write-Output "Source: $sourceIcon"
Write-Output "Icon: $destinationIcon"
if ($dryRun) {
    Write-Output 'Dry run: no files changed.'
    exit 0
}

if (-not (Get-Command python3 -ErrorAction SilentlyContinue)) {
    throw 'Python 3 was not found. Install Python 3 and Pillow first.'
}

New-Item -ItemType Directory -Path $iconDirectory -Force | Out-Null
& python3 $converterScript $sourceIcon $destinationIcon
if ($LASTEXITCODE -ne 0) {
    throw 'Could not create the desktop icon. Check that Pillow is installed for python3.'
}

$previousIconLocation = $shortcut.IconLocation
$shortcut.IconLocation = $iconLocation
$shortcut.Save()
$updatedShortcut = $shell.CreateShortcut($shortcutPath)
if ($updatedShortcut.IconLocation -ne $iconLocation) {
    $shortcut.IconLocation = $previousIconLocation
    $shortcut.Save()
    throw 'Could not verify the updated shortcut icon.'
}

Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class ShellIconRefresh { [DllImport("shell32.dll")] public static extern void SHChangeNotify(uint eventId, uint flags, IntPtr item1, IntPtr item2); }'
[ShellIconRefresh]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
Write-Output 'Desktop shortcut icon updated.'
