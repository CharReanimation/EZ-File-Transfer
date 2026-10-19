```bat
@echo off
chcp 65001 >nul
title EZ File Transfer Server

:: Navigate to the project directory
cd /d "%~dp0"

:: Define the PID file
set "PID_FILE=%~dp0Server\server.pid"

echo ========================================
echo       EZ File Transfer Server
echo ========================================
echo.

:: Start the server and record its PID
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath 'node' -ArgumentList '.\Server\server.js' -WorkingDirectory '%~dp0' -PassThru -NoNewWindow; Set-Content -Path '%PID_FILE%' -Value $p.Id"

if errorlevel 1 (
    echo Failed to start the server.
    pause
    exit /b 1
)

echo Server started.
echo Press Ctrl+C to exit this window.
echo.

pause
```