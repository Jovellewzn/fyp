"""
Add Sample Data for AI Bracket Generator Demo
===========================================
This script adds sample data to demonstrate the AI Bracket Generator
"""

import sqlite3
from datetime import datetime, timedelta
import random

def add_sample_data():
    conn = sqlite3.connect('tournament_app.db')
    cursor = conn.cursor()
    
    # Add sample users (players)
    sample_users = [
        ('ProGamer123', 'progamer@email.com', 'password123', 'Elite FPS player with championship experience'),
        ('EliteShooter', 'elite@email.com', 'password123', 'Precision shooter with tactical expertise'),
        ('StrategyMaster', 'strategy@email.com', 'password123', 'Strategic genius with tournament wins'),
        ('QuickScope', 'quick@email.com', 'password123', 'Lightning fast reflexes and accuracy'),
        ('TeamLeader', 'leader@email.com', 'password123', 'Natural leader with team coordination skills'),
        ('SniperKing', 'sniper@email.com', 'password123', 'Long-range specialist with deadly precision'),
        ('RushExpert', 'rush@email.com', 'password123', 'Aggressive playstyle with high impact'),
        ('TacticalAce', 'tactical@email.com', 'password123', 'Tactical mastermind with clutch performances'),
        ('FlashGaming', 'flash@email.com', 'password123', 'Speed demon with incredible reaction time'),
        ('SteelNerve', 'steel@email.com', 'password123', 'Cool under pressure with tournament experience')
    ]
    
    # Hash password (simple hash for demo)
    import hashlib
    
    for username, email, password, bio in sample_users:
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, bio, created_at) 
                VALUES (?, ?, ?, ?, ?)
            ''', (username, email, password_hash, bio, datetime.now().isoformat()))
        except sqlite3.IntegrityError:
            # User already exists, skip
            pass
    
    # Add sample tournaments
    tomorrow = datetime.now() + timedelta(days=1)
    next_week = datetime.now() + timedelta(days=7)
    
    sample_tournaments = [
        ('CS:GO Championship 2025', 'Professional CS:GO tournament with big prizes', 'FPS', 50.0, 5000.0, 16, tomorrow.isoformat(), next_week.isoformat(), 'upcoming'),
        ('League of Legends Masters', 'Elite LoL tournament for skilled players', 'MOBA', 25.0, 2500.0, 10, tomorrow.isoformat(), next_week.isoformat(), 'active'),
        ('Fortnite Battle Arena', 'High-stakes battle royale competition', 'Battle Royale', 20.0, 1000.0, 8, tomorrow.isoformat(), next_week.isoformat(), 'upcoming'),
        ('Street Fighter Showdown', 'Classic fighting game tournament', 'Fighting', 15.0, 800.0, 8, tomorrow.isoformat(), next_week.isoformat(), 'active'),
        ('FIFA World Cup Gaming', 'Virtual football championship', 'Sports', 10.0, 500.0, 12, tomorrow.isoformat(), next_week.isoformat(), 'upcoming')
    ]
    
    tournament_ids = []
    for title, desc, game_type, entry_fee, prize_pool, max_participants, start_date, end_date, status in sample_tournaments:
        try:
            cursor.execute('''
                INSERT INTO tournaments (title, description, game_type, entry_fee, prize_pool, max_participants, start_date, end_date, status, organizer_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (title, desc, game_type, entry_fee, prize_pool, max_participants, start_date, end_date, status, 1, datetime.now().isoformat()))
            tournament_ids.append(cursor.lastrowid)
        except sqlite3.IntegrityError:
            # Tournament might already exist
            existing = cursor.execute('SELECT id FROM tournaments WHERE title = ?', (title,)).fetchone()
            if existing:
                tournament_ids.append(existing[0])
    
    # Add participants to tournaments
    user_ids = [row[0] for row in cursor.execute('SELECT id FROM users ORDER BY id').fetchall()]
    
    for tournament_id in tournament_ids:
        # Get tournament info
        tournament = cursor.execute('SELECT max_participants FROM tournaments WHERE id = ?', (tournament_id,)).fetchone()
        max_participants = tournament[0]
        
        # Add random participants (ensure at least 4 for AI bracket)
        num_participants = min(max_participants, random.randint(6, len(user_ids)))
        selected_users = random.sample(user_ids, num_participants)
        
        for user_id in selected_users:
            try:
                cursor.execute('''
                    INSERT INTO tournament_participants (tournament_id, user_id, team_name, registration_date, status)
                    VALUES (?, ?, ?, ?, ?)
                ''', (tournament_id, user_id, f'Team_{user_id}', datetime.now().isoformat(), 'confirmed'))
            except sqlite3.IntegrityError:
                # Participant already exists
                pass
    
    # Add sample match results for realistic AI predictions
    for tournament_id in tournament_ids:
        participants = cursor.execute('''
            SELECT user_id FROM tournament_participants WHERE tournament_id = ?
        ''', (tournament_id,)).fetchall()
        
        participant_ids = [p[0] for p in participants]
        
        # Generate some random match results
        for _ in range(min(10, len(participant_ids) * 2)):  # Generate some matches
            if len(participant_ids) >= 2:
                player1, player2 = random.sample(participant_ids, 2)
                
                # Random scores and winner
                score1 = random.randint(0, 30)
                score2 = random.randint(0, 30)
                winner = player1 if score1 > score2 else player2
                
                try:
                    cursor.execute('''
                        INSERT INTO match_results (tournament_id, player1_id, player2_id, winner_id, match_round, match_date, score_player1, score_player2, match_type)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (tournament_id, player1, player2, winner, 1, datetime.now().isoformat(), score1, score2, 'standard'))
                except sqlite3.IntegrityError:
                    # Match might already exist
                    pass
    
    conn.commit()
    conn.close()
    print("✅ Sample data added successfully!")
    print("🎮 Tournaments created with participants")
    print("📊 Match history generated for AI analysis")
    print("🤖 AI Bracket Generator is ready for demo!")

if __name__ == '__main__':
    add_sample_data()
