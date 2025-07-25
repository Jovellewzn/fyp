const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');

function isAuthenticated(req) {
    // Check for a session cookie (e.g., user_id)
    return req.cookies && req.cookies.user_id;
}

// Update a comment - MOVED HERE FOR PRIORITY
router.put('/:commentId', (req, res) => {
  
  if (!isAuthenticated(req)) {
    console.log('Authentication failed - no user_id cookie');
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const commentId = req.params.commentId;
  const { content } = req.body;
  const userId = req.cookies.user_id;
  
  console.log('Authenticated user ID:', userId);
  console.log('Content to update:', content);
  
  if (!content || content.trim().length === 0) {
    console.log('Content validation failed');
    return res.status(400).json({ error: 'Comment content is required.' });
  }
      
  // First verify that the user owns this comment
  db.get('SELECT user_id FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err) {
      console.error('Database error while fetching comment:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    
    console.log('Comment query result:', comment);
    
    if (!comment) {
      console.log('Comment not found in database');
      return res.status(404).json({ error: 'Comment not found.' });
    }
    
    console.log('Comment owner:', comment.user_id, 'Current user:', userId);
    
    if (comment.user_id != userId) {
      console.log('Permission denied - user does not own comment');
      return res.status(403).json({ error: 'You can only edit your own comments.' });
    }
    
    console.log('Updating comment...');
    
    // Update the comment with current timestamp for edited_at
    const updateQuery = 'UPDATE comments SET content = ?, edited_at = datetime(\'now\') WHERE id = ?';
    db.run(updateQuery, [content.trim(), commentId], function(err) {
      if (err) {
        console.error('Comment update error:', err);
        return res.status(500).json({ error: 'Failed to update comment.' });
      }
      
      console.log('Comment updated successfully');
      res.json({ success: true, message: 'Comment updated successfully.', edited: true });
    });
  });
});


// Delete a comment - MOVED HERE FOR PRIORITY
router.delete('/:commentId', (req, res) => {
  
  if (!isAuthenticated(req)) {
    console.log('Authentication failed - no user_id cookie');
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const commentId = req.params.commentId;
  const userId = req.cookies.user_id;
  
  // Get comment and post info to check permissions
  db.get(`
    SELECT c.user_id as comment_user_id, c.post_id, p.user_id as post_user_id
    FROM comments c
    JOIN social_posts p ON c.post_id = p.id
    WHERE c.id = ?
  `, [commentId], (err, result) => {
    if (err) {
      console.error('Database error while fetching comment and post info:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    
    console.log('Permission query result:', result);
    
    if (!result) {
      console.log('Comment not found in database');
      return res.status(404).json({ error: 'Comment not found.' });
    }
    
    // Check if user can delete: either comment owner or post owner
    const canDelete = result.comment_user_id == userId || result.post_user_id == userId;
    
    if (!canDelete) {
      console.log('Permission denied');
      return res.status(403).json({ error: 'You can only delete your own comments or comments on your posts.' });
    }
    
    
    // Delete the comment
    db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
      if (err) {
        console.error('Comment deletion error:', err);
        return res.status(500).json({ error: 'Failed to delete comment.' });
      }
      
      console.log('Comment deleted, updating counts...');
      
      // Get actual comment count and update it
      db.get('SELECT COUNT(*) as comment_count FROM comments WHERE post_id = ?', [result.post_id], (countErr, countResult) => {
        if (countErr) {
          console.error('Failed to get comment count:', countErr);
        } else {
          // Update post's comment count with actual count
          db.run('UPDATE social_posts SET comments_count = ? WHERE id = ?', [countResult.comment_count, result.post_id], (updateErr) => {
            if (updateErr) {
              console.error('Failed to update comment count:', updateErr);
            }
          });
        }
        
        console.log('Comment deletion completed successfully');
        res.json({ 
          success: true, 
          message: 'Comment deleted successfully.',
          comments_count: countResult ? countResult.comment_count : null
        });
      });
    });
  });
});

module.exports = router