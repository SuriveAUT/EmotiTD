param(
  [string]$SshHost = "server",
  [string]$RemoteDir = "/var/www/emoticore-td-server",
  [string]$AppName = "emoticore-scoreboard",
  [string]$AllowedOrigin = "https://fersd.com",
  [int]$Port = 3010
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
  try { & $Command }
  catch { throw "Step failed: $Title`n$($_.Exception.Message)" }
  if ($LASTEXITCODE -ne 0) { throw "Step failed: $Title`nExit code: $LASTEXITCODE" }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Test-Path "server\package.json")) {
  throw "server\package.json not found. Run from repo root."
}

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { throw "ssh not in PATH." }
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) { throw "scp not in PATH." }
if (-not (Get-Command tar -ErrorAction SilentlyContinue)) { throw "tar not in PATH." }

$tmpDir = "/tmp/emoticore-td-server-upload"
$tarball = "$tmpDir.tar.gz"
$localTar = "$env:TEMP\emoticore-td-server-upload.tar.gz"

Run-Step "Pack server source" {
  if (Test-Path $localTar) { Remove-Item -Force $localTar }
  tar -czf $localTar `
    --exclude="server/node_modules" `
    --exclude="server/dist" `
    --exclude="server/data/*.sqlite*" `
    server
}

Run-Step "Upload tarball" {
  ssh $SshHost "rm -f -- $tarball && mkdir -p -- $(Split-Path $tarball -Parent)"
  scp $localTar "${SshHost}:$tarball"
}

Run-Step "Extract and stage on remote" {
  ssh $SshHost "rm -rf -- $tmpDir && mkdir -p -- $tmpDir && tar -xzf $tarball -C $tmpDir --strip-components=1"
}

Run-Step "Sync to $RemoteDir (preserve data dir)" {
  ssh $SshHost "sudo -n mkdir -p -- $RemoteDir/data && sudo -n rsync -a --delete --exclude data --exclude node_modules $tmpDir/ $RemoteDir/ && sudo -n chown -R dominik:dominik $RemoteDir"
}

Run-Step "Write .env on remote" {
  ssh $SshHost "cat > $RemoteDir/.env <<EOF
PORT=$Port
NODE_ENV=production
ALLOWED_ORIGIN=$AllowedOrigin
EOF"
}

Run-Step "Install deps and build (remote)" {
  ssh $SshHost "cd $RemoteDir && npm install --omit=dev=false --no-audit --no-fund && npm run build"
}

Run-Step "Restart pm2 process $AppName" {
  ssh $SshHost "cd $RemoteDir && (pm2 describe $AppName >/dev/null 2>&1 && pm2 restart $AppName --update-env || pm2 start dist/index.js --name $AppName --update-env) && pm2 save"
}

Run-Step "Health check" {
  ssh $SshHost "sleep 1 && curl -fsS http://127.0.0.1:$Port/api/health"
}

Write-Host ""
Write-Host "Backend deploy complete." -ForegroundColor Green
Write-Host "Remote: ${SshHost}:$RemoteDir"
Write-Host "Local port: $Port"
