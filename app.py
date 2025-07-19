"""
Tournament Management System
============================
Simple tournament app for Final Year Project
Author: Student Final Year Project
"""

from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime
import os
import random
import math

app = Flask(__name__)
CORS(app)
app.secret_key = 'your_secret_key_here'  # Change this in production

# Database initialization
def init_database():
    """Initialize the tournament database"""
    conn = sqlite3.connect('tournament_app.db')
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
            tournament_id INTEGER,
            user_id INTEGER,
            team_name TEXT,
            registration_date TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'registered',
            placement INTEGER,
            score REAL,
            FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(tournament_id, user_id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Utility functions
def hash_password(password):
    """Hash password for secure storage"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hash):
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == hash

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('tournament_app.db')
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

# Routes
@app.route('/')
def home():
    """Home page"""
    from flask import send_from_directory
    return send_from_directory('src', 'index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'success': False, 'error': 'All fields are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE username = ? OR email = ?', (username, email))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Username or email already exists'}), 400
        
        # Create new user
        password_hash = hash_password(password)
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES (?, ?, ?, ?)
        ''', (username, email, password_hash, datetime.now().isoformat()))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return jsonify({'success': False, 'error': 'Username and password are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user
        cursor.execute('SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?', 
                      (username, username))
        user = cursor.fetchone()
        
        if not user or not verify_password(password, user['password_hash']):
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        # Update last login
        cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', 
                      (datetime.now().isoformat(), user['id']))
        conn.commit()
        conn.close()
        
        # Store user in session
        session['user_id'] = user['id']
        session['username'] = user['username']
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """User logout"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    """Get all tournaments"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT t.*, u.username as organizer_name,
                   COUNT(tp.id) as participant_count
            FROM tournaments t
            LEFT JOIN users u ON t.organizer_id = u.id
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            GROUP BY t.id
            ORDER BY t.start_date DESC
        ''')
        
        tournaments = []
        for row in cursor.fetchall():
            tournaments.append({
                'id': row['id'],
                'title': row['title'],
                'description': row['description'],
                'game_type': row['game_type'],
                'entry_fee': row['entry_fee'],
                'prize_pool': row['prize_pool'],
                'max_participants': row['max_participants'],
                'start_date': row['start_date'],
                'end_date': row['end_date'],
                'status': row['status'],
                'organizer_name': row['organizer_name'],
                'participant_count': row['participant_count']
            })
        
        conn.close()
        return jsonify({'success': True, 'tournaments': tournaments})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tournaments', methods=['POST'])
def create_tournament():
    """Create new tournament"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Not logged in'}), 401
        
        data = request.get_json()
        required_fields = ['title', 'game_type', 'max_participants', 'start_date', 'end_date']
        
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO tournaments 
            (title, description, game_type, entry_fee, prize_pool, max_participants, 
             start_date, end_date, organizer_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['title'],
            data.get('description', ''),
            data['game_type'],
            data.get('entry_fee', 0),
            data.get('prize_pool', 0),
            data['max_participants'],
            data['start_date'],
            data['end_date'],
            session['user_id'],
            datetime.now().isoformat()
        ))
        
        tournament_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Tournament created successfully',
            'tournament_id': tournament_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tournaments/<int:tournament_id>/join', methods=['POST'])
def join_tournament(tournament_id):
    """Join a tournament"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Not logged in'}), 401
        
        data = request.get_json()
        team_name = data.get('team_name', f"Team_{session['username']}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if tournament exists and has space
        cursor.execute('''
            SELECT t.*, COUNT(tp.id) as participant_count
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            WHERE t.id = ?
            GROUP BY t.id
        ''', (tournament_id,))
        
        tournament = cursor.fetchone()
        if not tournament:
            return jsonify({'success': False, 'error': 'Tournament not found'}), 404
        
        if tournament['participant_count'] >= tournament['max_participants']:
            return jsonify({'success': False, 'error': 'Tournament is full'}), 400
        
        # Check if user already joined
        cursor.execute('SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?',
                      (tournament_id, session['user_id']))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Already joined this tournament'}), 400
        
        # Join tournament
        cursor.execute('''
            INSERT INTO tournament_participants (tournament_id, user_id, team_name, registration_date)
            VALUES (?, ?, ?, ?)
        ''', (tournament_id, session['user_id'], team_name, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Successfully joined tournament'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tournaments/<int:tournament_id>/participants', methods=['GET'])
def get_participants(tournament_id):
    """Get tournament participants"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT tp.*, u.username
            FROM tournament_participants tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.tournament_id = ?
            ORDER BY tp.registration_date
        ''', (tournament_id,))
        
        participants = []
        for row in cursor.fetchall():
            participants.append({
                'id': row['id'],
                'username': row['username'],
                'team_name': row['team_name'],
                'registration_date': row['registration_date'],
                'status': row['status'],
                'placement': row['placement'],
                'score': row['score']
            })
        
        conn.close()
        return jsonify({'success': True, 'participants': participants})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Not logged in'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user details
        cursor.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],))
        user = cursor.fetchone()
        
        # Get user's tournaments
        cursor.execute('''
            SELECT t.title, t.game_type, tp.team_name, tp.placement, tp.score, t.start_date
            FROM tournament_participants tp
            JOIN tournaments t ON tp.tournament_id = t.id
            WHERE tp.user_id = ?
            ORDER BY t.start_date DESC
        ''', (session['user_id'],))
        
        tournaments = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'bio': user['bio'],
                'created_at': user['created_at'],
                'tournaments': [dict(t) for t in tournaments]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/tournaments')
