# 🚀 COMPLETE SOLUTION - Fix "Cannot connect to server"

## ❌ Your Problem:
"Failed to load tournaments: Cannot connect to server. Please make sure the backend is running."

## ✅ The Solution:

### STEP 1: Setup Your Database (db.py is already there!)
```bash
cd C:\FYP
python db.py
```
**Expected output:** "✅ Database setup complete!"

### STEP 2: Add Sample Data
```bash
python add_sample_data.py
```
**Expected output:** "✅ Sample data added successfully!"

### STEP 3: Start the Flask Server (THIS FIXES YOUR ERROR!)
**Method 1 - Easy Way:**
- Double-click `start_flask_server.bat` in your FYP folder

**Method 2 - Command Line:**
```bash
cd C:\FYP
python app.py
```

**You should see:**
```
Tournament Management System Starting...
==================================================
Web Interface: http://localhost:5000
* Running on http://127.0.0.1:5000
```

⚠️ **IMPORTANT:** Keep this terminal window open! Don't close it.

### STEP 4: Test Your Website
1. Open web browser
2. Go to: `http://localhost:5000`
3. Navigate to different pages
4. The "Cannot connect to server" error should be gone!

---

## 🔧 Your db.py File

Your `db.py` is located at: `C:\FYP\db.py`

**What it does:**
- Creates database tables (users, tournaments, participants, match_results)
- Manages database connections
- Sets up sample data
- Handles database initialization

**How to use it:**
```bash
# Initialize database
python db.py

# Check database status
python -c "from db import check_database; check_database()"

# Quick setup with sample data
python -c "from db import quick_setup; quick_setup()"
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "python is not recognized"
**Fix:** Install Python or add it to PATH

### Issue 2: "ModuleNotFoundError: No module named 'flask'"
**Fix:** 
```bash
pip install flask flask-cors
```

### Issue 3: Server starts but still get connection error
**Fix:** Check the URL in your browser:
- ✅ Correct: `http://localhost:5000`
- ❌ Wrong: `https://localhost:5000` (no 's')

### Issue 4: Port 5000 already in use
**Fix:** Kill existing processes:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F
```

---

## 📋 Quick Test Commands

**Test database:**
```bash
python -c "import sqlite3; conn=sqlite3.connect('tournament_app.db'); print('Users:', conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]); conn.close()"
```

**Test server:**
```bash
python -c "import requests; print(requests.get('http://localhost:5000/api/health').json())"
```

---

## 🎯 Summary

1. **Your db.py exists** - it's at `C:\FYP\db.py`
2. **The main problem** - Flask server not running
3. **The fix** - Start server with `python app.py` or double-click `start_flask_server.bat`
4. **Keep terminal open** - Server must stay running
5. **Test at** - `http://localhost:5000`

**Once you start the server, your "Cannot connect to server" error will be completely fixed!** 🎉
