# Truncation-proof resumable Electron download from GitHub's release asset.
# curl -C - resumes the partial. If an attempt ever shrinks the file (server
# answered 200 instead of 206 and truncated), we restore the larger backup so
# progress is strictly monotonic. Loops until the full zip is present, then
# extracts into node_modules/electron/dist and writes path.txt.

$ErrorActionPreference = 'Continue'
$version = '33.4.11'
$file = "electron-v$version-win32-x64.zip"
$zip = Join-Path $env:TEMP $file
$bak = "$zip.bak"
$expected = 115028145
$url = "https://github.com/electron/electron/releases/download/v$version/$file"

function Get-Size($p) { if (Test-Path $p) { (Get-Item $p).Length } else { 0 } }

$attempt = 0
while ((Get-Size $zip) -lt $expected) {
  $attempt++
  $before = Get-Size $zip
  if ($before -gt 0) { Copy-Item $zip $bak -Force }
  Write-Host "[gh] attempt $attempt - have $([math]::Round($before/1MB,1)) MB / 109.7 MB target"

  & curl.exe -L --retry 5 --retry-delay 2 --retry-all-errors --connect-timeout 20 --max-time 900 -C - -o $zip $url

  $after = Get-Size $zip
  if ($after -lt $before) {
    Write-Host "[gh] truncation detected ($([math]::Round($after/1MB,1)) MB < $([math]::Round($before/1MB,1)) MB) - restoring backup"
    Copy-Item $bak $zip -Force
  }
  Start-Sleep -Seconds 1
}

if (Test-Path $bak) { Remove-Item $bak -Force -ErrorAction SilentlyContinue }
Write-Host "[gh] download complete. Extracting..."

$dist = Join-Path $PSScriptRoot '..\node_modules\electron\dist'
if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
New-Item -ItemType Directory -Force -Path $dist | Out-Null
Expand-Archive -Path $zip -DestinationPath $dist -Force
Set-Content -Path (Join-Path $PSScriptRoot '..\node_modules\electron\path.txt') -Value 'electron.exe' -NoNewline

if (Test-Path (Join-Path $dist 'electron.exe')) {
  Write-Host "[gh] SUCCESS - electron.exe is installed."
} else {
  Write-Host "[gh] ERROR - electron.exe not found after extract."
  exit 1
}
