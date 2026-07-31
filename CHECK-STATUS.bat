@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
color 0A
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   THE SHIELD PROTOCOL - INSTALLATION STATUS CHECK     ║
echo ╚════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo 📋 SYSTEM REQUIREMENTS
echo ═══════════════════════════════════════════════════════
node --version 2>nul && (echo ✓ Node.js installed) || (echo ✗ Node.js MISSING - Install from nodejs.org)
npm --version 2>nul && (echo ✓ npm available) || (echo ✗ npm MISSING)
echo.

echo 📦 BACKEND STATUS
echo ═══════════════════════════════════════════════════════
cd backend
if exist "node_modules" (
    echo ✓ Dependencies installed
    if exist "node_modules\express" echo   ✓ express
    if exist "node_modules\sharp" echo   ✓ sharp
    if exist "node_modules\qrcode" echo   ✓ qrcode
    if exist "node_modules\nodemailer" echo   ✓ nodemailer
    if exist "node_modules\typescript" echo   ✓ typescript
) else (
    echo ✗ Dependencies NOT installed
    echo   → Run: install-backend.bat
)

if exist ".env" (
    echo ✓ .env configured
) else (
    echo ✗ .env MISSING
)

if exist "data" (
    echo ✓ data folder exists
) else (
    echo ℹ data folder will be created on first run
)
echo.

echo 🎨 FRONTEND STATUS
echo ═══════════════════════════════════════════════════════
cd ..\frontend
if exist "node_modules" (
    echo ✓ Dependencies installed
    if exist "node_modules\react" echo   ✓ react
    if exist "node_modules\vite" echo   ✓ vite
    if exist "node_modules\tailwindcss" echo   ✓ tailwindcss
    if exist "node_modules\lucide-react" echo   ✓ lucide-react
) else (
    echo ✗ Dependencies NOT installed
    echo   → Run: install-frontend.bat
)

if exist ".env" (
    echo ✓ .env configured
) else (
    echo ℹ .env will use defaults
)
echo.

echo 🔌 PORT AVAILABILITY
echo ═══════════════════════════════════════════════════════
netstat -ano | findstr ":5000" >nul 2>&1 && (
    echo ⚠ Port 5000 is IN USE
    echo   → Backend may already be running or blocked
) || (
    echo ✓ Port 5000 available
)

netstat -ano | findstr ":5173" >nul 2>&1 && (
    echo ⚠ Port 5173 is IN USE
    echo   → Frontend may already be running or blocked
) || (
    echo ✓ Port 5173 available
)
echo.

echo 📧 EMAIL CONFIGURATION
echo ═══════════════════════════════════════════════════════
cd ..\backend
findstr /C:"lodagalanishanth@gmail.com" .env >nul 2>&1 && (
    echo ✓ Gmail configured
) || (
    echo ⚠ Email not configured
    echo   → Edit backend\.env with your Gmail credentials
)
echo.

echo ═══════════════════════════════════════════════════════
echo.
echo 🚀 READY TO START?
echo.
echo If all checks show ✓, run: START-HERE.bat
echo If you see ✗ errors, run: fix-errors.bat
echo.
echo ═══════════════════════════════════════════════════════
pause
