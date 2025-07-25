const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');


router.get('/tournaments/:tid/matches', (req, res) => {
  const { tid } = req.params;

  const sql = `
    SELECT mr.*
    FROM   match_results mr
    WHERE  mr.tournament_id = ?
    ORDER  BY mr.match_date DESC
  `;

  db.all(sql, [tid], (err, rows) => {
    if (err) {
      console.error('Error fetching matches:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(rows);
  });
});

router.get('/:mid', (req, res) => {
  const { mid } = req.params;

  const sql = `
    SELECT mr.*
    FROM   match_results mr
    WHERE  mr.id = ?
  `;

  db.get(sql, [mid], (err, row) => {
    if (err) {
      console.error('Error fetching match:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(row);
  });
});

router.post('/tournaments/:tid/matches', (req, res) => {
  const { tid } = req.params;
  const { team1, team2, score1, score2, date } = req.body;

  const s1 = score1 || 0;
  const s2 = score2 || 0;
  const winnerTeam = s1 >= s2 ? team1 : team2;

  const sql = `
        INSERT INTO match_results (
          tournament_id, team1_name, team2_name, winner_name,
          score_team1, score_team2, match_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

  db.run(
    sql,
    [tid, team1, team2, winnerTeam, s1, s2,
      date || new Date().toISOString().slice(0, 10)],
    function (err3) {
      if (err3) {
        console.error('Error inserting match:', err3.message);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.status(201).json({ message: 'Match result reported', id: this.lastID });
    }
  );
});


router.patch('/:mid', (req, res) => {
  const { mid } = req.params;
  const { score1, score2, date } = req.body;

  db.get('SELECT team1_name, team2_name FROM match_results WHERE id = ?', [mid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Match not found' });

    const s1 = score1 || 0;
    const s2 = score2 || 0;
    const winnerName = s1 >= s2 ? row.team1_name : row.team2_name;

    db.run(
      `
      UPDATE match_results
      SET score_team1 = ?, score_team2 = ?, winner_name = ?, match_date = ?
      WHERE id = ?
      `,
      [s1, s2, winnerName, date || new Date().toISOString().slice(0, 10), mid],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Match not found or unchanged' });
        res.json({ message: 'Match updated successfully' });
      }
    );
  });
});

router.delete('/:mid', (req, res) => {
  const { mid } = req.params;

  db.run('DELETE FROM match_results WHERE id = ?', [mid], function (err) {
    if (err) {
      console.error('Error deleting match:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ message: 'Match deleted successfully' });
  });
});


module.exports = router;
