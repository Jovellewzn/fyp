@echo off
echo Starting Tournament Management System...
echo =====================================
echo.

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting the application...
echo Web interface will be available at: http://localhost:5000
echo.

python app.py

pause
