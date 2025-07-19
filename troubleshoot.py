"""
System Test & Troubleshooter
============================
Tests and fixes common issues with the tournament system
"""

import requests
import sqlite3
import subprocess
import time
import sys
import os

def check_database():
    """Check if database exists and has data"""
    print("🔍 Checking database...")
    
    if not os.path.exists('tournament_app.db'):
        print("❌ Database file missing!")
        print("💡 Run: python db.py")
        return False
    
    try:
        conn = sqlite3.connect('tournament_app.db')
        
        # Check tables
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        table_names = [table[0] for table in tables]
        print(f"✅ Found tables: {', '.join(table_names)}")
        
        # Check data
        user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        tournament_count = conn.execute("SELECT COUNT(*) FROM tournaments").fetchone()[0]
        
        print(f"✅ Data: {user_count} users, {tournament_count} tournaments")
        
        if user_count == 0 or tournament_count == 0:
            print("⚠️  No sample data found!")
            print("💡 Run: python add_sample_data.py")
            conn.close()
            return False
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def check_server():
    """Check if Flask server is running"""
    print("🔍 Checking Flask server...")
    
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Flask server is running!")
            return True
        else:
            print(f"❌ Server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Flask server!")
        print("💡 Run: python app.py")
        print("💡 Or double-click: run_server.bat")
        return False
    except Exception as e:
        print(f"❌ Server check error: {e}")
        return False

def test_api_endpoints():
    """Test critical API endpoints"""
    print("🔍 Testing API endpoints...")
    
    endpoints_to_test = [
        ('/api/tournaments', 'GET'),
        ('/api/ai/tournaments', 'GET'),
    ]
    
    all_good = True
    for endpoint, method in endpoints_to_test:
        try:
            if method == 'GET':
                response = requests.get(f'http://localhost:5000{endpoint}', timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success']:
                    print(f"✅ {endpoint} - OK")
                else:
                    print(f"❌ {endpoint} - API error: {data.get('error', 'Unknown')}")
                    all_good = False
            else:
                print(f"❌ {endpoint} - HTTP {response.status_code}")
                all_good = False
                
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
            all_good = False
    
    return all_good

def fix_json_error():
    """Diagnose and fix the JSON parsing error"""
    print("🔧 Diagnosing JSON error...")
    
    try:
        # Test what the frontend is actually receiving
        response = requests.get('http://localhost:5000/api/tournaments', timeout=5)
        content_type = response.headers.get('content-type', '')
        
        print(f"Response status: {response.status_code}")
        print(f"Content-Type: {content_type}")
        
        if 'html' in content_type.lower():
            print("❌ Server is returning HTML instead of JSON!")
            print("📄 Response preview:")
            print(response.text[:200] + "...")
            print("\n💡 This usually means:")
            print("   1. Flask app.py is not running")
            print("   2. Wrong URL or route not found")
            print("   3. Server error redirecting to error page")
            return False
        
        elif 'json' in content_type.lower():
            try:
                data = response.json()
                print("✅ Server is returning valid JSON")
                print(f"📊 Data preview: {str(data)[:100]}...")
                return True
            except:
                print("❌ Server claims JSON but content is invalid")
                return False
        
        else:
            print(f"❌ Unexpected content type: {content_type}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server - server is not running!")
        return False
    except Exception as e:
        print(f"❌ Error testing server response: {e}")
        return False

def auto_fix():
    """Attempt to automatically fix common issues"""
    print("🔧 Attempting auto-fix...")
    
    # Check and fix database
    if not check_database():
        print("🔧 Setting up database...")
        try:
            subprocess.run([sys.executable, 'db.py'], check=True)
            print("✅ Database setup complete")
        except:
            print("❌ Failed to setup database")
            return False
    
    # Check if server is running
    if not check_server():
        print("🔧 Server not running - please start manually")
        print("💡 Run one of these commands:")
        print("   python app.py")
        print("   OR double-click run_server.bat")
        return False
    
    # Test APIs
    if test_api_endpoints():
        print("🎉 All systems are working!")
        return True
    else:
        print("❌ Some API endpoints are not working")
        return False

def main():
    """Main troubleshooting function"""
    print("🚀 Tournament System Troubleshooter")
    print("=" * 40)
    
    print("\n1. Database Check:")
    db_ok = check_database()
    
    print("\n2. Server Check:")
    server_ok = check_server()
    
    if server_ok:
        print("\n3. API Test:")
        api_ok = test_api_endpoints()
        
        print("\n4. JSON Error Diagnosis:")
        json_ok = fix_json_error()
        
        if db_ok and server_ok and api_ok and json_ok:
            print("\n🎉 ALL SYSTEMS WORKING!")
            print("✅ Your tournament system is ready to use!")
            print("🌐 Open: http://localhost:5000")
        else:
            print("\n⚠️  ISSUES FOUND - attempting auto-fix...")
            auto_fix()
    else:
        print("\n💡 QUICK FIX:")
        print("1. Open Command Prompt")
        print("2. Navigate to your FYP folder")
        print("3. Run: python app.py")
        print("4. Wait for 'Running on http://127.0.0.1:5000'")
        print("5. Then test your website again")

if __name__ == "__main__":
    main()
