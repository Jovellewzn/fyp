"""
EMERGENCY BACKEND FIX
====================
A minimal working backend to fix your connection issues
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import threading
import time

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('tournament_app.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})

@app.route('/api/tournaments')
def get_tournaments():
    try:
        conn = get_db_connection()
        tournaments = conn.execute('''
            SELECT t.*, 
                   COUNT(tp.user_id) as participant_count,
                   u.username as organizer_name
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            LEFT JOIN users u ON t.organizer_id = u.id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        ''').fetchall()
        
        tournaments_list = []
        for tournament in tournaments:
            tournaments_list.append({
                'id': tournament['id'],
                'title': tournament['title'],
                'description': tournament['description'],
                'game_type': tournament['game_type'],
                'entry_fee': tournament['entry_fee'],
                'prize_pool': tournament['prize_pool'],
                'max_participants': tournament['max_participants'],
                'participant_count': tournament['participant_count'],
                'start_date': tournament['start_date'],
                'end_date': tournament['end_date'],
                'status': tournament['status'],
                'organizer_name': tournament['organizer_name']
            })
        
        conn.close()
        return jsonify({'success': True, 'tournaments': tournaments_list})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/tournaments')
def get_ai_tournaments():
    try:
        conn = get_db_connection()
        tournaments = conn.execute('''
            SELECT t.*, 
                   COUNT(tp.user_id) as participant_count,
                   u.username as organizer_name
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            LEFT JOIN users u ON t.organizer_id = u.id
            WHERE t.status = 'upcoming' OR t.status = 'active'
            GROUP BY t.id
            HAVING participant_count >= 4
            ORDER BY t.start_date DESC
        ''').fetchall()
        
        tournaments_list = []
        for tournament in tournaments:
            tournaments_list.append({
                'id': tournament['id'],
                'title': tournament['title'],
                'game_type': tournament['game_type'],
                'participant_count': tournament['participant_count'],
                'max_participants': tournament['max_participants'],
                'start_date': tournament['start_date'],
                'status': tournament['status'],
                'organizer_name': tournament['organizer_name']
            })
        
        conn.close()
        return jsonify({'success': True, 'tournaments': tournaments_list})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/')
def index():
    return send_from_directory('src', 'index.html')

@app.route('/<path:filename>')
def serve_files(filename):
    return send_from_directory('src', filename)

def init_db_if_needed():
    """Initialize database if needed"""
    try:
        if not os.path.exists('tournament_app.db'):
            print("Creating database...")
            import db
            db.init_database()
            db.quick_setup()
            print("✅ Database created!")
        else:
            # Check if has data
            conn = sqlite3.connect('tournament_app.db')
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            conn.close()
            if user_count == 0:
                print("Adding sample data...")
                import db
                db.quick_setup()
                print("✅ Sample data added!")
    except Exception as e:
        print(f"Database setup error: {e}")

def start_server():
    """Start the server"""
    print("🚀 EMERGENCY BACKEND STARTING...")
    print("=" * 40)
    
    # Setup database
    init_db_if_needed()
    
    print("✅ Backend ready!")
    print("🌐 Server: http://localhost:5000")
    print("🔥 Your website should work now!")
    print("=" * 40)
    
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)

if __name__ == "__main__":
    start_server()
