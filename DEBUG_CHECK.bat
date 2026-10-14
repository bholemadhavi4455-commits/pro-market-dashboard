@echo off
color 0E
title Debug Check - PRO Market Dashboard

cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          PRO MARKET DASHBOARD - DEBUG CHECK                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Running diagnostic checks...
echo.

echo ════════════════════════════════════════════════════════════════
echo 1. Checking Node.js Installation
echo ════════════════════════════════════════════════════════════════

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Node.js is NOT installed
    echo.
    echo ► Solution: Install Node.js from https://nodejs.org/
    echo   Download the LTS version and run the installer
    echo.
) else (
    echo ✅ PASSED: Node.js is installed
    node --version
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: npm is NOT installed
    echo.
) else (
    echo ✅ PASSED: npm is installed
    npm --version
)

echo.
echo ════════════════════════════════════════════════════════════════
echo 2. Checking Project Structure
echo ════════════════════════════════════════════════════════════════

if exist "%~dp0backend\" (
    echo ✅ PASSED: Backend folder exists
) else (
    echo ❌ FAILED: Backend folder missing
)

if exist "%~dp0frontend\" (
    echo ✅ PASSED: Frontend folder exists
) else (
    echo ❌ FAILED: Frontend folder missing
)

if exist "%~dp0backend\package.json" (
    echo ✅ PASSED: Backend package.json exists
) else (
    echo ❌ FAILED: Backend package.json missing
)

if exist "%~dp0frontend\package.json" (
    echo ✅ PASSED: Frontend package.json exists
) else (
    echo ❌ FAILED: Frontend package.json missing
)

echo.
echo ════════════════════════════════════════════════════════════════
echo 3. Checking Dependencies
echo ════════════════════════════════════════════════════════════════

if exist "%~dp0backend\node_modules\" (
    echo ✅ PASSED: Backend dependencies installed
) else (
    echo ❌ FAILED: Backend dependencies NOT installed
    echo.
    echo ► Solution: Run "1_INSTALL_DEPENDENCIES.bat"
    echo.
)

if exist "%~dp0frontend\node_modules\" (
    echo ✅ PASSED: Frontend dependencies installed
) else (
    echo ❌ FAILED: Frontend dependencies NOT installed
    echo.
    echo ► Solution: Run "1_INSTALL_DEPENDENCIES.bat"
    echo.
)

echo.
echo ════════════════════════════════════════════════════════════════
echo 4. Checking Port Availability
echo ════════════════════════════════════════════════════════════════

netstat -an | findstr ":3000" >nul 2>&1
if errorlevel 1 (
    echo ✅ PASSED: Port 3000 is available (Backend)
) else (
    echo ⚠️  WARNING: Port 3000 is in use
    echo   Something is already running on backend port
    echo.
    echo ► Solution: Close the application using port 3000
    echo   Or kill process: netstat -ano | findstr :3000
    echo.
)

netstat -an | findstr ":5173" >nul 2>&1
if errorlevel 1 (
    echo ✅ PASSED: Port 5173 is available (Frontend)
) else (
    echo ⚠️  WARNING: Port 5173 is in use
    echo   Something is already running on frontend port
    echo.
    echo ► Solution: Close the application using port 5173
    echo   Or kill process: netstat -ano | findstr :5173
    echo.
)

echo.
echo ════════════════════════════════════════════════════════════════
echo 5. Checking Source Files
echo ════════════════════════════════════════════════════════════════

if exist "%~dp0backend\src\server.ts" (
    echo ✅ PASSED: Backend server.ts exists
) else (
    echo ❌ FAILED: Backend server.ts missing
)

if exist "%~dp0backend\tsconfig.json" (
    echo ✅ PASSED: Backend tsconfig.json exists
) else (
    echo ❌ FAILED: Backend tsconfig.json missing
)

if exist "%~dp0frontend\src\" (
    echo ✅ PASSED: Frontend src folder exists
) else (
    echo ❌ FAILED: Frontend src folder missing
)

if exist "%~dp0frontend\vite.config.ts" (
    echo ✅ PASSED: Frontend vite.config.ts exists
) else (
    echo ❌ FAILED: Frontend vite.config.ts missing
)

echo.
echo ════════════════════════════════════════════════════════════════
echo SUMMARY
echo ════════════════════════════════════════════════════════════════
echo.

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ CRITICAL: Cannot proceed without Node.js
    echo.
    echo Next steps:
    echo 1. Install Node.js from https://nodejs.org/
    echo 2. Restart computer
    echo 3. Run this debug check again
    echo.
) else (
    if exist "%~dp0backend\node_modules\" (
        if exist "%~dp0frontend\node_modules\" (
            echo ✅ ALL CHECKS PASSED!
            echo.
            echo You're ready to start the application.
            echo.
            echo Next steps:
            echo 1. Run "2_START_BACKEND.bat"
            echo 2. Run "3_START_FRONTEND.bat"  
            echo 3. Open http://localhost:5173 in browser
            echo.
            echo Or simply run "START_HERE.bat" for guided menu.
            echo.
        ) else (
            echo ⚠️  Frontend dependencies missing
            echo.
            echo Next step:
            echo Run "1_INSTALL_DEPENDENCIES.bat"
            echo.
        )
    ) else (
        echo ⚠️  Backend dependencies missing
        echo.
        echo Next step:
        echo Run "1_INSTALL_DEPENDENCIES.bat"
        echo.
    )
)

echo ════════════════════════════════════════════════════════════════
echo.
pause
