#!/usr/bin/env pwsh

# SOS Mobile App - Quick Start Script for PowerShell

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "SOS Mobile App - React Native Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] Please run this script from the SOSApp directory" -ForegroundColor Red
    Write-Host "cd d:\sos-mobile-app\mobile-app\SOSApp"
    exit 1
}

Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/"
    pause
    exit 1
}

# Check npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "[OK] npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] npm is not installed" -ForegroundColor Red
    exit 1
}

# Check Android SDK
if ($env:ANDROID_HOME) {
    Write-Host "[OK] ANDROID_HOME is set: $($env:ANDROID_HOME)" -ForegroundColor Green
    
    if (Test-Path "$($env:ANDROID_HOME)\platform-tools\adb.exe") {
        Write-Host "[OK] adb found in Android SDK" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] adb not found in Android SDK platform-tools" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] ANDROID_HOME is not set" -ForegroundColor Yellow
    Write-Host "You need to install Android Studio first"
    Write-Host "See EMULATOR_SETUP.md for instructions"
}

Write-Host ""
Write-Host "Checking project status..." -ForegroundColor Yellow

# Check if dependencies installed
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARNING] Dependencies not installed" -ForegroundColor Yellow
    Write-Host "Running: npm install"
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed" -ForegroundColor Red
        pause
        exit 1
    }
} else {
    Write-Host "[OK] Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Ready to start development!" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run your app:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Metro bundler (in this terminal):" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. In another terminal, run on Android:" -ForegroundColor White
Write-Host "   npm run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or build APK:" -ForegroundColor White
Write-Host "   npm run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "For iOS (macOS only):" -ForegroundColor White
Write-Host "   npm run ios" -ForegroundColor Cyan
Write-Host ""
Write-Host "Additional commands:" -ForegroundColor Yellow
Write-Host "   npm run lint        - Check code style" -ForegroundColor Cyan
Write-Host "   npm test            - Run tests" -ForegroundColor Cyan
Write-Host "   npm start -- --reset-cache - Clear cache" -ForegroundColor Cyan
Write-Host ""
Write-Host "For troubleshooting, see EMULATOR_SETUP.md" -ForegroundColor Yellow
Write-Host ""
