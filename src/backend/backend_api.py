from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import datetime
import json
import time
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

DATABASE = '../../tournament_app.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    # Enable foreign key constraints
    conn.execute('PRAGMA foreign_keys = ON')
    return conn

def dict_factory(cursor, row):
    """Convert sqlite3.Row to dictionary"""
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

def generate_unique_email(username, conn):
    """Generate a unique email for a user to avoid UNIQUE constraint violations"""
    # Try the basic format first
    basic_email = f"{username}@example.com"
    existing = conn.execute('SELECT id FROM users WHERE email = ?', (basic_email,)).fetchone()
    
    if not existing:
        return basic_email
    
    # If basic email exists, add timestamp
    timestamp_email = f"{username}_{int(time.time())}@example.com"
    existing = conn.execute('SELECT id FROM users WHERE email = ?', (timestamp_email,)).fetchone()
    
    if not existing:
        return timestamp_email
    
    # If timestamp email also exists (very rare), add random number
    unique_email = f"{username}_{int(time.time())}_{random.randint(1000,9999)}@example.com"
    return unique_email

# ==================== TOURNAMENTS CRUD ====================

@app.route('/api/tournaments', methods=['GET'])
def get_all_tournaments():
    conn = get_db_connection()
    tournaments = conn.execute('''
        SELECT id, title, description, game_type, prize_pool, max_participants, 
               start_date, end_date, status, organizer_id, created_at
        FROM tournaments
        ORDER BY start_date ASC
    ''').fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in tournaments])

@app.route('/api/users', methods=['GET'])
def get_all_users():
    conn = get_db_connection()
    users = conn.execute('''
        SELECT id, username, email, bio, created_at, is_active
        FROM users
        ORDER BY created_at DESC
    ''').fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in users])

@app.route('/api/user/<userid>', methods=['GET'])
def profile(userid):
    conn = get_db_connection()
    user = conn.execute('''
        SELECT id, username, bio, last_login
        FROM users
        WHERE id = ?
    ''', (userid,)).fetchone()
    conn.close()
    
    if user:
        return jsonify(dict(user))
    else:
        return jsonify({'error': 'User not found'}), 404

# ==================== TOURNAMENT PARTICIPANTS CRUD ====================

@app.route('/api/tournaments/<tournament_id>/participants', methods=['GET'])
def get_tournament_participants(tournament_id):
    conn = get_db_connection()
    participants = conn.execute('''
        SELECT tp.*, u.username 
        FROM tournament_participants tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.tournament_id = ?
        ORDER BY tp.registration_date DESC
    ''', (tournament_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in participants])

