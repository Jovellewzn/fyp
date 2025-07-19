"""
Quick Server Starter
===================
A simple script to start your Flask server and check for issues
"""

import sys
import os
import subprocess
import time

def start_server():
    """Start the Flask server"""
    print("🚀 Starting Tournament Management System...")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('app.py'):
        print("❌ Error: app.py not found!")
        print("💡 Please run this from the FYP folder")
        return False
    
    # Check if database exists
    if not os.path.exists('tournament_app.db'):
        print("⚠️  Warning: Database not found!")
        print("🔧 Creating database...")
        try:
            subprocess.run([sys.executable, 'db.py'], check=True)
            subprocess.run([sys.executable, 'add_sample_data.py'], check=True)
            print("✅ Database created!")
        except Exception as e:
            print(f"❌ Database creation failed: {e}")
    
    # Start the Flask server
    print("🔥 Starting Flask server...")
    print("📍 Server will run at: http://localhost:5000")
    print("⚠️  Keep this window open while using the website!")
    print("🛑 To stop server: Press Ctrl+C")
    print("=" * 50)
    
    try:
        # Import and run the Flask app
        import app
        print("✅ Flask app imported successfully!")
        
        # Initialize database
        app.init_database()
        print("✅ Database initialized!")
        
        # This will start the server
        print("🚀 Server starting...")
        print("🌐 Open http://localhost:5000 in your browser")
        app.app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True
    except Exception as e:
        print(f"❌ Server error: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Check if port 5000 is already in use")
        print("2. Make sure Flask is installed: pip install flask flask-cors")
        print("3. Check app.py for syntax errors")
        return False

if __name__ == "__main__":
    start_server()
