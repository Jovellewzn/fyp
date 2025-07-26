const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');

// Get all tournaments with optional filters
router.get('/', (req, res) => {

    const { game_type, status, start_date, end_date } = req.query;

    let query = `
    SELECT 
      t.*,
      u.username as organizer_username,
      strftime('%Y-%m-%d %H:%M:%S', t.start_date) as formatted_start_date,
      strftime('%Y-%m-%d %H:%M:%S', t.end_date) as formatted_end_date,
      strftime('%Y-%m-%d %H:%M:%S', t.created_at) as formatted_created_at
    FROM tournaments t
    LEFT JOIN users u ON t.organizer_id = u.id
    WHERE 1=1
  `;

    const params = [];

    if (game_type) {
        query += ' AND t.game_type = ?';
        params.push(game_type);
    }

    if (status) {
        query += ' AND t.status = ?';
        params.push(status);
    }

    if (start_date) {
        query += ' AND date(t.start_date) >= date(?)';
        params.push(start_date);
    }

    if (end_date) {
        query += ' AND date(t.start_date) <= date(?)';
        params.push(end_date);
    }

    query += ' ORDER BY t.start_date ASC';

    db.all(query, params, (err, tournaments) => {
        if (err) {
            console.error('❌ Error fetching tournaments:', err);
            return res.status(500).json({ error: 'Failed to fetch tournaments', details: err.message });
        }

        res.json({
            success: true,
            tournaments: tournaments,
            count: tournaments.length
        });
    });
});

// Create a new tournament (temporarily without auth for testing)
router.post('/', (req, res) => {
    console.log('\n=== CREATING NEW TOURNAMENT ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.cookies.user_id);

    const userId = req.cookies.user_id;
    if (!userId) {
        console.log('User ID not found in cookies');
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    const {
        title,
        description,
        game_type,
        entry_fee,
        prize_pool,
        max_participants,
        start_date,
        end_date,
        status
    } = req.body;

    console.log('Extracted data:', {
        title, description, game_type, entry_fee, prize_pool,
        max_participants, start_date, end_date, status
    });

    // Validation
    if (!title || !game_type || !start_date) {
        console.log('Validation failed: missing required fields');
        return res.status(400).json({ error: 'Title, game type, and start date are required' });
    }

    // Check if start date is in the future
    const startDateTime = new Date(start_date);
    const now = new Date();
    console.log('Start date:', startDateTime, 'Current time:', now);
    console.log('Start date string:', start_date);
    console.log('Start date valid:', !isNaN(startDateTime.getTime()));

    if (isNaN(startDateTime.getTime())) {
        console.log('Validation failed: invalid start date format');
        return res.status(400).json({ error: 'Invalid start date format' });
    }

    if (startDateTime <= now) {
        console.log('Validation failed: start date not in future');
        return res.status(400).json({ error: 'Start date must be in the future' });
    }

    // Check if end date is after start date (if provided)
    if (end_date) {
        const endDateTime = new Date(end_date);
        console.log('End date:', endDateTime);
        console.log('End date string:', end_date);
        console.log('End date valid:', !isNaN(endDateTime.getTime()));

        if (isNaN(endDateTime.getTime())) {
            console.log('Validation failed: invalid end date format');
            return res.status(400).json({ error: 'Invalid end date format' });
        }

        // Compare the dates properly
        const startTime = startDateTime.getTime();
        const endTime = endDateTime.getTime();
        console.log('Start timestamp:', startTime, 'End timestamp:', endTime);
        console.log('End > Start:', endTime > startTime);

        if (endTime <= startTime) {
            console.log('Validation failed: end date not after start date');
            console.log(`End date (${end_date}) must be after start date (${start_date})`);
            return res.status(400).json({ error: 'End date must be after start date' });
        }
    }

    const query = `
    INSERT INTO tournaments (
      title, description, game_type, entry_fee, prize_pool, 
      max_participants, start_date, end_date, status, organizer_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

    const values = [
        title,
        description || null,
        game_type,
        parseFloat(entry_fee) || 0,
        parseFloat(prize_pool) || 0,
        max_participants ? parseInt(max_participants) : null,
        start_date,
        end_date || null,
        status || 'upcoming',
        userId
    ];

    console.log('SQL query:', query);
    console.log('Values:', values);

    db.run(query, values, function (err) {
        if (err) {
            console.error('Error creating tournament:', err);
            return res.status(500).json({ error: 'Failed to create tournament: ' + err.message });
        }

        console.log('Tournament created with ID:', this.lastID);

        // Get the created tournament
        db.get('SELECT * FROM tournaments WHERE id = ?', [this.lastID], (err, tournament) => {
            if (err) {
                console.error('Error fetching created tournament:', err);
                return res.status(500).json({ error: 'Tournament created but failed to fetch details' });
            }

            console.log('Created tournament:', tournament);
            console.log('=== TOURNAMENT CREATION COMPLETE ===\n');

            res.status(201).json({
                success: true,
                message: 'Tournament created successfully',
                tournament: tournament
            });
        });
    });
});

router.get('/upcoming', (req, res) => {
  const sql = `
    SELECT id, title AS name, game_type AS category, start_date, prize_pool AS prize, status
    FROM tournaments
    WHERE status = 'upcoming'
    ORDER BY start_date ASC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      tournaments: rows,
      count: rows.length
    });
  });
});

