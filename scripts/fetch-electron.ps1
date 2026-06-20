# Resilient Electron binary fetcher.
# Repeatedly resumes the download (curl -C -) until the full zip is present,
# then extracts it into node_modules/electron/dist and writes path.txt so
# `electron .` works. Survives the flaky/throttled CDN connection by retrying
# in short windows and resuming from wherever the previous attempt stopped.

$ErrorActionPreference = 'Stop'
$version = '33.4.11'
$file = "electron-v$version-win32-x64.zip"
$zip = Join-Path $env:TEMP $file
$expected = 115028145  # bytes, from release Content-Length

$urls = @(
  "https://github.com/electron/electron/releases/download/v$version/$file",
  "https://registry.npmmirror.com/-/binary/electron/v$version/$file",
  "https://npmmirror.com/mirrors/electron/$version/$file"
)

function Get-Size($p) { if (Test-Path $p) { (Get-Item $p).Length } else { 0 } }

$attempt = 0
while ((Get-Size $zip) -lt $expected) {
  $attempt++
  $u = $urls[($attempt - 1) % $urls.Length]
  $have = [math]::Round((Get-Size $zip)/1MB, 1)
  Write-Host "[fetch-electron] attempt $attempt — have $have MB — source: $u"
  # Short per-attempt cap so a stalled socket is dropped fast and we reconnect.
  & curl.exe -L --retry 3 --retry-delay 2 --retry-all-errors `
      --speed-limit 1024 --speed-time 15 --connect-timeout 20 --max-time 240 `
      -C - -o $zip $u 2>$null
  Start-Sleep -Seconds 1
}

Write-Host "[fetch-electron] download complete: $([math]::Round((Get-Size $zip)/1MB,1)) MB. Extracting..."

$dist = Join-Path $PSScriptRoot '..\node_modules\electron\dist'
if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
New-Item -ItemType Directory -Force -Path $dist | Out-Null

Expand-Archive -Path $zip -DestinationPath $dist -Force
Set-Content -Path (Join-Path $PSScriptRoot '..\node_modules\electron\path.txt') -Value 'electron.exe' -NoNewline

if (Test-Path (Join-Path $dist 'electron.exe')) {
  Write-Host "[fetch-electron] SUCCESS — electron.exe is installed."
} else {
  Write-Host "[fetch-electron] ERROR — electron.exe not found after extract."
  exit 1
}
