@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo Installing Frontend Dependencies
echo ========================================
echo.

cd /d "%~dp0frontend"

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
    call npm install react react-dom
    call npm install react-router-dom axios
    call npm install recharts react-dropzone
    call npm install react-hot-toast lucide-react clsx date-fns
    call npm install -D vite @vitejs/plugin-react
    call npm install -D typescript @types/react @types/react-dom
    call npm install -D tailwindcss postcss autoprefixer
)

echo.
echo ========================================
echo Frontend installation complete!
echo ========================================
echo.
pause
