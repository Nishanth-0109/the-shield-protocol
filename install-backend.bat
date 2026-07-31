@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo Installing Backend Dependencies
echo ========================================
echo.

cd /d "%~dp0backend"

echo Cleaning old files...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del /f package-lock.json
echo.

echo Installing dependencies...
echo This may take 2-3 minutes...
echo.

call npm install

if errorlevel 1 (
    echo.
    echo First attempt failed, trying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)

if errorlevel 1 (
    echo.
    echo Second attempt failed, trying individual packages...
    call npm install express dotenv cors helmet
    call npm install bcryptjs jsonwebtoken
    call npm install qrcode sharp uuid xlsx
    call npm install multer nodemailer morgan
    call npm install express-async-errors express-rate-limit
    call npm install -D typescript ts-node nodemon
    call npm install -D @types/node @types/express @types/bcryptjs
    call npm install -D @types/jsonwebtoken @types/multer
    call npm install -D @types/nodemailer @types/qrcode
    call npm install -D @types/uuid @types/cors @types/morgan
)

echo.
echo ========================================
echo Backend installation complete!
echo ========================================
echo.
pause
