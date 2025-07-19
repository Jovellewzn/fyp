"""
SIMPLE WORKING SERVER
====================
Basic server without Unicode issues
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({"status": "working"})

@app.route('/api/tournaments')
def get_tournaments():
    return jsonify({
        'success': True, 
        'tournaments': [
            {
                'id': 1,
                'title': 'Valorant Championship',
                'description': 'Epic Valorant tournament',
                'game_type': 'Valorant',
                'entry_fee': 10,
                'prize_pool': 100,
                'max_participants': 16,
                'participant_count': 8,
                'start_date': '2025-07-20 10:00:00',
                'end_date': '2025-07-20 18:00:00',
                'status': 'upcoming',
                'organizer_name': 'Admin'
            }
        ]
    })

@app.route('/api/ai/tournaments')
def get_ai_tournaments():
    return jsonify({
        'success': True,
        'tournaments': [
            {
                'id': 1,
                'title': 'Valorant Championship',
                'game_type': 'Valorant',
                'participant_count': 8,
                'max_participants': 16,
                'start_date': '2025-07-20 10:00:00',
                'status': 'upcoming',
                'organizer_name': 'Admin'
            }
        ]
    })

@app.route('/api/ai/tournament/<int:tournament_id>/participants')
def get_participants(tournament_id):
    return jsonify({
        'success': True, 
        'participants': [
            {
                'id': 1,
                'username': 'ProPlayer1',
                'team_name': 'Team Alpha',
                'wins': 15,
                'total_matches': 20,
                'win_rate': 75,
                'avg_score': 245,
                'skill_rating': 85
            },
            {
                'id': 2,
                'username': 'ProPlayer2',
                'team_name': 'Team Beta',
                'wins': 12,
                'total_matches': 18,
                'win_rate': 67,
                'avg_score': 220,
                'skill_rating': 78
            }
        ]
    })

@app.route('/api/ai/generate-bracket', methods=['POST'])
def generate_bracket():
    return jsonify({
        'success': True,
        'tournament': {
            'id': 1,
            'title': 'Valorant Championship',
            'game_type': 'Valorant'
        },
        'bracket': {
            'rounds': [
                {
                    'round_name': 'Finals',
                    'matches': [
                        {
                            'player1': {'username': 'ProPlayer1'},
                            'player2': {'username': 'ProPlayer2'},
                            'player1_win_prob': 65,
                            'player2_win_prob': 35,
                            'predicted_winner': {'username': 'ProPlayer1'},
                            'ai_analysis': 'ProPlayer1 has higher skill rating'
                        }
                    ]
                }
            ],
            'predicted_champion': {
                'username': 'ProPlayer1',
                'skill_rating': 85,
                'win_rate': 75
            }
        }
    })

@app.route('/')
def index():
    return send_from_directory('src', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    try:
        return send_from_directory('src', filename)
    except:
        return send_from_directory('src', 'index.html')

if __name__ == '__main__':
    print("SIMPLE SERVER STARTING...")
    print("Server: http://localhost:5000")
    print("Your website will work now!")
    
    app.run(debug=False, host='0.0.0.0', port=5000)
