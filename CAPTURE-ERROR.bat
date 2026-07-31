@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo ERROR CAPTURE SCRIPT
echo ========================================
echo This will try to start the servers and
echo capture any errors to files
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Node.js...
node --version 2>error-log.txt
if errorlevel 1 (
    echo ✗ Node.js not found - Install from nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js OK
echo.

echo [2/4] Testing Backend Compilation...
cd backend
call npx tsc --noEmit > ..\backend-compile-errors.txt 2>&1
if errorlevel 1 (
    echo ✗ Backend has TypeScript errors
    echo See: backend-compile-errors.txt
    type ..\backend-compile-errors.txt
) else (
    echo ✓ Backend compiles OK
    del ..\backend-compile-errors.txt 2>nul
)
echo.

echo [3/4] Testing Frontend Compilation...
cd ..\frontend
call npx tsc --noEmit > ..\frontend-compile-errors.txt 2>&1
if errorlevel 1 (
    echo ✗ Frontend has TypeScript errors
    echo See: frontend-compile-errors.txt
    type ..\frontend-compile-errors.txt
) else (
    echo ✓ Frontend compiles OK
    del ..\frontend-compile-errors.txt 2>nul
)
echo.

echo [4/4] Trying to Start Backend (10 seconds)...
cd ..\backend
start /b cmd /c "npm run dev > ..\backend-startup.log 2>&1"
timeout /t 10 /nobreak >nul

echo.
echo Checking backend-startup.log...
type ..\backend-startup.log
echo.

echo ========================================
echo RESULTS:
echo ========================================
if exist ..\backend-compile-errors.txt echo • Backend compile errors → backend-compile-errors.txt
if exist ..\frontend-compile-errors.txt echo • Frontend compile errors → frontend-compile-errors.txt
echo • Backend startup log → backend-startup.log
echo.
echo Share these files with me to fix the issue!
echo ========================================
pause
