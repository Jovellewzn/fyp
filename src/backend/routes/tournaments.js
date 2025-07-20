const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');

// GET /api/tournament - Get all users
router.get('/', (req, res) => {
    db.all('SELECT * FROM tournaments', [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    });
});



module.exports = router