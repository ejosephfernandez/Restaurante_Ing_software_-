# Ruta raiz del repositorio
$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root ".env"
$BackendPath = Join-Path $Root "backend\siar-backend"

# Comprobar que existe el archivo .env
if (-not (Test-Path $EnvFile)) {
    throw "No se encontro el archivo .env en la raiz del proyecto."
}

# Cargar variables de entorno desde .env
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()

    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line -split "=", 2
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()

        # Retirar comillas exteriores opcionales
        if (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        Set-Item -Path "Env:$name" -Value $value
    }
}

# Verificar variables esenciales sin mostrar la contraseña
if (
    [string]::IsNullOrWhiteSpace($env:DB_URL) -or
    [string]::IsNullOrWhiteSpace($env:DB_USERNAME) -or
    [string]::IsNullOrWhiteSpace($env:DB_PASSWORD)
) {
    throw "Falta configurar DB_URL, DB_USERNAME o DB_PASSWORD en .env."
}

# Ejecutar Spring Boot
Push-Location $BackendPath

try {
    & ".\mvnw.cmd" spring-boot:run
}
finally {
    Pop-Location
}