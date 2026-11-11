# Ejecuta la API de ALL DAY en Windows.
# Uso: clic derecho > "Ejecutar con PowerShell", o en la terminal:  .\ejecutar-api.ps1
# Las contraseñas se piden al ejecutar y NO se guardan en ningún archivo.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 1) Buscar un JDK 17 o superior (se lee el archivo "release" de cada JDK; no depende de la salida de java.exe)
function VersionJdk($dir) {
  $rel = Join-Path $dir "release"
  if (Test-Path $rel) {
    $l = Select-String -Path $rel -Pattern 'JAVA_VERSION="(\d+)' | Select-Object -First 1
    if ($l) { return [int]$l.Matches[0].Groups[1].Value }
  }
  return 0
}
$candidatos = @()
if ($env:JAVA_HOME) { $candidatos += $env:JAVA_HOME }
$raices = @("C:\Program Files\Java", "C:\Program Files\Eclipse Adoptium", "C:\Program Files\Microsoft", "C:\Program Files\Amazon Corretto",
            "C:\Program Files\Zulu", "C:\Program Files\BellSoft", "$env:USERPROFILE\.jdks")
$candidatos += Get-ChildItem $raices -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | ForEach-Object { $_.FullName }
$javaPath = Get-Command java -ErrorAction SilentlyContinue
if ($javaPath) { $candidatos += (Split-Path (Split-Path $javaPath.Source)) }
$jdk = $null
foreach ($c in $candidatos) {
  if ((Test-Path (Join-Path $c "bin\java.exe")) -and ((VersionJdk $c) -ge 17)) { $jdk = $c; break }
}
if (-not $jdk) { Write-Host "No se encontró un JDK 17 o superior. Instálelo (por ejemplo Temurin 17) y vuelva a intentar." -ForegroundColor Red; exit 1 }
$env:JAVA_HOME = $jdk; $env:Path = "$jdk\bin;$env:Path"
Write-Host "Usando Java $(VersionJdk $jdk) en $jdk" -ForegroundColor Cyan

# 2) Configuración de la base de datos (PostgreSQL local, puerto 5433)
if (-not $env:DB_URL) { $env:DB_URL = "jdbc:postgresql://localhost:5433/allday" }
if (-not $env:DB_USER) { $env:DB_USER = "postgres" }
if (-not $env:DB_PASSWORD) {
  $s = Read-Host "Contraseña de PostgreSQL (usuario $($env:DB_USER))" -AsSecureString
  $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}
if (-not $env:ADMIN_PASSWORD) {
  Write-Host "La primera vez se crea el usuario admin@allday.ec. Si ya existe, solo presione Enter." -ForegroundColor Yellow
  $s = Read-Host "Contraseña para el administrador (mínimo 8 caracteres)" -AsSecureString
  $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}
# Clave de firma de los tokens: aleatoria en cada ejecución local (en AWS va en Secrets Manager)
if (-not $env:JWT_SECRET) { $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); $env:JWT_SECRET = [Convert]::ToBase64String($b) }
# Permite abrir la web desde el celular en la misma red
$env:CORS_ORIGINS = "http://localhost:5173,http://localhost:4173,http://192.168.*:5173,http://10.*:5173"

# 3) Ejecutar
$mvn = Get-Command mvn -ErrorAction SilentlyContinue
if (-not $mvn) { Write-Host "No se encontró Maven (mvn). Instálelo o abra el proyecto en IntelliJ/VS Code y ejecute AlldayApiApplication." -ForegroundColor Red; exit 1 }
Write-Host "Iniciando la API en http://localhost:8080  (documentación: http://localhost:8080/swagger-ui.html)" -ForegroundColor Green
mvn -q spring-boot:run
