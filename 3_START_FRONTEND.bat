@echo off
echo ================================
echo PRO Market Dashboard
echo Starting Frontend Server
echo ================================
echo.

cd "%~dp0frontend"

echo Checking if dependencies are installed...
if not exist "node_modules\" (
    echo ERROR: Dependencies not installed!
    echo Please run "1_INSTALL_DEPENDENCIES.bat" first.
    echo.
    pause
    exit /b 1
)

echo Starting frontend server on http://localhost:5173
echo.
echo KEEP THIS WINDOW OPEN!
echo Press Ctrl+C to stop the server
echo.
echo After server starts, open your browser to:
echo http://localhost:5173
echo.
echo ================================
echo.

call npm run dev

pause
