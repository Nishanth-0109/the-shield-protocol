@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo Verifying Installation
echo ========================================
echo.

cd /d "%~dp0"

set ERRORS=0

echo [1/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js not found
    set ERRORS=1
) else (
    node --version
    echo ✓ Node.js OK
)
echo.

echo [2/6] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ npm not found
    set ERRORS=1
) else (
    npm --version
    echo ✓ npm OK
)
echo.

echo [3/6] Checking backend node_modules...
cd backend
if not exist "node_modules" (
    echo ✗ Backend node_modules missing
    set ERRORS=1
) else (
    echo ✓ Backend dependencies installed
)
echo.

echo [4/6] Checking key backend packages...
if not exist "node_modules\express" (
    echo ✗ express missing
    set ERRORS=1
) else (
    echo ✓ express found
)
if not exist "node_modules\sharp" (
    echo ✗ sharp missing
    set ERRORS=1
) else (
    echo ✓ sharp found
)
if not exist "node_modules\nodemailer" (
    echo ✗ nodemailer missing
    set ERRORS=1
) else (
    echo ✓ nodemailer found
)
echo.

echo [5/6] Checking frontend node_modules...
cd ..\frontend
if not exist "node_modules" (
    echo ✗ Frontend node_modules missing
    set ERRORS=1
) else (
    echo ✓ Frontend dependencies installed
)
echo.

echo [6/6] Checking key frontend packages...
if not exist "node_modules\react" (
    echo ✗ react missing
    set ERRORS=1
) else (
    echo ✓ react found
)
if not exist "node_modules\vite" (
    echo ✗ vite missing
    set ERRORS=1
) else (
    echo ✓ vite found
)
echo.

echo ========================================
if %ERRORS%==0 (
    echo ✓ ALL CHECKS PASSED!
    echo You can now run START-HERE.bat
) else (
    echo ✗ SOME CHECKS FAILED
    echo Run fix-errors.bat to fix issues
)
echo ========================================
echo.
pause
