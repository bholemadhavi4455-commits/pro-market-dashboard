@echo off
color 0B
title Quick Start - PRO Market Dashboard

cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║          PRO MARKET DASHBOARD - INSTANT START                ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo.

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo https://nodejs.org/
    echo.
    echo Download the LTS version and run the installer.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo.

:: Check dependencies
if not exist "%~dp0backend\node_modules\" (
    echo ⚙️  Installing dependencies...
    echo    This will take 1-2 minutes (first time only)
    echo.
    
    cd "%~dp0backend"
    echo Installing backend...
    call npm install --silent
    
    cd "%~dp0frontend"
    echo Installing frontend...
    call npm install --silent
    
    echo.
    echo ✅ Dependencies installed!
    echo.
)

:: Start servers
echo 🚀 Starting servers...
echo.
echo ► Backend server starting...
start "Backend Server - PRO Market Dashboard" cmd /k "cd /d "%~dp0backend" && echo ═══════════════════════════════════════ && echo    BACKEND SERVER && echo    Keep this window open! && echo    Press Ctrl+C to stop && echo ═══════════════════════════════════════ && echo. && npm run dev"

timeout /t 3 /nobreak >nul

echo ► Frontend server starting...
start "Frontend Server - PRO Market Dashboard" cmd /k "cd /d "%~dp0frontend" && echo ═══════════════════════════════════════ && echo    FRONTEND SERVER && echo    Keep this window open! && echo    Press Ctrl+C to stop && echo ═══════════════════════════════════════ && echo. && npm run dev"

echo.
echo ✅ Servers starting in separate windows...
echo.
echo ⏱️  Waiting 10 seconds for servers to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🌐 Opening browser...
start http://localhost:5173

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     ALL SET! 🎉                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Application should now be running at:
echo http://localhost:5173
echo.
echo Two windows are open:
echo • Backend Server (keep open)
echo • Frontend Server (keep open)
echo.
echo To stop: Press Ctrl+C in each window
echo.
echo.
pause
