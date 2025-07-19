@echo off
echo ========================================
echo   TOURNAMENT SYSTEM - SERVER STARTUP  
echo ========================================
echo.
echo Starting Flask server...
echo Server will run at: http://localhost:5000
echo.
echo To stop the server: Press Ctrl+C
echo ========================================
echo.

cd /d "C:\FYP"
python app.py

echo.
echo Server has stopped.
pause
