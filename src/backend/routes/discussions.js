const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');


// GET /api/discussions/:id
router.get('/:id', (req, res) => {
  const tid = req.params.id;

  const sql = `
      SELECT td.*, u.username AS creator_username
      FROM   tournament_discussions td
      JOIN   users u ON td.creator_id = u.id
      WHERE  td.tournament_id = ?
      ORDER  BY td.is_pinned DESC, td.created_at DESC
    `;

  db.all(sql, [tid], (err, rows) => {
    if (err) {
      console.error('Error fetching threads:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(rows);
  });
});


// POST /api/discussions/:id
router.post('/:id', (req, res) => {
  const { id: tid } = req.params;
  const {title, description: content,userid} = req.body;

  if (!title) return res.status(400).json({ error: 'title is required' });

  const dupSql = `
      SELECT 1 FROM tournament_discussions
      WHERE tournament_id = ? AND title = ? `;

  db.get(dupSql, [tid, title], (err, row) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    if (row) return res.status(409).json({ error: 'Discussion with this title already exists' });
  });

  const insert = `
      INSERT INTO tournament_discussions
        (tournament_id, creator_id, title, description, is_pinned)
      VALUES (?,?,?,?,?)`;
  db.run(insert, [tid, userid, title, content, false ], function (err2) {
    if (err2) {
      if (err2.message.includes('UNIQUE'))
        return res.status(409).json({ error: 'Title already exists for this tournament' });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Discussion created', id: this.lastID });
  });
});



// PATCH /api/discussions/:id
router.patch('/:id', (req, res) => {
  const did = req.params.id;
  const { title, content, isSticky = false } = req.body;

  db.run(
    `UPDATE tournament_discussions
        SET title = ?, description = ?, is_pinned = ?
      WHERE id = ?`,
    [title, content, isSticky ? 1 : 0, did],
    function (err) {
      if (err) return res.status(500).json({ error: 'Internal Server Error' });
      if (!this.changes)
        return res.status(404).json({ error: 'Discussion not found or unchanged' });
      res.json({ message: 'Discussion updated' });
    }
  );
});

// DELETE /api/discussions/:id
router.delete('/:id', (req, res) => {
  const did = req.params.id;

  db.run('DELETE FROM tournament_discussions WHERE id = ?', [did], function (err) {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    if (!this.changes)
      return res.status(404).json({ error: 'Discussion not found' });
    res.json({ message: 'Discussion deleted' });
  });
});



// GET /api/discussions/:did/replies
router.get('/:did/replies', (req, res) => {
  const did = req.params.did;

  const sql = `
      SELECT dr.*, u.username AS author_name
      FROM   discussion_replies dr
      JOIN   users u ON dr.user_id = u.id
      WHERE  dr.discussion_id = ?
      ORDER  BY dr.created_at ASC
    `;
  db.all(sql, [did], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    res.json(rows);

  });
});


// POST /api/discussions/:id/replies
router.post('/:id/replies', (req, res) => {
  const did = req.params.id;
  const { content, userId } = req.body;

  db.run(
    'INSERT INTO discussion_replies (discussion_id, user_id, content) VALUES (?,?,?)',
    [did, userId, content],
    function (err3) {
      if (err3) return res.status(500).json({ error: 'Internal Server Error' });

      db.run(
        `UPDATE tournament_discussions
                SET replies_count = (
                  SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = ?
                )
              WHERE id = ?`,
        [did, did]
      );

      res.status(201).json({ message: 'Reply posted', id: this.lastID });
    }
  );

});

// PATCH /api/replies/:id
router.patch('/replies/:id', (req, res) => {
  const rid = req.params.id;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Content is required' });

  db.run(
    'UPDATE discussion_replies SET content = ? WHERE id = ?',
    [content, rid],
    function (err) {
      if (err) return res.status(500).json({ error: 'Internal Server Error' });
      if (!this.changes)
        return res.status(404).json({ error: 'Reply not found or unchanged' });
      res.json({ message: 'Reply updated' });
    }
  );
});

// DELETE /api/replies/:id
router.delete('/replies/:id', (req, res) => {
  const rid = req.params.id;

  db.get('SELECT discussion_id FROM discussion_replies WHERE id = ?', [rid], (err, row) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    if (!row) return res.status(404).json({ error: 'Reply not found' });

    const discussionId = row.discussion_id;

    db.run('DELETE FROM discussion_replies WHERE id = ?', [rid], function (err2) {
      if (err2) return res.status(500).json({ error: 'Internal Server Error' });
      if (!this.changes)
        return res.status(404).json({ error: 'Reply not found' });

      db.run(
        `UPDATE tournament_discussions
            SET replies_count = (
              SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = ?
            )
          WHERE id = ?`,
        [discussionId, discussionId]
      );

      res.json({ message: 'Reply deleted' });
    });
  });
});

module.exports = router;
