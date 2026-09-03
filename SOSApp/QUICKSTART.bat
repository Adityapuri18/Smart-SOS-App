@echo off
REM SOS Mobile App - Quick Start Script for Windows

echo.
echo ====================================
echo SOS Mobile App - React Native Setup
echo ====================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this script from the SOSApp directory
    echo cd d:\sos-mobile-app\mobile-app\SOSApp
    exit /b 1
)

echo Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
)

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo [OK] npm: %%i
)

REM Check Android SDK
if defined ANDROID_HOME (
    echo [OK] ANDROID_HOME is set: %ANDROID_HOME%
    
    REM Check adb
    if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
        echo [OK] adb found in Android SDK
    ) else (
        echo [WARNING] adb not found in Android SDK platform-tools
        echo Run: avdmanager list avds  (from Android Studio)
    )
) else (
    echo [WARNING] ANDROID_HOME is not set
    echo You need to install Android Studio first
    echo See EMULATOR_SETUP.md for instructions
)

echo.
echo Checking project status...

REM Check if dependencies installed
if not exist "node_modules" (
    echo [WARNING] Dependencies not installed
    echo Running: npm install
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed
)

REM Check TypeScript
call npm run lint 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] TypeScript compilation has issues
    echo Try: npx tsc --noEmit
)

echo.
echo ====================================
echo Ready to start development!
echo ====================================
echo.
echo To run your app:
echo.
echo 1. Start Metro bundler (in this terminal):
echo    npm start
echo.
echo 2. In another terminal, run on Android:
echo    npm run android
echo.
echo Or build APK:
echo    npm run android
echo.
echo For iOS (macOS only):
echo    npm run ios
echo.
echo Additional commands:
echo    npm run lint        - Check code style
echo    npm test            - Run tests
echo    npm start -- --reset-cache - Clear cache
echo.
echo For troubleshooting, see EMULATOR_SETUP.md
echo.
pause
