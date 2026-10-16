@echo off
title Spark Registration Station
color 0A
cd /d "%~dp0"

echo ================================================================
echo           SPARK REGISTRATION STATION - LOCAL SERVER
echo ================================================================
echo.
echo [*] Checking environment...

:: Verify Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

echo [*] Starting Vite local development server...
echo [*] Website URL: http://localhost:8080/
echo [*] Admin Portal: http://localhost:8080/admin
echo.
echo (Press Ctrl+C in this terminal window anytime to stop the server)
echo ================================================================
echo.

:: Automatically launch the default browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080/"

:: Launch npm run dev
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo Server stopped or encountered an error.
    pause
)
