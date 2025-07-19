#!/usr/bin/env python3

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/tournaments')
def tournaments():
    return jsonify({'success': True, 'tournaments': []})

@app.route('/api/ai/tournaments')
def ai_tournaments():
    return jsonify({'success': True, 'tournaments': []})

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Starting server on http://localhost:5000")
    app.run(port=5000, debug=False)
