@echo off
cls
echo.
echo ============================================
echo   FIXING YOUR WEBSITE - EMERGENCY MODE
echo ============================================
echo.
echo Starting minimal server...
echo.

cd /d "C:\FYP"
python minimal_server.py

echo.
echo Server stopped. Press any key to exit...
pause
