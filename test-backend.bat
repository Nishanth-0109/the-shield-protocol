@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo Testing Backend Compilation
echo ========================================
echo.

cd /d "%~dp0backend"

echo Checking TypeScript compilation...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ✗ TypeScript errors found
    echo Check the errors above
) else (
    echo.
    echo ✓ No TypeScript errors!
    echo Backend code is valid
)

echo.
pause
