@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo The Shield Protocol - Diagnostics
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Node.js...
node --version
npm --version
echo.

echo Checking backend folder...
cd backend
if exist "node_modules" (
    echo ✓ Backend node_modules exists
) else (
    echo ✗ Backend node_modules missing - run npm install
)
if exist ".env" (
    echo ✓ Backend .env exists
) else (
    echo ✗ Backend .env missing
)
echo.

echo Checking frontend folder...
cd ..\frontend
if exist "node_modules" (
    echo ✓ Frontend node_modules exists
) else (
    echo ✗ Frontend node_modules missing - run npm install
)
if exist ".env" (
    echo ✓ Frontend .env exists
) else (
    echo ✗ Frontend .env missing
)
echo.

echo Checking ports...
netstat -ano | findstr ":5000" >nul
if not errorlevel 1 (
    echo ! Port 5000 is in use
) else (
    echo ✓ Port 5000 is available
)
netstat -ano | findstr ":5173" >nul
if not errorlevel 1 (
    echo ! Port 5173 is in use
) else (
    echo ✓ Port 5173 is available
)
echo.

echo ========================================
echo Diagnostics Complete
echo ========================================
pause
