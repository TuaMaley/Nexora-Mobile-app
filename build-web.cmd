@echo off
REM Builds the Employee Self-Service web app into the "web-build" folder, ready to upload to any static host.
npx expo export --platform web --output-dir web-build
copy /Y public\manifest.json web-build\ >nul
copy /Y public\sw.js web-build\ >nul
copy /Y public\pwa-192.png web-build\ >nul
copy /Y public\pwa-512.png web-build\ >nul
copy /Y public\apple-touch-icon.png web-build\ >nul
copy /Y public\favicon.png web-build\ >nul
copy /Y public\_redirects web-build\ >nul
echo.
echo Done. Upload the contents of web-build\ to your static host.
