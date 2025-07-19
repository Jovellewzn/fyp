"""
Database Management Module
=========================
Database utilities and connection management for Tournament System
"""

import sqlite3
import os
from datetime import datetime

DATABASE_NAME = 'tournament_app.db'

def get_db_connection():
    """Get database connection with row factory"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize all database tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            profile_picture TEXT DEFAULT 'default_avatar.png',
            bio TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_login TEXT,
            is_active INTEGER DEFAULT 1
        )
    ''')
    
    # Tournaments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tournaments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            game_type TEXT NOT NULL,
            entry_fee REAL DEFAULT 0,
            prize_pool REAL DEFAULT 0,
            max_participants INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT DEFAULT 'upcoming',
            organizer_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users (id)
        )
    ''')
    
    # Tournament participants table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tournament_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tournament_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            team_name TEXT DEFAULT '',
            joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(tournament_id, user_id)
        )
    ''')
    
    # Match results table (for AI analysis)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS match_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tournament_id INTEGER NOT NULL,
            player1_id INTEGER NOT NULL,
            player2_id INTEGER NOT NULL,
            winner_id INTEGER NOT NULL,
            player1_score INTEGER DEFAULT 0,
            player2_score INTEGER DEFAULT 0,
            match_date TEXT DEFAULT CURRENT_TIMESTAMP,
            round_number INTEGER DEFAULT 1,
            FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
            FOREIGN KEY (player1_id) REFERENCES users (id),
            FOREIGN KEY (player2_id) REFERENCES users (id),
            FOREIGN KEY (winner_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")

def check_database():
    """Check database status and tables"""
    if not os.path.exists(DATABASE_NAME):
        print("❌ Database file not found!")
        return False
    
    try:
        conn = get_db_connection()
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        table_names = [table['name'] for table in tables]
        
        required_tables = ['users', 'tournaments', 'tournament_participants', 'match_results']
        missing_tables = [table for table in required_tables if table not in table_names]
        
        if missing_tables:
            print(f"❌ Missing tables: {', '.join(missing_tables)}")
            conn.close()
            return False
        
        # Check data counts
        user_count = conn.execute("SELECT COUNT(*) as count FROM users").fetchone()['count']
        tournament_count = conn.execute("SELECT COUNT(*) as count FROM tournaments").fetchone()['count']
        
        print(f"✅ Database OK: {user_count} users, {tournament_count} tournaments")
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def add_sample_user(username, email, password_hash):
    """Add a sample user"""
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash)
        )
        conn.commit()
        print(f"✅ Added user: {username}")
        return True
    except sqlite3.IntegrityError:
        print(f"⚠️  User {username} already exists")
        return False
    except Exception as e:
        print(f"❌ Error adding user {username}: {e}")
        return False
    finally:
        conn.close()

def add_sample_tournament(title, description, game_type, max_participants, organizer_id=1):
    """Add a sample tournament"""
    conn = get_db_connection()
    try:
        start_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        end_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor = conn.execute('''
            INSERT INTO tournaments 
            (title, description, game_type, max_participants, start_date, end_date, organizer_id, entry_fee, prize_pool, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (title, description, game_type, max_participants, start_date, end_date, organizer_id, 10.0, 100.0, 'upcoming'))
        
        tournament_id = cursor.lastrowid
        conn.commit()
        print(f"✅ Added tournament: {title} (ID: {tournament_id})")
        return tournament_id
    except Exception as e:
        print(f"❌ Error adding tournament {title}: {e}")
        return None
    finally:
        conn.close()

def quick_setup():
    """Quick database setup with sample data"""
    print("🚀 Quick Database Setup...")
    
    # Initialize database
    init_database()
    
    # Add sample users
    import hashlib
    sample_users = [
        ("admin", "admin@tournament.com", hashlib.sha256("admin123".encode()).hexdigest()),
        ("player1", "player1@example.com", hashlib.sha256("password".encode()).hexdigest()),
        ("player2", "player2@example.com", hashlib.sha256("password".encode()).hexdigest()),
        ("player3", "player3@example.com", hashlib.sha256("password".encode()).hexdigest()),
        ("player4", "player4@example.com", hashlib.sha256("password".encode()).hexdigest()),
    ]
    
    for username, email, password_hash in sample_users:
        add_sample_user(username, email, password_hash)
    
    # Add sample tournaments
    sample_tournaments = [
        ("Valorant Championship", "Competitive Valorant tournament", "Valorant", 16),
        ("League of Legends Cup", "LoL 5v5 tournament", "League of Legends", 10),
        ("CS2 Pro Series", "Counter-Strike 2 competition", "CS2", 12),
        ("Apex Legends Battle", "Battle royale tournament", "Apex Legends", 20),
        ("Overwatch Masters", "6v6 Overwatch competition", "Overwatch", 8),
    ]
    
    for title, description, game_type, max_participants in sample_tournaments:
        tournament_id = add_sample_tournament(title, description, game_type, max_participants)
        
        # Add some participants to tournaments
        if tournament_id:
            conn = get_db_connection()
            for user_id in range(2, min(6, max_participants + 1)):  # Add users 2-5 as participants
                try:
                    conn.execute(
                        "INSERT INTO tournament_participants (tournament_id, user_id, team_name) VALUES (?, ?, ?)",
                        (tournament_id, user_id, f"Team{user_id}")
                    )
                except:
                    pass  # Skip if already exists
            conn.commit()
            conn.close()
    
    print("🎉 Database setup complete!")

if __name__ == "__main__":
    print("Database Management System")
    print("=" * 30)
    
    if not check_database():
        print("Setting up database...")
        quick_setup()
    else:
        print("Database is ready!")
