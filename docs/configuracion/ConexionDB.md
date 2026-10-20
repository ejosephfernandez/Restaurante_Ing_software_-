En MySQL WampServer, abre una pestaña SQL y ejecuta el siguiente script de desarrollo:

CREATE DATABASE IF NOT EXISTS siar
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'siar_app'@'localhost'
    IDENTIFIED BY '1234';

GRANT ALL PRIVILEGES ON siar.*
    TO 'siar_app'@'localhost';

    En la carpeta raiz del proyecto creal el archivo .env y pega :

    DB_URL=jdbc:mysql://localhost:3306/siar?serverTimezone=UTC
    DB_USERNAME=siar_app
    DB_PASSWORD=1234

    REDIS_HOST=localhost
    REDIS_PORT=6379

    Abre una terminal powerShell situada en la raíz del repositorio y ejecuta:

Get-Content .env | ForEach-Object {
    $line = $_.Trim()

    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")

        Set-Item -Path "Env:$name" -Value $value
    }
}

Después, ejecuta el backend:

cd .\backend\siar-backend
.\mvnw.cmd spring-boot:run