def get_tournaments_for_ai():
    """Get tournaments with participants for AI bracket generation"""
    try:
        conn = get_db_connection()
        
        # Get tournaments with participant count
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

@app.route('/api/ai/tournament/<int:tournament_id>/participants')
def get_tournament_participants_for_ai(tournament_id):
    """Get tournament participants with their stats for AI analysis"""
    try:
        conn = get_db_connection()
        
        # Get participants with their match history
        participants = conn.execute('''
            SELECT u.id, u.username, tp.team_name,
                   COUNT(CASE WHEN mr.winner_id = u.id THEN 1 END) as wins,
                   COUNT(mr.id) as total_matches,
                   AVG(CASE WHEN mr.player1_id = u.id THEN mr.score_player1 
                            WHEN mr.player2_id = u.id THEN mr.score_player2 END) as avg_score
            FROM tournament_participants tp
            JOIN users u ON tp.user_id = u.id
            LEFT JOIN match_results mr ON (mr.player1_id = u.id OR mr.player2_id = u.id)
            WHERE tp.tournament_id = ?
            GROUP BY u.id, u.username, tp.team_name
            ORDER BY wins DESC, avg_score DESC
        ''', (tournament_id,)).fetchall()
        
        participants_list = []
        for participant in participants:
            win_rate = (participant['wins'] / participant['total_matches'] * 100) if participant['total_matches'] > 0 else 50
            skill_rating = min(100, (win_rate + (participant['avg_score'] or 0)))
            
            participants_list.append({
                'id': participant['id'],
                'username': participant['username'],
                'team_name': participant['team_name'],
                'wins': participant['wins'],
                'total_matches': participant['total_matches'],
                'win_rate': round(win_rate, 1),
                'avg_score': round(participant['avg_score'] or 0, 1),
                'skill_rating': round(skill_rating, 1)
            })
        
        conn.close()
        return jsonify({'success': True, 'participants': participants_list})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/generate-bracket', methods=['POST'])
