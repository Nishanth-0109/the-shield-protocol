@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo The Shield Protocol - Error Fixer
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    echo After installing, restart your computer
    pause
    exit /b 1
)
echo ✓ Node.js found
echo.

echo [2/5] Cleaning backend node_modules...
cd backend
if exist "node_modules" (
    echo Removing old backend dependencies...
    rmdir /s /q node_modules 2>nul
)
if exist "package-lock.json" (
    del /f package-lock.json 2>nul
)
echo ✓ Backend cleaned
echo.

echo [3/5] Cleaning frontend node_modules...
cd ..\frontend
if exist "node_modules" (
    echo Removing old frontend dependencies...
    rmdir /s /q node_modules 2>nul
)
if exist "package-lock.json" (
    del /f package-lock.json 2>nul
)
echo ✓ Frontend cleaned
echo.

echo [4/5] Reinstalling backend dependencies...
cd ..\backend
call npm install
if errorlevel 1 (
    echo ERROR: Backend npm install failed
    echo Trying alternative installation...
    call npm install --legacy-peer-deps
)
echo ✓ Backend dependencies installed
echo.

echo [5/5] Reinstalling frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ERROR: Frontend npm install failed
    echo Trying alternative installation...
    call npm install --legacy-peer-deps
)
echo ✓ Frontend dependencies installed
echo.

echo ========================================
echo ✓ All errors fixed!
echo ========================================
echo.
echo You can now run: START-HERE.bat
echo.
pause
