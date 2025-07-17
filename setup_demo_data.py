#!/usr/bin/env python3
"""
Quick setup script to add demo users and friend requests
"""

import sqlite3
import hashlib
from datetime import datetime

def setup_demo_data():
    """Add demo users and create sample friend requests"""
    
    print("🚀 Setting up demo data for friend requests...")
    
    # Connect to database
    conn = sqlite3.connect('tournament_app.db')
    cursor = conn.cursor()
    
    # Demo users to add
    demo_users = [
        {'username': 'Alex_Gamer', 'email': 'alex@example.com', 'bio': 'Pro FPS player'},
        {'username': 'Sarah_Pro', 'email': 'sarah@example.com', 'bio': 'Tournament organizer'},
        {'username': 'Mike_Champion', 'email': 'mike@example.com', 'bio': 'Rocket League champion'},
        {'username': 'Luna_Streamer', 'email': 'luna@example.com', 'bio': 'Content creator'},
    ]
    
    # Add users if they don't exist
    user_ids = []
    for user in demo_users:
        try:
            existing = cursor.execute('SELECT id FROM users WHERE username = ?', (user['username'],)).fetchone()
            if existing:
                user_ids.append(existing[0])
                print(f"✅ User {user['username']} already exists (ID: {existing[0]})")
            else:
                password_hash = hashlib.sha256("demo123".encode()).hexdigest()
                cursor.execute('''
                    INSERT INTO users (username, email, password_hash, bio, created_at, is_active)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (user['username'], user['email'], password_hash, user['bio'], 
                      datetime.now().isoformat(), 1))
                user_ids.append(cursor.lastrowid)
                print(f"✅ Added user: {user['username']} (ID: {cursor.lastrowid})")
        except Exception as e:
            print(f"❌ Error with user {user['username']}: {e}")
    
    # Create friend requests (assuming current user is ID 1)
    current_user_id = 1
    
    # Create some pending friend requests TO user 1
    if len(user_ids) >= 3:
        try:
            # User 2 sends request to User 1
            cursor.execute('''
                INSERT OR REPLACE INTO user_connections 
                (follower_id, following_id, connection_type, created_at)
                VALUES (?, ?, ?, ?)
            ''', (user_ids[0], current_user_id, 'pending', datetime.now().isoformat()))
            
            # User 3 sends request to User 1  
            cursor.execute('''
                INSERT OR REPLACE INTO user_connections 
                (follower_id, following_id, connection_type, created_at)
                VALUES (?, ?, ?, ?)
            ''', (user_ids[1], current_user_id, 'pending', datetime.now().isoformat()))
            
            # User 4 sends request to User 1
            cursor.execute('''
                INSERT OR REPLACE INTO user_connections 
                (follower_id, following_id, connection_type, created_at)
                VALUES (?, ?, ?, ?)
            ''', (user_ids[2], current_user_id, 'pending', datetime.now().isoformat()))
            
            print(f"✅ Created friend requests to user {current_user_id}")
            
        except Exception as e:
            print(f"❌ Error creating friend requests: {e}")
    
    # Commit changes
    conn.commit()
    
    # Show pending requests
    print("\n📬 Pending friend requests for user 1:")
    pending = cursor.execute('''
        SELECT uc.*, u.username as follower_username, u.email as follower_email
        FROM user_connections uc
        JOIN users u ON uc.follower_id = u.id
        WHERE uc.following_id = ? AND uc.connection_type = 'pending'
    ''', (current_user_id,)).fetchall()
    
    for request in pending:
        print(f"   📬 {request[4]} wants to follow you (Request ID: {request[0]})")
    
    print(f"\n🎯 Demo setup complete!")
    print(f"   1. Start server: python backend_api.py")
    print(f"   2. Open src/index.html")
    print(f"   3. Look for '📬 Friend Requests' section")
    print(f"   4. You should see {len(pending)} pending requests!")
    
    conn.close()

if __name__ == "__main__":
    setup_demo_data()