def generate_ai_bracket():
    """Generate AI-powered tournament bracket"""
    try:
        data = request.get_json()
        tournament_id = data.get('tournament_id')
        bracket_type = data.get('bracket_type', 'single_elimination')
        
        conn = get_db_connection()
        
        # Get tournament info
        tournament = conn.execute('''
            SELECT * FROM tournaments WHERE id = ?
        ''', (tournament_id,)).fetchone()
        
        if not tournament:
            return jsonify({'success': False, 'error': 'Tournament not found'}), 404
        
        # Get participants with stats
        participants = conn.execute('''
            SELECT u.id, u.username, tp.team_name,
                   COUNT(CASE WHEN mr.winner_id = u.id THEN 1 END) as wins,
                   COUNT(mr.id) as total_matches,
                   AVG(CASE WHEN mr.player1_id = u.id THEN mr.score_player1 
                            WHEN mr.player2_id = u.id THEN mr.score_player2 END) as avg_score
            FROM tournament_participants tp
            JOIN users u ON tp.user_id = u.id
            LEFT JOIN match_results mr ON (mr.player1_id = u.id OR mr.player2_id = u.id)
            WHERE tp.tournament_id = ?
            GROUP BY u.id, u.username, tp.team_name
        ''', (tournament_id,)).fetchall()
        
        if len(participants) < 4:
            return jsonify({'success': False, 'error': 'Need at least 4 participants'}), 400
        
        # Calculate AI predictions
        bracket_data = generate_smart_bracket(participants, tournament['game_type'])
        
        conn.close()
        
        return jsonify({
            'success': True,
            'tournament': {
                'id': tournament['id'],
                'title': tournament['title'],
                'game_type': tournament['game_type']
            },
            'bracket': bracket_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_smart_bracket(participants, game_type):
    """Generate intelligent bracket based on player stats"""
    import random
    import math
    
    # Convert to list of dicts for easier manipulation
    players = []
    for p in participants:
        win_rate = (p['wins'] / p['total_matches'] * 100) if p['total_matches'] > 0 else 50
        skill_rating = min(100, (win_rate + (p['avg_score'] or 0)))
        
        players.append({
            'id': p['id'],
            'username': p['username'],
            'team_name': p['team_name'],
            'wins': p['wins'],
            'total_matches': p['total_matches'],
            'win_rate': win_rate,
            'skill_rating': skill_rating
        })
    
    # Sort by skill rating for seeding
    players.sort(key=lambda x: x['skill_rating'], reverse=True)
    
    # Generate bracket rounds
    rounds = []
    current_players = players.copy()
    round_num = 1
    
    while len(current_players) > 1:
        round_matches = []
        next_round_players = []
        
        # Pair players for matches
        for i in range(0, len(current_players), 2):
            if i + 1 < len(current_players):
                player1 = current_players[i]
                player2 = current_players[i + 1]
                
                # Calculate win probability based on skill ratings
                skill_diff = player1['skill_rating'] - player2['skill_rating']
                base_prob = 50 + (skill_diff * 0.5)  # Each skill point = 0.5% advantage
                player1_win_prob = max(25, min(75, base_prob))  # Keep between 25-75%
                player2_win_prob = 100 - player1_win_prob
                
                # Determine winner (higher skill rating favored but not guaranteed)
                if random.random() < (player1_win_prob / 100):
                    winner = player1
                else:
                    winner = player2
                
                next_round_players.append(winner)
                
                # Generate AI analysis
                analysis = generate_match_analysis(player1, player2, winner, game_type)
                
                round_matches.append({
                    'player1': player1,
                    'player2': player2,
                    'player1_win_prob': round(player1_win_prob, 1),
                    'player2_win_prob': round(player2_win_prob, 1),
                    'predicted_winner': winner,
                    'ai_analysis': analysis
                })
            else:
                # Bye round
                next_round_players.append(current_players[i])
                round_matches.append({
                    'player1': current_players[i],
                    'player2': None,
                    'bye_round': True,
                    'ai_analysis': f"{current_players[i]['username']} advances automatically"
                })
        
        rounds.append({
            'round_number': round_num,
            'round_name': get_round_name(len(current_players)),
            'matches': round_matches
        })
        
        current_players = next_round_players
        round_num += 1
    
    return {
        'rounds': rounds,
        'predicted_champion': current_players[0] if current_players else None
    }

def generate_match_analysis(player1, player2, winner, game_type):
    """Generate AI analysis for a match"""
    
    game_factors = {
        'FPS': ['aim accuracy', 'reaction time', 'map knowledge', 'positioning'],
        'MOBA': ['strategic thinking', 'team coordination', 'champion mastery', 'objective control'],
        'Battle Royale': ['survival instinct', 'adaptability', 'resource management', 'positioning'],
        'Fighting': ['frame knowledge', 'combo execution', 'mind games', 'adaptation'],
        'Sports': ['game sense', 'timing', 'team chemistry', 'execution'],
        'Strategy': ['planning', 'economic management', 'long-term vision', 'micro-management']
    }
    
    factors = game_factors.get(game_type, ['overall skill', 'experience', 'consistency'])
    factor = random.choice(factors)
    
    analyses = [
        f"{winner['username']} shows superior {factor} based on match history analysis",
        f"AI prediction favors {winner['username']} due to higher win rate ({winner['win_rate']:.1f}%)",
        f"{winner['username']}'s performance pattern suggests better adaptation to tournament pressure",
        f"Statistical modeling indicates {winner['username']} has tactical advantage in {game_type}",
        f"{winner['username']}'s skill progression shows peak competitive form"
    ]
    
    return random.choice(analyses)

def get_round_name(player_count):
    """Get appropriate round name based on player count"""
    if player_count <= 2:
        return 'Finals'
    elif player_count <= 4:
        return 'Semi-Finals'
    elif player_count <= 8:
        return 'Quarter-Finals'
    elif player_count <= 16:
        return 'Round of 16'
    else:
        return f'Round of {player_count}'

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Tournament Management System',
        'version': '1.0',
        'timestamp': datetime.now().isoformat()
    })

# Serve static files from src directory
@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from src directory"""
    import os
    from flask import send_from_directory
    return send_from_directory('src', filename)

@app.route('/login')
def login_page():
    """Serve login page"""
    from flask import send_from_directory
    return send_from_directory('src', 'login.html')

@app.route('/signup')
def signup_page():
    """Serve signup page"""
    from flask import send_from_directory
    return send_from_directory('src', 'signup.html')

@app.route('/tournaments')
def tournaments_page():
    """Serve tournaments page"""
    from flask import send_from_directory
    return send_from_directory('src', 'tournaments.html')

@app.route('/profile')
def profile_page():
    """Serve profile page"""
    from flask import send_from_directory
    return send_from_directory('src', 'profile.html')

if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    
    print("Tournament Management System Starting...")
    print("=" * 50)
    print("Web Interface: http://localhost:5000")
    print("API Endpoints available:")
    print("  - POST /api/auth/register")
    print("  - POST /api/auth/login")
    print("  - GET  /api/tournaments")
    print("  - POST /api/tournaments")
    print("  - POST /api/tournaments/<id>/join")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
