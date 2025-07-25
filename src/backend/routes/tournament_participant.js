const express = require('express');
const router  = express.Router();
const db      = require('../db/db_connect');


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
  const { userId, teamName } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  // block duplicates
  const duplicates = `
    SELECT 1 FROM tournament_participants 
    WHERE tournament_id=? AND user_id=?`;
  db.get(duplicates, [tid, userId], (e,row) => {
    if (e) return res.status(500).json({ error: e.message });
    if (row) return res.status(400).json({ error: 'Already joined' });

    const insert = `
      INSERT INTO tournament_participants
        (tournament_id, user_id, team_name, registration_date)
      VALUES (?, ?, ?, datetime('now'))
    `;
    db.run(insert, [tid, userId, teamName], function(err2) {
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



module.exports = router;
