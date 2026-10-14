@echo off
color 0A
title PRO Market Dashboard - Quick Start

:menu
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          PRO MARKET DASHBOARD - QUICK START MENU            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo  [1] Install Dependencies (Run once, first time)
echo  [2] Start Backend Server
echo  [3] Start Frontend Server
echo  [4] Open Application in Browser
echo  [5] View Instructions
echo  [6] Exit
echo.
echo ════════════════════════════════════════════════════════════════
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto frontend
if "%choice%"=="4" goto browser
if "%choice%"=="5" goto instructions
if "%choice%"=="6" goto exit

echo Invalid choice! Please enter 1-6.
timeout /t 2 >nul
goto menu

:install
cls
echo Running dependency installation...
echo.
call "1_INSTALL_DEPENDENCIES.bat"
goto menu

:backend
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  IMPORTANT: Keep this window open after backend starts!     ║
echo ║  Press Ctrl+C to stop the backend server.                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
timeout /t 3 >nul
start "Backend Server" cmd /k "cd /d "%~dp0backend" && npm run dev"
echo Backend server starting in new window...
timeout /t 2 >nul
goto menu

:frontend
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  IMPORTANT: Keep this window open after frontend starts!    ║
echo ║  Press Ctrl+C to stop the frontend server.                  ║
echo ║  Backend must be running first!                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
timeout /t 3 >nul
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo Frontend server starting in new window...
echo.
echo Wait 5-10 seconds, then press [4] to open in browser.
timeout /t 2 >nul
goto menu

:browser
cls
echo Opening application in default browser...
start http://localhost:5173
echo.
echo Browser should open to: http://localhost:5173
echo.
echo If not, manually open your browser and navigate to:
echo http://localhost:5173
echo.
pause
goto menu

:instructions
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    QUICK START GUIDE                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo FIRST TIME SETUP:
echo 1. Press [1] to install dependencies (run once)
echo    - This may take 1-2 minutes
echo    - Requires Node.js installed
echo.
echo STARTING THE APPLICATION:
echo 2. Press [2] to start backend server
echo    - Keep the window that opens
echo.
echo 3. Press [3] to start frontend server
echo    - Keep the window that opens
echo.
echo 4. Press [4] to open in browser
echo    - Or go to http://localhost:5173
echo.
echo STOPPING THE APPLICATION:
echo - Go to each server window
echo - Press Ctrl+C to stop
echo.
echo TROUBLESHOOTING:
echo - If Node.js not found: Install from https://nodejs.org/
echo - If port errors: Close all Node.js processes and try again
echo - If module errors: Run option [1] again
echo.
pause
goto menu

:exit
cls
echo.
echo Thank you for using PRO Market Dashboard!
echo.
echo To stop running servers:
echo - Find the Backend/Frontend windows
echo - Press Ctrl+C in each window
echo.
timeout /t 3 >nul
exit

