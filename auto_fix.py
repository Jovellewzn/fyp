"""
AUTO-FIX EVERYTHING
==================
This script will automatically fix all your problems and start the server
"""

import os
import sys
import subprocess
import threading
import time
import sqlite3

def fix_database():
    """Fix database issues"""
    print("🔧 Fixing database...")
    
    try:
        # Check if database exists
        if not os.path.exists('tournament_app.db'):
            print("📊 Creating database...")
            
            # Import and run database setup
            import db
            db.init_database()
            db.quick_setup()
            print("✅ Database created and populated!")
        else:
            # Check if database has data
            conn = sqlite3.connect('tournament_app.db')
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            tournament_count = conn.execute("SELECT COUNT(*) FROM tournaments").fetchone()[0]
            conn.close()
            
            if user_count == 0 or tournament_count == 0:
                print("📊 Adding sample data...")
                import db
                db.quick_setup()
                print("✅ Sample data added!")
            else:
                print("✅ Database already has data!")
                
    except Exception as e:
        print(f"❌ Database fix failed: {e}")
        return False
    
    return True

def start_server_background():
    """Start Flask server in background"""
    try:
        print("🚀 Starting Flask server...")
        
        # Import Flask app
        import app
        
        # Initialize database
        app.init_database()
        
        # Start server
        app.app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)
        
    except Exception as e:
        print(f"❌ Server start failed: {e}")

def check_server_running():
    """Check if server is responding"""
    try:
        import requests
        time.sleep(2)  # Wait for server to start
        
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and responding!")
            print("🌐 Open http://localhost:5000 in your browser")
            return True
        else:
            print(f"⚠️  Server responded with status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"⚠️  Server check failed: {e}")
        return False

def auto_fix_all():
    """Automatically fix everything"""
    print("🤖 AUTO-FIX: Solving all problems...")
    print("=" * 50)
    
    # Step 1: Fix database
    if not fix_database():
        print("❌ Could not fix database")
        return False
    
    # Step 2: Start server in background thread
    print("🚀 Starting server in background...")
    server_thread = threading.Thread(target=start_server_background, daemon=True)
    server_thread.start()
    
    # Step 3: Check if server is working
    print("🔍 Checking server status...")
    time.sleep(3)  # Give server time to start
    
    if check_server_running():
        print("\n🎉 ALL PROBLEMS FIXED!")
        print("✅ Database: Working")
        print("✅ Server: Running")
        print("✅ API: Responding")
        print("\n📱 Your website is ready at: http://localhost:5000")
        print("🚨 Keep this window open to keep the server running!")
        
        # Keep the main thread alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Server stopped!")
        
        return True
    else:
        print("❌ Server is not responding properly")
        return False

if __name__ == "__main__":
    auto_fix_all()