@app.route('/api/tournaments/<tournament_id>/participants', methods=['POST'])
def join_tournament(tournament_id):
    data = request.get_json()
    username = data.get('username')
    team_name = data.get('teamName', '')
    
    print(f"🔍 DEBUG: Joining tournament {tournament_id} with username: {username}, team: {team_name}")
    
    conn = get_db_connection()
    
    try:
        # First, check if tournament exists
        tournament = conn.execute('SELECT id FROM tournaments WHERE id = ?', (tournament_id,)).fetchone()
        if not tournament:
            print(f"🔍 DEBUG: Tournament {tournament_id} does not exist!")
            
            # List existing tournaments for debugging
            existing_tournaments = conn.execute('SELECT id, title FROM tournaments').fetchall()
            print(f"🔍 DEBUG: Available tournaments: {[dict(t) for t in existing_tournaments]}")
            
            conn.close()
            return jsonify({'error': f'Tournament {tournament_id} does not exist'}), 404
        
        print(f"🔍 DEBUG: Tournament {tournament_id} exists")
        
        # Check if user exists by username first
        user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
        if not user:
            # Generate a unique email to avoid conflicts
            unique_email = generate_unique_email(username, conn)
            print(f"🔍 DEBUG: Creating new user with email: {unique_email}")
            
            cursor = conn.execute('''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (username, unique_email, "demo_hash"))
            user_id = cursor.lastrowid
            print(f"🔍 DEBUG: Created user with ID: {user_id}")
        else:
            user_id = user['id']
            print(f"🔍 DEBUG: Found existing user with ID: {user_id}")
        
        # Check if already joined
        existing = conn.execute('''
            SELECT id FROM tournament_participants 
            WHERE tournament_id = ? AND user_id = ?
        ''', (tournament_id, user_id)).fetchone()
        
        if existing:
            print(f"🔍 DEBUG: User already joined tournament")
            conn.close()
            return jsonify({'error': 'Already joined tournament'}), 400
        
        # Join tournament
        print(f"🔍 DEBUG: Inserting participant: tournament_id={tournament_id}, user_id={user_id}, team_name={team_name}")
        cursor = conn.execute('''
            INSERT INTO tournament_participants (tournament_id, user_id, team_name)
            VALUES (?, ?, ?)
        ''', (tournament_id, user_id, team_name))
        
        participant_id = cursor.lastrowid
        print(f"🔍 DEBUG: Created participant with ID: {participant_id}")
        
        conn.commit()
        print(f"🔍 DEBUG: Transaction committed successfully")
        conn.close()
        
        return jsonify({'success': True, 'message': 'Successfully joined tournament'})
    except Exception as e:
        print(f"🔍 DEBUG: Exception occurred: {str(e)}")
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/participants/<int:participant_id>', methods=['PUT'])
def update_participant(participant_id):
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        # Get the current participant to find the user_id
        participant = conn.execute('''
            SELECT user_id FROM tournament_participants WHERE id = ?
        ''', (participant_id,)).fetchone()
        
        if not participant:
            conn.close()
            return jsonify({'error': 'Participant not found'}), 404
        
        user_id = participant['user_id']
        
        # Update team name in tournament_participants
        if 'teamName' in data:
            conn.execute('''
                UPDATE tournament_participants 
                SET team_name = ?
                WHERE id = ?
            ''', (data.get('teamName', ''), participant_id))
        
        # Update username in users table if provided
        if 'username' in data and data['username'].strip():
            # Check if the new username already exists for a different user
            existing_user = conn.execute('''
                SELECT id FROM users WHERE username = ? AND id != ?
            ''', (data['username'], user_id)).fetchone()
            
            if existing_user:
                conn.close()
                return jsonify({'error': 'Username already exists'}), 400
            
            conn.execute('''
                UPDATE users 
                SET username = ?
                WHERE id = ?
            ''', (data['username'], user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Participant updated'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/participants/<int:participant_id>', methods=['DELETE'])
def remove_participant(participant_id):
    print(f"🔍 DEBUG: Attempting to delete participant with ID: {participant_id} (type: {type(participant_id)})")
    conn = get_db_connection()
    try:
        # Check current participants count
        total_before = conn.execute('SELECT COUNT(*) FROM tournament_participants').fetchone()[0]
        print(f"🔍 DEBUG: Total participants before deletion: {total_before}")
        
        # Check if participant exists before deletion
        existing = conn.execute('SELECT * FROM tournament_participants WHERE id = ?', (participant_id,)).fetchone()
        if existing:
            print(f"🔍 DEBUG: Found participant: {dict(existing)}")
        else:
            print(f"🔍 DEBUG: No participant found with ID {participant_id}")
            
            # Let's also check what IDs exist
            all_ids = conn.execute('SELECT id FROM tournament_participants ORDER BY id').fetchall()
            print(f"🔍 DEBUG: All existing participant IDs: {[row[0] for row in all_ids]}")
            
            conn.close()
            return jsonify({'error': 'Participant not found'}), 404
        
        # Delete the participant
        print(f"🔍 DEBUG: Executing DELETE for participant ID: {participant_id}")
        cursor = conn.execute('DELETE FROM tournament_participants WHERE id = ?', (participant_id,))
        rows_affected = cursor.rowcount
        print(f"🔍 DEBUG: Rows affected by DELETE: {rows_affected}")
        
        if rows_affected == 0:
            print(f"🔍 DEBUG: WARNING: No rows were affected by DELETE operation!")
            conn.close()
            return jsonify({'error': 'No rows deleted'}), 400
        
        # Commit the transaction
        conn.commit()
        print(f"🔍 DEBUG: Delete transaction committed successfully")
        
        # Verify deletion by counting again
        total_after = conn.execute('SELECT COUNT(*) FROM tournament_participants').fetchone()[0]
        print(f"🔍 DEBUG: Total participants after deletion: {total_after}")
        
        # Double check specific participant is gone
        check = conn.execute('SELECT * FROM tournament_participants WHERE id = ?', (participant_id,)).fetchone()
        if check:
            print(f"🔍 DEBUG: ERROR: Participant still exists after deletion: {dict(check)}")
            conn.close()
            return jsonify({'error': 'Deletion failed - participant still exists'}), 500
        else:
            print(f"🔍 DEBUG: SUCCESS: Participant {participant_id} successfully removed from database")
        
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Participant removed',
            'participants_before': total_before,
            'participants_after': total_after,
            'rows_affected': rows_affected
        })
    except Exception as e:
        print(f"🔍 DEBUG: Exception during deletion: {str(e)}")
        import traceback
        print(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
        conn.close()
        return jsonify({'error': str(e)}), 500

# ==================== USER CONNECTIONS CRUD ====================

@app.route('/api/users/<int:user_id>/connections', methods=['GET'])
def get_user_connections(user_id):
    conn = get_db_connection()
    
    # Get followers (people following this user)
    followers = conn.execute('''
        SELECT uc.*, u.username as follower_username, u.email as follower_email
        FROM user_connections uc
        JOIN users u ON uc.follower_id = u.id
        WHERE uc.following_id = ? AND uc.connection_type = 'accepted'
        ORDER BY uc.created_at DESC
    ''', (user_id,)).fetchall()
    
    # Get following (people this user follows)
    following = conn.execute('''
        SELECT uc.*, u.username as following_username, u.email as following_email
        FROM user_connections uc
        JOIN users u ON uc.following_id = u.id
        WHERE uc.follower_id = ? AND uc.connection_type = 'accepted'
        ORDER BY uc.created_at DESC
    ''', (user_id,)).fetchall()
    
    # Get incoming pending requests (people wanting to follow this user)
    incoming_pending = conn.execute('''
        SELECT uc.*, u.username as requester_username, u.email as requester_email
        FROM user_connections uc
        JOIN users u ON uc.follower_id = u.id
        WHERE uc.following_id = ? AND uc.connection_type = 'pending'
        ORDER BY uc.created_at DESC
    ''', (user_id,)).fetchall()
    
    # Get outgoing pending requests (requests this user sent)
    outgoing_pending = conn.execute('''
        SELECT uc.*, u.username as target_username, u.email as target_email
        FROM user_connections uc
        JOIN users u ON uc.following_id = u.id
        WHERE uc.follower_id = ? AND uc.connection_type = 'pending'
        ORDER BY uc.created_at DESC
    ''', (user_id,)).fetchall()
    
    conn.close()
    
    return jsonify({
        'followers': [dict(row) for row in followers],
        'following': [dict(row) for row in following],
        'incoming_pending': [dict(row) for row in incoming_pending],
        'outgoing_pending': [dict(row) for row in outgoing_pending]
    })

@app.route('/api/users/follow', methods=['POST'])
def follow_user():
    data = request.get_json()
    follower_id = data.get('follower_id')
    following_id = data.get('following_id')

    conn = get_db_connection()
    
    try:
        # Check if connection already exists
        existing = conn.execute('''
            SELECT id FROM user_connections 
            WHERE follower_id = ? AND following_id = ?
        ''', (follower_id, following_id)).fetchone()
        
        if existing:
            conn.close()
            return jsonify({'error': 'Connection already exists'}), 400
        
        # Create follow request
        conn.execute('''
            INSERT INTO user_connections (follower_id, following_id, connection_type)
            VALUES (?, ?, 'pending')
        ''', (follower_id, following_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Follow request sent'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/status', methods=['PUT'])
def update_connection_status(connection_id):
    data = request.get_json()
    new_status = data.get('status')  # 'accepted', 'blocked'
    
    conn = get_db_connection()
    
    try:
        # Get connection details for mutual follow logic
        connection = conn.execute('''
            SELECT * FROM user_connections WHERE id = ?
        ''', (connection_id,)).fetchone()
        
        if not connection:
            conn.close()
            return jsonify({'error': 'Connection not found'}), 404
        
        # Update connection status
        conn.execute('''
            UPDATE user_connections 
            SET connection_type = ?
            WHERE id = ?
        ''', (new_status, connection_id))
        
        # If accepting, create mutual follow
        if new_status == 'accepted':
            # Check if mutual connection already exists
            mutual_exists = conn.execute('''
                SELECT id FROM user_connections 
                WHERE follower_id = ? AND following_id = ?
            ''', (connection['following_id'], connection['follower_id'])).fetchone()
            
            if not mutual_exists:
                conn.execute('''
                    INSERT INTO user_connections (follower_id, following_id, connection_type)
                    VALUES (?, ?, 'accepted')
                ''', (connection['following_id'], connection['follower_id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': f'Connection {new_status}'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>', methods=['DELETE'])
def remove_connection(connection_id):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM user_connections WHERE id = ?', (connection_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Connection removed'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

# ==================== MATCH RESULTS CRUD ====================

@app.route('/api/tournaments/<tournament_id>/matches', methods=['GET'])
def get_tournament_matches(tournament_id):
    conn = get_db_connection()
    matches = conn.execute('''
        SELECT mr.*, 
               u1.username as player1_username,
               u2.username as player2_username,
               w.username as winner_username
        FROM match_results mr
        JOIN users u1 ON mr.player1_id = u1.id
        JOIN users u2 ON mr.player2_id = u2.id
        JOIN users w ON mr.winner_id = w.id
        WHERE mr.tournament_id = ?
        ORDER BY mr.match_date DESC
    ''', (tournament_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in matches])

@app.route('/api/tournaments/<tournament_id>/matches', methods=['POST'])
def report_match_result(tournament_id):
    data = request.get_json()
    
    conn = get_db_connection()
    
    try:
        # Find or create users
        player1_name = data.get('player1')
        player2_name = data.get('player2')
        
        # Get or create player 1
        player1 = conn.execute('SELECT id FROM users WHERE username = ?', (player1_name,)).fetchone()
        if not player1:
            unique_email = generate_unique_email(player1_name, conn)
            cursor1 = conn.execute('''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (player1_name, unique_email, "demo_hash"))
            player1_id = cursor1.lastrowid
        else:
            player1_id = player1['id']
        
        # Get or create player 2
        player2 = conn.execute('SELECT id FROM users WHERE username = ?', (player2_name,)).fetchone()
        if not player2:
            unique_email = generate_unique_email(player2_name, conn)
            cursor2 = conn.execute('''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (player2_name, unique_email, "demo_hash"))
            player2_id = cursor2.lastrowid
        else:
            player2_id = player2['id']
        
        # Determine winner
        score1 = int(data.get('score1', 0))
        score2 = int(data.get('score2', 0))
        
        if score1 > score2:
            winner_id = player1_id
        elif score2 > score1:
            winner_id = player2_id
        else:
            winner_id = player1_id  # Default to player1 for draws
        
        # Insert match result
        conn.execute('''
            INSERT INTO match_results (
                tournament_id, player1_id, player2_id, winner_id,
                score_player1, score_player2, match_date, match_round
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            tournament_id,
            player1_id,
            player2_id,
            winner_id,
            score1,
            score2,
            data.get('date', datetime.datetime.now().strftime('%Y-%m-%d')),
            data.get('match_round', 1)
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Match result reported'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/matches/<int:match_id>', methods=['PUT'])
def update_match_result(match_id):
    data = request.get_json()
    
    conn = get_db_connection()
    
    try:
        # Update match result
        score1 = int(data.get('score1', 0))
        score2 = int(data.get('score2', 0))
        
        # Determine winner based on current player IDs
        match = conn.execute('SELECT player1_id, player2_id FROM match_results WHERE id = ?', (match_id,)).fetchone()
        if score1 > score2:
            winner_id = match['player1_id']
        elif score2 > score1:
            winner_id = match['player2_id']
        else:
            winner_id = match['player1_id']
        
        conn.execute('''
            UPDATE match_results 
            SET score_player1 = ?, score_player2 = ?, winner_id = ?, match_date = ?
            WHERE id = ?
        ''', (score1, score2, winner_id, data.get('date'), match_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Match updated'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/matches/<int:match_id>', methods=['DELETE'])
def delete_match_result(match_id):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM match_results WHERE id = ?', (match_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Match deleted'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

# ==================== TOURNAMENT DISCUSSIONS CRUD ====================

@app.route('/api/tournaments/<tournament_id>/discussions', methods=['GET'])
def get_tournament_discussions(tournament_id):
    conn = get_db_connection()
    discussions = conn.execute('''
        SELECT td.*, u.username as creator_username
        FROM tournament_discussions td
        JOIN users u ON td.creator_id = u.id
        WHERE td.tournament_id = ?
        ORDER BY td.is_pinned DESC, td.created_at DESC
    ''', (tournament_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in discussions])

@app.route('/api/tournaments/<tournament_id>/discussions', methods=['POST'])
def create_discussion(tournament_id):
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        # Get or create user
        creator_name = data.get('authorName', 'Anonymous')
        user = conn.execute('SELECT id FROM users WHERE username = ?', (creator_name,)).fetchone()
        if not user:
            unique_email = generate_unique_email(creator_name, conn)
            cursor = conn.execute('''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (creator_name, unique_email, "demo_hash"))
            creator_id = cursor.lastrowid
        else:
            creator_id = user['id']
        
        conn.execute('''
            INSERT INTO tournament_discussions (tournament_id, creator_id, title, description, is_pinned)
            VALUES (?, ?, ?, ?, ?)
        ''', (tournament_id, creator_id, data['title'], data['content'], data.get('isSticky', False)))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Discussion created'})
    except sqlite3.IntegrityError as e:
        conn.close()
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({'error': 'A discussion with this title already exists for this tournament'}), 409
        return jsonify({'error': 'Database integrity error'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/discussions/<int:discussion_id>', methods=['PUT'])
def update_discussion(discussion_id):
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        conn.execute('''
            UPDATE tournament_discussions 
            SET title = ?, description = ?, is_pinned = ?
            WHERE id = ?
        ''', (data['title'], data['content'], data.get('isSticky', False), discussion_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Discussion updated'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/discussions/<int:discussion_id>', methods=['DELETE'])
def delete_discussion(discussion_id):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM tournament_discussions WHERE id = ?', (discussion_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Discussion deleted'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

# ==================== DISCUSSION REPLIES CRUD ====================

@app.route('/api/discussions/<int:discussion_id>/replies', methods=['GET'])
def get_discussion_replies(discussion_id):
    conn = get_db_connection()
    replies = conn.execute('''
        SELECT dr.*, u.username as author_name
        FROM discussion_replies dr
        JOIN users u ON dr.user_id = u.id
        WHERE dr.discussion_id = ?
        ORDER BY dr.created_at ASC
    ''', (discussion_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in replies])

@app.route('/api/discussions/<int:discussion_id>/replies', methods=['POST'])
def create_reply(discussion_id):
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        # Get or create user
        author_name = data.get('authorName', 'Anonymous')
        user = conn.execute('SELECT id FROM users WHERE username = ?', (author_name,)).fetchone()
        if not user:
            unique_email = generate_unique_email(author_name, conn)
            cursor = conn.execute('''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (author_name, unique_email, "demo_hash"))
            user_id = cursor.lastrowid
        else:
            user_id = user['id']
        
        # Insert reply
        cursor = conn.execute('''
            INSERT INTO discussion_replies (discussion_id, user_id, content)
            VALUES (?, ?, ?)
        ''', (discussion_id, user_id, data['content']))
        
        reply_id = cursor.lastrowid
        
        # Update replies count in discussions table
        conn.execute('''
            UPDATE tournament_discussions 
            SET replies_count = (
                SELECT COUNT(*) FROM discussion_replies 
                WHERE discussion_id = ?
            )
            WHERE id = ?
        ''', (discussion_id, discussion_id))
        
        conn.commit()
        
        # Get the newly created reply with author info
        reply = conn.execute('''
            SELECT dr.*, u.username as author_name
            FROM discussion_replies dr
            JOIN users u ON dr.user_id = u.id
            WHERE dr.id = ?
        ''', (reply_id,)).fetchone()
        
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Reply created',
            'reply': dict(reply)
        })
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/replies/<int:reply_id>', methods=['DELETE'])
def delete_reply(reply_id):
    conn = get_db_connection()
    try:
        # Get discussion_id before deleting
        reply = conn.execute('SELECT discussion_id FROM discussion_replies WHERE id = ?', (reply_id,)).fetchone()
        if not reply:
            conn.close()
            return jsonify({'error': 'Reply not found'}), 404
        
        discussion_id = reply['discussion_id']
        
        # Delete reply
        conn.execute('DELETE FROM discussion_replies WHERE id = ?', (reply_id,))
        
        # Update replies count
        conn.execute('''
            UPDATE tournament_discussions 
            SET replies_count = (
                SELECT COUNT(*) FROM discussion_replies 
                WHERE discussion_id = ?
            )
            WHERE id = ?
        ''', (discussion_id, discussion_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Reply deleted'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, port=5000, exclude_patterns=['**/*.db', '*.sqlite*'])
