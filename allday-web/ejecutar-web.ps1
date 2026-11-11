# Ejecuta el front-end de ALL DAY (React + Vite).
# Uso: .\ejecutar-web.ps1   — luego abra http://localhost:5173
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Write-Host "No se encontró Node.js/npm. Instálelo desde nodejs.org (versión LTS)." -ForegroundColor Red; exit 1 }
$lock = "node_modules\.package-lock.json"
if (-not (Test-Path $lock) -or (Get-Item "package.json").LastWriteTime -gt (Get-Item $lock).LastWriteTime) {
  Write-Host "Instalando dependencias (primera vez o después de una actualización)..." -ForegroundColor Cyan
  npm config set fetch-retries 5 | Out-Null
  npm install --no-audit --no-fund
}
Write-Host "Abra http://localhost:5173 en el navegador. Para el celular use la dirección 'Network' que aparece abajo." -ForegroundColor Green
npm run dev
