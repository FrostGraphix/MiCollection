# =========================================================================
# MiCollections - 1-Click ADB Mobile Test Runner
# =========================================================================

Write-Host "🔍 Checking ADB connection..." -ForegroundColor Cyan
$devices = adb devices
$deviceList = $devices | Select-String -Pattern "	device"

if (-not $deviceList) {
    Write-Host "⚠️ No Android device or emulator detected via USB debugging." -ForegroundColor Yellow
    Write-Host "Please connect your phone, enable Developer Options -> USB Debugging, and re-run." -ForegroundColor Yellow
    Exit 0
}

Write-Host "📱 Connected device found! Launching MiCollections mobile tests..." -ForegroundColor Green

# 1. Open live store in mobile Chrome
Write-Host "🌐 Launching Storefront on Android Chrome..." -ForegroundColor Cyan
adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main -d "https://micollection.vercel.app"
Start-Sleep -Seconds 3

# 2. Forward Chrome DevTools port for remote PC inspection
Write-Host "🔌 Forwarding DevTools port to localhost:9222..." -ForegroundColor Cyan
adb forward tcp:9222 localabstract:chrome_devtools_remote
Write-Host "   ↳ Open chrome://inspect/#devices on your PC to view live mobile DevTools!" -ForegroundColor Green

# 3. Simulate touch interactions
Write-Host "👆 Simulating touch scroll down..." -ForegroundColor Cyan
adb shell input swipe 500 1500 500 400 300
Start-Sleep -Seconds 1

Write-Host "👉 Simulating horizontal shelf swipe..." -ForegroundColor Cyan
adb shell input swipe 900 1100 100 1100 250
Start-Sleep -Seconds 1

# 4. Capture screenshot from device
Write-Host "📸 Capturing live device screenshot..." -ForegroundColor Cyan
adb shell screencap -p /sdcard/micollection_device.png
adb pull /sdcard/micollection_device.png .
Write-Host "✅ Saved micollection_device.png to current folder!" -ForegroundColor Green
