# SOS Mobile App - React Native CLI Setup Guide

## ✅ Project Setup Complete

Your React Native project with all the SOS features is ready at:
```
d:\sos-mobile-app\mobile-app\SOSApp
```

### What's Included:
- ✅ Native `android/` and `ios/` folders generated
- ✅ All TypeScript screens (JWT auth, location, contacts, SOS alert)
- ✅ Socket.IO real-time location updates
- ✅ React Navigation (drawer, tabs, stack)
- ✅ All dependencies installed
- ✅ Complete backend API integration

## 🔧 Next Steps: Android Emulator Setup

### 1. Install Android SDK (Required)

Download and install from: https://developer.android.com/studio

**Installation Steps:**
1. Download Android Studio
2. Run installer and follow prompts
3. Open Android Studio → Tools → SDK Manager
4. Install:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build Tools 34.0.0
   - Android Emulator
   - Android SDK Platform-Tools

### 2. Set Environment Variables

After Android SDK installation (let's assume it installed to default location):

**For Windows (PowerShell):**
```powershell
# Set permanently
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$env:ANDROID_HOME\platform-tools", "User")

# Or temporarily in current session:
$env:ANDROID_HOME = 'C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk'
$env:PATH += ';C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk\platform-tools'

# Verify
adb --version
```

### 3. Create Android Virtual Device (AVD)

```powershell
# List available AVDs
emulator -list-avds

# Create new AVD (if needed)
avdmanager create avd -n "SOSDevice" -k "system-images;android-34;default;x86_64" -d "pixel_4"
```

### 4. Start Android Emulator

```powershell
# Option 1: Start from command line
emulator -avd SOSDevice

# Option 2: From Android Studio
# Click AVD Manager in Android Studio and click play button
```

### 5. Run Your App

Once emulator is running:

```powershell
cd 'd:\sos-mobile-app\mobile-app\SOSApp'

# Start Metro bundler (opens in terminal)
npm start

# In another PowerShell window, run on Android:
npm run android
```

## ⚠️ Troubleshooting

### Issue: "Android SDK not found"
**Solution:**
1. Verify Android Studio installed correctly
2. Check ANDROID_HOME path exists: `Test-Path $env:ANDROID_HOME`
3. Set ANDROID_HOME environment variable (see step 2)

### Issue: "adb not recognized"
**Solution:**
1. Verify platform-tools installed in Android SDK
2. Add to PATH: `$env:ANDROID_HOME\platform-tools`
3. Restart terminal/PowerShell after setting PATH

### Issue: "Port 8081 already in use"
**Solution:**
```powershell
# Find process using port 8081
netstat -ano | findstr :8081

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port
npm start -- --port 8088
```

### Issue: Emulator won't start
**Solution:**
1. Verify virtualization enabled in BIOS
2. Try AVD with different configuration
3. Delete cached AVD: `emulator -wipe-data -avd SOSDevice`

### Issue: App not loading on emulator
**Solution:**
1. Check Metro bundler is running: `npm start`
2. Clear cache: `npm start -- --reset-cache`
3. Check emulator logcat: `adb logcat`

## 📁 Project Structure

```
SOSApp/
├── android/              (Native Android project)
├── ios/                  (Native iOS project)
├── src/
│   ├── screens/          (All app screens)
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SOSAlertScreen.tsx
│   │   ├── MapAlertScreen.tsx
│   │   ├── ContactsScreen.tsx
│   │   └── ...
│   ├── services/         (API & Socket.IO)
│   │   ├── apiService.ts
│   │   └── socketService.ts
│   ├── context/          (State management)
│   │   └── AuthContext.tsx
│   ├── navigation/       (React Navigation)
│   │   ├── AppNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   └── ...
│   └── theme/            (Colors & styling)
│       └── colors.ts
├── App.tsx               (Root component)
├── index.js              (Entry point)
├── package.json          (Dependencies)
└── tsconfig.json         (TypeScript config)
```

## 🎯 Key Features Implemented

### Authentication
- ✅ JWT-based login/register
- ✅ Password reset flow
- ✅ Token persistence with AsyncStorage

### Location & Alerts
- ✅ GPS location capture (high accuracy)
- ✅ Real-time location updates every 5 seconds (Socket.IO)
- ✅ Interactive map with markers
- ✅ Google Maps location sharing link

### Emergency Contacts
- ✅ Fetch contacts from backend API
- ✅ Call emergency contact directly
- ✅ Auto-call first contact on SOS
- ✅ Send location via SMS

### Real-time Features
- ✅ Socket.IO WebSocket connection
- ✅ JWT authentication for Socket.IO
- ✅ Live marker updates on map
- ✅ Status indicators (green/orange dot)
- ✅ Fallback to polling if Socket.IO unavailable

## 📱 Testing Checklist

After running on emulator:

- [ ] Login with JWT credentials
- [ ] Navigate between screens
- [ ] Trigger SOS alert
- [ ] Verify location capture
- [ ] Check contact list loading
- [ ] Verify map displays correctly
- [ ] Test Socket.IO real-time updates
- [ ] Simulate emergency contact call
- [ ] Check SMS notification (requires backend)

## 🔗 Backend Integration

The app connects to backend at:
```
${API_URL}/api
```

Configure in `src/services/apiService.ts`:
```typescript
const API_URL = process.env.API_URL || 'http://10.0.2.2:3000';
```

**For emulator:** Use `10.0.2.2` to connect to host machine localhost

## 📋 Quick Commands

```powershell
# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Start development
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Clear cache
npm start -- --reset-cache

# Lint code
npm run lint
```

## ✨ Next: Run on Device

To test on physical Android device:
1. Enable USB Debugging in device settings
2. Connect device via USB
3. Run: `npm run android` (automatically detects device)

---

**Status:** Ready for emulator testing! 🚀
