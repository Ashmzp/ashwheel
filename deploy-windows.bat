@echo off
echo Building Ashwheel project...
call npm run build

echo.
echo Build complete! Now upload the 'dist' folder to VPS.
echo.
echo Use WinSCP or FileZilla:
echo Host: 72.60.203.162
echo Username: root
echo Upload 'dist' folder contents to: /var/www/ashwheel.cloud/
echo.
pause