// Get a specific tournament by ID
router.get('/:id', (req, res) => {
    const tournamentId = req.params.id;

    const query = `
    SELECT 
      t.*,
      u.username as organizer_username,
      strftime('%Y-%m-%d %H:%M:%S', t.start_date) as formatted_start_date,
      strftime('%Y-%m-%d %H:%M:%S', t.end_date) as formatted_end_date,
      strftime('%Y-%m-%d %H:%M:%S', t.created_at) as formatted_created_at
    FROM tournaments t
    LEFT JOIN users u ON t.organizer_id = u.id
    WHERE t.id = ?
  `;

    db.get(query, [tournamentId], (err, tournament) => {
        if (err) {
            console.error('Error fetching tournament:', err);
            return res.status(500).json({ error: 'Failed to fetch tournament' });
        }
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        res.json({ tournament });
    });
});


// Update a tournament
router.put('/:id', (req, res) => {

    const tournamentId = req.params.id;

    const {
        title,
        description,
        game_type,
        entry_fee,
        prize_pool,
        max_participants,
        start_date,
        end_date,
        status
    } = req.body;

    const query = `
      UPDATE tournaments SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        game_type = COALESCE(?, game_type),
        entry_fee = COALESCE(?, entry_fee),
        prize_pool = COALESCE(?, prize_pool),
        max_participants = COALESCE(?, max_participants),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status)
      WHERE id = ?
    `;

    const values = [
        title || null,
        description || null,
        game_type || null,
        entry_fee ? parseFloat(entry_fee) : null,
        prize_pool ? parseFloat(prize_pool) : null,
        max_participants ? parseInt(max_participants) : null,
        start_date || null,
        end_date || null,
        status || null,
        tournamentId
    ];

    db.run(query, values, function (err) {
        if (err) {
            console.error('Error updating tournament:', err);
            return res.status(500).json({ error: 'Failed to update tournament' });
        }

        // Get the updated tournament
        db.get('SELECT * FROM tournaments WHERE id = ?', [tournamentId], (err, updatedTournament) => {
            if (err) {
                return res.status(500).json({ error: 'Tournament updated but failed to fetch details' });
            }
            res.json({
                success: true,
                message: 'Tournament updated successfully',
                tournament: updatedTournament
            });
        });
    });
});

// Delete a tournament (temporarily without auth for testing)
router.delete('/:id', (req, res) => {
  
  const tournamentId = req.params.id;
  
  // Skip authorization check for testing - just delete the tournament
  db.run('DELETE FROM tournaments WHERE id = ?', [tournamentId], function(err) {
    if (err) {
      console.error('Error deleting tournament:', err);
      return res.status(500).json({ error: 'Failed to delete tournament', details: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    console.log(`✅ Tournament ${tournamentId} deleted successfully`);
    res.json({ 
      success: true, 
      message: 'Tournament deleted successfully'
    });
  });
});


// GET  /api/tournaments/:tid/participants
router.get('/:tid/participants', (req, res) => {
  const { tid } = req.params;
  const sql = `
    SELECT tp.id,
           tp.team_name,
           tp.registration_date,
           u.id   AS user_id,
           u.username
      FROM tournament_participants tp
      JOIN users u ON tp.user_id = u.id
     WHERE tp.tournament_id = ?
     ORDER BY tp.registration_date DESC
  `;
  db.all(sql, [tid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// POST /api/tournaments/:tid/participants
router.post('/:tid/participants', (req, res) => {
  const { tid } = req.params;
  const {teamName } = req.body;
  
  const cookie = req.cookies.user_id;
  if (!cookie) return res.status(400).json({ error: 'userId is required' });


  // block duplicates
  const duplicates = `
    SELECT 1 FROM tournament_participants 
    WHERE tournament_id=? AND user_id=?`;
  db.get(duplicates, [tid, cookie], (e,row) => {
    if (e) return res.status(500).json({ error: e.message });
    if (row) return res.status(400).json({ error: 'Already joined' });

    const insert = `
      INSERT INTO tournament_participants
        (tournament_id, user_id, team_name, registration_date)
      VALUES (?, ?, ?, datetime('now'))
    `;
    db.run(insert, [tid, cookie, teamName], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json({ id: this.lastID });
    });
  });
});


// PATCH /api/participants/:pid
router.patch('/participants/:pid', (req, res) => {
  const { pid }= req.params;
  const { teamName }= req.body;
  if (teamName === undefined) return res.status(400).json({ error: 'teamName is required' });

  const update = `
    UPDATE tournament_participants
       SET team_name = ?
     WHERE id = ?
  `;
  db.run(update, [teamName, pid], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  });
});

// DELETE /api/participants/:pid
router.delete('/participants/:pid', (req, res) => {
  const { pid } = req.params;
  db.run('DELETE FROM tournament_participants WHERE id = ?', [pid], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  });
});



router.get('/:tid/teams', (req, res) => {
  const { tid } = req.params;
  const sql = `
    SELECT team_name
      FROM tournament_participants tp
     WHERE tp.tournament_id = ?
  `;
  db.all(sql, [tid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows = rows.map(row => row.team_name);
    res.json(rows);
  });
});




module.exports = router