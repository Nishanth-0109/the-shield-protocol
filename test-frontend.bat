@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo Testing Frontend Compilation
echo ========================================
echo.

cd /d "%~dp0frontend"

echo Checking TypeScript compilation...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ✗ TypeScript errors found
    echo Check the errors above
) else (
    echo.
    echo ✓ No TypeScript errors!
    echo Frontend code is valid
)

echo.
pause
