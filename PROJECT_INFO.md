# 🎮 GameVibe Arena - Project Files

## 📁 **Core Application Files**

### **Backend:**
- `backend_api.py` - Flask REST API server (main backend)
- `tournament_app.db` - SQLite database with all your data
- `tournament_app_db.py` - Database schema creation script

### **Frontend:**
- `src/` - All web application files
  - `index.html` - Main dashboard page
  - `profile.html` - User profile with friend system
  - `tournaments.html` - Tournament management
  - `social.html` - Social features
  - `login.html` / `signup.html` - Authentication pages
  - `notifications.html` - User notifications
  - `scripts/app.js` - Main JavaScript application logic
  - `styles/main.css` - Application styling

## 🚀 **Setup & Demo Files**

### **Server:**
- `start_server.bat` - Double-click to start backend server

### **Demo Data:**
- `setup_demo_data.py` - Creates demo users and friend requests for testing

## 📊 **Project Info:**
- `README.md` - Project documentation
- `requirements.txt` - Python dependencies
- `.gitignore` - Git ignore patterns

## 🎯 **How to Run:**

1. **Start Backend:** Double-click `start_server.bat` or run `python backend_api.py`
2. **Setup Demo Data:** Run `python setup_demo_data.py` (optional)
3. **Open Frontend:** Open `src/index.html` in your browser

## ✅ **What Works:**
- ✅ Tournament CRUD (Create, Read, Update, Delete)
- ✅ Tournament Participants CRUD  
- ✅ Tournament Discussions CRUD
- ✅ Match Results CRUD
- ✅ User Connections CRUD (Friend Requests System)
- ✅ Friend requests with Accept/Reject functionality
- ✅ Following/Followers system
- ✅ Real-time server status monitoring

Your application is now clean and optimized! 🚀
