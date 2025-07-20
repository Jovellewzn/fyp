const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');

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