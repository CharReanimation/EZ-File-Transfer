```bat
@echo off
chcp 65001 >nul
title EZ File Transfer - Stop Server

:: Navigate to the project directory
cd /d "%~dp0"

:: Define the PID file
set "PID_FILE=%~dp0Server\server.pid"

echo ========================================
echo       Stop EZ File Transfer Server
echo ========================================
echo.

:: Check whether the PID file exists
if not exist "%PID_FILE%" (
    echo No server PID file found.
    echo The server may not be running.
    pause
    exit /b 1
)

:: Read the PID
set /p SERVER_PID=<"%PID_FILE%"

:: Verify and stop only the recorded process
powershell -NoProfile -ExecutionPolicy Bypass -Command "$id = 0; if (-not [int]::TryParse('%SERVER_PID%', [ref]$id)) { Write-Host 'Invalid PID.'; exit 1 }; $p = Get-CimInstance Win32_Process -Filter \"ProcessId = $id\" -ErrorAction SilentlyContinue; if ($p -and $p.Name -eq 'node.exe' -and $p.CommandLine -like '*Server\server.js*') { Stop-Process -Id $id -Force; Write-Host 'EZ File Transfer server stopped.'; exit 0 } else { Write-Host 'The recorded process is not the expected server. Nothing was stopped.'; exit 1 }"

if errorlevel 1 (
    echo.
    echo Stop operation failed or the server is not running.
    pause
    exit /b 1
)

:: Remove the PID file
del "%PID_FILE%" 2>nul

echo.
echo Done.
pause
```