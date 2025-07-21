const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');
const bcrypt = require('bcryptjs');
const { upload } = require('../util/multer');

function isAuthenticated(req) {
    // Check for a session cookie (e.g., user_id)
    return req.cookies && req.cookies.user_id;
}

// GET /api/users
router.get('/', (req, res) => {
    db.all('SELECT id, username, created_at FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    });
});

// Delete account
router.delete('/', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const userId = req.cookies.user_id;
  // First, check if user exists
  db.get('SELECT * FROM users WHERE id = ?', [userId], function(err, user) {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }
    if (!user) {
      res.clearCookie('user_id');
      return res.status(404).json({ error: 'User not found.' });
    }
    // Delete user from users table
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete account.' });
      }
      // Optionally: delete related data (posts, connections, etc.)
      res.clearCookie('user_id');
      return res.json({ success: true, message: 'Account deleted.' });
    });
  });
});

// API endpoint to get current user profile
router.get('/profile', (req, res) => {

    if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }

    db.get('SELECT username, profile_picture, bio FROM users WHERE id = ?', [req.cookies.user_id], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        // Always send anonymous avatar if profile_picture is empty or null
        if (!user.profile_picture || user.profile_picture.trim() === '') {
            user.profile_picture = 'https://via.placeholder.com/100x100/6a82fb/ffffff?text=👤';
        } else {
            user.profile_picture = 'http://127.0.0.1:5000/' + user.profile_picture; // Ensure path is correct for frontend
        }
        res.json(user);
    });
});

// API endpoint to update user profile
router.post('/profile', upload.single('profilePicture'), (req, res) => {
    if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }
    const { username, bio, removeProfilePicture } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    let profile_picture = null;
    if (req.file) {
        profile_picture = req.file.filename;
    }
    // If user requested removal, set profile_picture to NULL
    if (removeProfilePicture === 'true') {
        profile_picture = '';
    }
    const updateQuery = (profile_picture !== null)
        ? 'UPDATE users SET username = ?, profile_picture = ?, bio = ? WHERE id = ?'
        : 'UPDATE users SET username = ?, bio = ? WHERE id = ?';
    const updateParams = (profile_picture !== null)
        ? [username, profile_picture, bio, req.cookies.user_id]
        : [username, bio, req.cookies.user_id];
    db.run(updateQuery, updateParams, function (err) {
        if (err) {
            console.error('Profile update error:', err);
            return res.status(500).json({ error: 'Failed to update profile.' });
        }
        db.get('SELECT username, profile_picture, bio FROM users WHERE id = ?', [req.cookies.user_id], (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found.' });
            }
            // Always send anonymous avatar if profile_picture is empty or null
            let profile_picture = user.profile_picture;
            if (!profile_picture || profile_picture.trim() === '') {
                profile_picture = 'https://via.placeholder.com/100x100/6a82fb/ffffff?text=👤';
            }
            res.json({
                success: true,
                username: user.username,
                bio: user.bio,
                profile_picture
            });
        });
    });
});


// Signup endpoint
router.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check for existing username/email
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }
        if (row) {
            return res.status(400).json({ error: 'Username or email already exists.' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert new user
        db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password_hash], function (insertErr) {
            if (insertErr) {
                return res.status(500).json({ error: 'Failed to create user.' });
            }
            return res.status(201).json({ message: 'User created successfully.' });
        });
    });
});

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password.' });
        }
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(400).json({ error: 'Invalid username or password.' });
        }
        // Set session cookie
        res.cookie('user_id', user.id, { httpOnly: true, sameSite: 'None', secure: true });
        return res.status(200).json({
            message: 'Login successful.', user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

// Logout endpoint
router.post('/logout', (req, res) => {
    res.clearCookie('user_id', { httpOnly: true, sameSite: 'None', secure: true });
    res.json({ message: 'Logged out successfully.' });
});


// GET /api/users/:id
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT id, username, bio, last_login FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(row);
    });
});

module.exports = router