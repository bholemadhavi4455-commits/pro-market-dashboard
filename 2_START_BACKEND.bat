@echo off
echo ================================
echo PRO Market Dashboard
echo Starting Backend Server
echo ================================
echo.

cd "%~dp0backend"

echo Checking if dependencies are installed...
if not exist "node_modules\" (
    echo ERROR: Dependencies not installed!
    echo Please run "1_INSTALL_DEPENDENCIES.bat" first.
    echo.
    pause
    exit /b 1
)

echo Starting backend server on http://localhost:3000
echo.
echo KEEP THIS WINDOW OPEN!
echo Press Ctrl+C to stop the server
echo.
echo ================================
echo.

call npm run dev
