@echo off
echo ==========================================
echo   AUTO-FIX: Tournament Management System
echo ==========================================
echo.
echo This will automatically:
echo   1. Fix your database
echo   2. Start the Flask server  
echo   3. Test everything works
echo.
echo Please wait...
echo.

cd /d "C:\FYP"
python auto_fix.py

echo.
echo Press any key to close this window...
pause >nul
