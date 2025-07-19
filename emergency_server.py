"""
Emergency Flask Server
=====================
A minimal server to test if Flask is working
"""

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return """
    <h1>🚀 Emergency Server Working!</h1>
    <p>If you see this, your Flask setup is working.</p>
    <p>Now try your main server with: python app.py</p>
    <a href="/api/test">Test API</a>
    """

@app.route('/api/test')
def test_api():
    return jsonify({
        'success': True,
        'message': 'API is working!',
        'server': 'Emergency Flask Server'
    })

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'server': 'emergency'})

if __name__ == '__main__':
    print("🚨 Emergency Flask Server Starting...")
    print("🌐 Open: http://localhost:5000")
    print("🔧 If this works, your Flask setup is OK")
    print("🎯 Then try: python app.py")
    print("=" * 40)
    app.run(debug=True, host='0.0.0.0', port=5000)
