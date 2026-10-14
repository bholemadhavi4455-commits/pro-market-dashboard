@echo off
echo ================================
echo PRO Market Dashboard
echo Step 1: Installing Dependencies
echo ================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Download the LTS version and run the installer.
    echo.
    pause
    exit /b 1
)

echo Node.js found!
node --version
npm --version
echo.

echo ================================
echo Installing Backend Dependencies
echo ================================
cd "%~dp0backend"
call npm install
if errorlevel 1 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo.

echo ================================
echo Installing Frontend Dependencies
echo ================================
cd "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo.

echo ================================
echo SUCCESS!
echo ================================
echo All dependencies installed successfully!
echo.
echo Next step: Run "2_START_BACKEND.bat"
echo.
pause
