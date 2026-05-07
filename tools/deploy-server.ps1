param(
  [string]$SshHost = "server",
  [string]$RemoteDir = "/var/www/html/emoticore-td",
  [string]$BasePath = "/emoticore-td/",
  [string]$RemoteOwner = "dominik:dominik",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Run-Step {
  param(
    [string]$Title,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  $global:LASTEXITCODE = 0
  try {
    & $Command
  } catch {
    throw "Step failed: $Title`n$($_.Exception.Message)"
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Title`nExit code: $LASTEXITCODE"
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  throw "ssh was not found in PATH."
}
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
  throw "scp was not found in PATH."
}

if (-not $RemoteDir.StartsWith("/var/www/html/")) {
  throw "RemoteDir must stay inside /var/www/html/ for this deploy script. Got: $RemoteDir"
}

if (-not $SkipBuild) {
  Run-Step "Build release with base $BasePath" {
    npm run build -- --base=$BasePath
  }
}

Run-Step "Copy release docs into dist" {
  $docs = @(
    "README.md",
    "CHANGELOG.md",
    "RELEASE_CHECKLIST.md",
    "KNOWN_ISSUES.md",
    "BUGS.md",
    "PLAYTEST_GUIDE.md",
    "ALPHA_FEEDBACK_TEMPLATE.md",
    "BALANCE_NOTES.md",
    "package.json"
  )

  New-Item -ItemType Directory -Force -Path "dist\release-docs" | Out-Null
  foreach ($doc in $docs) {
    if (Test-Path $doc) {
      Copy-Item -Force $doc "dist\release-docs\"
    }
  }
}

$tmpDir = "/tmp/emoticore-td-upload"

Run-Step "Prepare remote upload directory" {
  ssh $SshHost "rm -rf -- $tmpDir && mkdir -p -- $tmpDir"
}

Run-Step "Upload dist to ${SshHost}:$tmpDir" {
  scp -r "dist\*" "${SshHost}:$tmpDir/"
}

Run-Step "Replace $RemoteDir on server" {
  ssh $SshHost "sudo -n rm -rf -- $RemoteDir && sudo -n mkdir -p -- $RemoteDir && sudo -n cp -a $tmpDir/. $RemoteDir/ && sudo -n chown -R $RemoteOwner $RemoteDir && sudo -n chmod -R a+rX $RemoteDir"
}

Run-Step "Verify deployed index and main asset" {
  ssh $SshHost "grep '${BasePath}assets' $RemoteDir/index.html"
  ssh $SshHost "find $RemoteDir/assets -maxdepth 1 -type f -name 'index-*.js' -printf '%f %s bytes\n'"
}

Write-Host ""
Write-Host "Deploy complete." -ForegroundColor Green
Write-Host "Remote: ${SshHost}:$RemoteDir"
Write-Host "URL:    http://fersd.com$BasePath"
