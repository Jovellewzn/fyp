# Tournament Management System

A simple web-based tournament management system for Final Year Project.

## Features

- User registration and authentication
- Tournament creation and management
- Tournament participation
- Basic tournament listings
- User profiles and tournament history

## Tech Stack

- **Backend**: Python Flask
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript

## Setup Instructions

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**
   ```bash
   python app.py
   ```

3. **Access the Application**
   - Open your browser to: http://localhost:5000
   - The database will be automatically created on first run

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `POST /api/tournaments` - Create new tournament
- `POST /api/tournaments/<id>/join` - Join tournament
- `GET /api/tournaments/<id>/participants` - Get tournament participants

### User
- `GET /api/user/profile` - Get user profile

## Database Schema

### Users Table
- id, username, email, password_hash, profile_picture, bio, created_at, last_login, is_active

### Tournaments Table  
- id, title, description, game_type, entry_fee, prize_pool, max_participants, start_date, end_date, status, organizer_id, created_at

### Tournament Participants Table
- id, tournament_id, user_id, team_name, registration_date, status, placement, score

## Project Structure

```
FYP/
├── app.py                 # Main application file
├── requirements.txt       # Python dependencies
├── tournament_app.db     # SQLite database (auto-created)
├── README.md             # This file
└── src/                  # Frontend files
    ├── index.html
    ├── login.html
    ├── signup.html
    ├── tournaments.html
    ├── profile.html
    ├── scripts/
    │   └── app.js
    └── styles/
        └── main.css
```

## Final Year Project Notes

This is a simple tournament management system demonstrating:
- Web development with Flask
- Database design and operations
- RESTful API development
- Frontend-backend integration
- User authentication and session management

Perfect for demonstrating core web development concepts in an academic setting.
