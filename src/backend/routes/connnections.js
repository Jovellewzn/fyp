const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');
const e = require('express');


//GET /api/connections/users/:id
router.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    const result = {};
    const followersQuery = `
        SELECT uc.*, u.username as follower_username, u.email as follower_email
        FROM user_connections uc
        JOIN users u ON uc.follower_id = u.id
        WHERE uc.following_id = ? AND uc.connection_type = 'accepted'
        ORDER BY uc.created_at DESC`;
    const followingQuery = `
        SELECT uc.*, u.username as following_username, u.email as following_email
        FROM user_connections uc
        JOIN users u ON uc.following_id = u.id
        WHERE uc.follower_id = ? AND uc.connection_type = 'accepted'
        ORDER BY uc.created_at DESC`;
    const incomingPendingQuery = `
        SELECT uc.*, u.username as requester_username, u.email as requester_email
        FROM user_connections uc
        JOIN users u ON uc.follower_id = u.id
        WHERE uc.following_id = ? AND uc.connection_type = 'pending'
        ORDER BY uc.created_at DESC`;
    const outgoingPendingQuery = `
        SELECT uc.*, u.username as target_username, u.email as target_email
        FROM user_connections uc
        JOIN users u ON uc.following_id = u.id
        WHERE uc.follower_id = ? AND uc.connection_type = 'pending'
        ORDER BY uc.created_at DESC`;

    db.all(followersQuery, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching followers:', err.message);
        } else {
            result.followers = rows;
        }

        db.all(followingQuery, [userId], (err, rows) => {
            if (err) {
                console.error('Error fetching following:', err.message);
            } else {
                result.following = rows;
            }

            db.all(incomingPendingQuery, [userId], (err, rows) => {
                if (err) {
                    console.error('Error fetching pending requests:', err.message);
                } else {
                    result.incoming_pending = rows;
                }

                db.all(outgoingPendingQuery, [userId], (err, rows) => {
                    if (err) {
                        console.error('Error fetching outgoing pending requests:', err.message);
                    } else {
                        result.outgoing_pending = rows;
                    }

                    res.json(result);
                });
            });
        });
    });
});

router.delete('/:id', (req, res) => {
    const connectionId = req.params.id;
    db.run('DELETE FROM user_connections WHERE id = ?', [connectionId], function (err) {
        if (err) {
            console.error('Error deleting connection:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        res.json({ message: 'Connection deleted successfully' });
    });
});

router.patch('/:id', (req, res) => {
    const connectionId = req.params.id;
    const { status } = req.body;

    // Check if connection exists
    db.get('SELECT * FROM user_connections WHERE id = ?', [connectionId], (err, row) => {
        if (err) {
            console.error('Error fetching connection:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        // Update connection status
        db.run('UPDATE user_connections SET connection_type = ? WHERE id = ?', [status, connectionId], function (err) {
            if (err) {
                console.error('Error updating connection status:', err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Connection not found or status unchanged' });
            }
            res.json({ message: 'Connection status updated successfully' });
        });
    });
});

router.post('/follow/:id', (req, res) => {
    const followerId = req.params.id;
    const { followingId } = req.body;
    
    // Check if the connection already exists
    db.get('SELECT * FROM user_connections WHERE follower_id = ? AND following_id = ?', [followerId, followingId], (err, row) => {
        if (err) {
            console.error('Error checking existing connection:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (row) {
            return res.status(400).json({ error: 'Connection already exists' });
        }

        // Insert new connection
        db.run('INSERT INTO user_connections (follower_id, following_id, connection_type) VALUES (?, ?, ?)', [followerId, followingId, 'pending'], function (err) {
            if (err) {
                console.error('Error creating connection:', err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.status(200).json({ message: 'Connection request sent successfully', id: this.lastID });
        });
    });
});



module.exports = router




