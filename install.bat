@echo off
echo 🚀 Installing E2E Delivery Management System...
echo ================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    echo Please upgrade Node.js to version 18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm version: 
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed successfully!
) else (
    echo ❌ Failed to install dependencies. Please check the error messages above.
    pause
    exit /b 1
)

REM Create .env.local file if it doesn't exist
if not exist .env.local (
    echo 🔧 Creating .env.local file...
    (
        echo NEXT_PUBLIC_APP_NAME="E2E Delivery Management"
        echo NEXT_PUBLIC_VERSION="1.0.0"
    ) > .env.local
    echo ✅ .env.local file created!
)

echo.
echo 🎉 Installation completed successfully!
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Then open your browser and navigate to:
echo   http://localhost:3000
echo.
echo Happy coding! 🚀
pause
