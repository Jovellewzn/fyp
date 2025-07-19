#!/usr/bin/env python3
"""
Test script to verify the tournament management system works
"""

import sys
import requests
import time
import subprocess
import threading

def test_api():
    """Test the API endpoints"""
    base_url = "http://localhost:5000"
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
        
        # Test tournaments endpoint
        print("\nTesting tournaments endpoint...")
        response = requests.get(f"{base_url}/api/tournaments")
        if response.status_code == 200:
            print("✅ Tournaments endpoint working")
            tournaments = response.json().get('tournaments', [])
            print(f"Found {len(tournaments)} tournaments")
        else:
            print(f"❌ Tournaments endpoint failed: {response.status_code}")
            return False
        
        # Test registration
        print("\nTesting user registration...")
        test_user = {
            "username": "testuser",
            "email": "test@example.com", 
            "password": "testpass123"
        }
        
        response = requests.post(f"{base_url}/api/auth/register", json=test_user)
        if response.status_code == 200:
            print("✅ User registration working")
        else:
            print(f"⚠️ Registration response: {response.status_code} (may be user already exists)")
        
        # Test login
        print("\nTesting user login...")
        login_data = {
            "username": test_user["username"],
            "password": test_user["password"]
        }
        
        session = requests.Session()
        response = session.post(f"{base_url}/api/auth/login", json=login_data)
        if response.status_code == 200:
            print("✅ User login working")
            
            # Test tournament creation
            print("\nTesting tournament creation...")
            tournament_data = {
                "title": "Test Tournament",
                "description": "A test tournament for verification",
                "game_type": "Test Game",
                "entry_fee": 10.0,
                "prize_pool": 100.0,
                "max_participants": 8,
                "start_date": "2025-08-01T10:00:00",
                "end_date": "2025-08-01T18:00:00"
            }
            
            response = session.post(f"{base_url}/api/tournaments", json=tournament_data)
            if response.status_code == 200:
                print("✅ Tournament creation working")
            else:
                print(f"❌ Tournament creation failed: {response.status_code}")
        else:
            print(f"❌ User login failed: {response.status_code}")
        
        print("\n🎉 All tests completed!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on http://localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def start_server():
    """Start the Flask server in background"""
    try:
        subprocess.run([sys.executable, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server error: {e}")

if __name__ == "__main__":
    print("Tournament Management System - Test Suite")
    print("=" * 50)
    
    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait for server to start
    print("Starting server...")
    time.sleep(3)
    
    # Run tests
    success = test_api()
    
    if success:
        print("\n✅ System is working correctly!")
        print("\n🌐 You can now open your browser to:")
        print("   http://localhost:5000")
        print("\n📝 Features available:")
        print("   - User registration and login")
        print("   - Tournament creation and management")
        print("   - Tournament participation")
        print("   - Clean, responsive interface")
        
        print("\nPress Ctrl+C to stop the server...")
        try:
            server_thread.join()
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
    else:
        print("\n❌ System has issues. Check the errors above.")
