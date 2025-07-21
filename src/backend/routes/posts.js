const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');
const { upload } = require('../util/multer');

function isAuthenticated(req) {
    // Check for a session cookie (e.g., user_id)
    return req.cookies && req.cookies.user_id;
}


// Get posts for social feed
router.get('/', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const { category = 'home' } = req.query;
  const userId = req.cookies.user_id;
  
  let query = '';
  let params = [];
  
  switch (category) {
    case 'home':
      // Show all posts ordered by creation date
      query = `
        SELECT p.*, u.username, u.profile_picture,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as user_liked,
               datetime(p.created_at) as created_at_formatted
        FROM social_posts p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC LIMIT 50`;
      params = [userId];
      break;
      
    case 'friends':
      // Show posts from users the current user follows
      query = `
        SELECT p.*, u.username, u.profile_picture,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as user_liked,
               datetime(p.created_at) as created_at_formatted
        FROM social_posts p 
        JOIN users u ON p.user_id = u.id 
        JOIN user_connections uc ON p.user_id = uc.following_id 
        WHERE uc.follower_id = ? AND uc.connection_type = 'accepted'
        ORDER BY p.created_at DESC LIMIT 50`;
      params = [userId, userId];
      break;
      
    case 'you':
      // Show only current user's posts
      query = `
        SELECT p.*, u.username, u.profile_picture,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as user_liked,
               datetime(p.created_at) as created_at_formatted
        FROM social_posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC`;
      params = [userId, userId];
      break;
  }
  
  db.all(query, params, (err, posts) => {
    if (err) {
      console.error('Posts fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch posts.' });
    }
    
    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      ...post,
      image_url: post.image_url ? 'http://127.0.0.1:5000/' + post.image_url : null,
      profile_picture: post.profile_picture ? 'http://127.0.0.1:5000/' + post.profile_picture : 'https://via.placeholder.com/40x40/6a82fb/ffffff?text=👤',
      user_liked: post.user_liked > 0
    }));
    
    res.json(formattedPosts);
  });
});


// Like/Unlike a post
router.post('/:postId/like', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  const userId = req.cookies.user_id;
  
  // Check if user already liked the post
  db.get('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, existingLike) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (existingLike) {
      // Unlike the post
      db.run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: 'Failed to unlike post.' });
        }
        
        // Get actual like count from database
        db.get('SELECT COUNT(*) as like_count FROM post_likes WHERE post_id = ?', [postId], (countErr, result) => {
          if (countErr) {
            return res.status(500).json({ error: 'Failed to get like count.' });
          }
          
          // Update post's like count with actual count
          db.run('UPDATE social_posts SET likes_count = ? WHERE id = ?', [result.like_count, postId], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ error: 'Failed to update like count.' });
            }
            res.json({ liked: false, message: 'Post unliked.', likes_count: result.like_count });
          });
        });
      });
    } else {
      // Like the post
      db.run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (insertErr) => {
        if (insertErr) {
          return res.status(500).json({ error: 'Failed to like post.' });
        }
        
        // Get actual like count from database
        db.get('SELECT COUNT(*) as like_count FROM post_likes WHERE post_id = ?', [postId], (countErr, result) => {
          if (countErr) {
            return res.status(500).json({ error: 'Failed to get like count.' });
          }
          
          // Update post's like count with actual count
          db.run('UPDATE social_posts SET likes_count = ? WHERE id = ?', [result.like_count, postId], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ error: 'Failed to update like count.' });
            }
            res.json({ liked: true, message: 'Post liked.', likes_count: result.like_count });
          });
        });
      });
    }
  });
});


// Get comments for a post
router.get('/:postId/comments', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
    
  // First verify the post exists
  db.get('SELECT id, user_id, content FROM social_posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      console.error('Error checking post existence:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (!post) {
      console.log(`Post ${postId} not found!`);
      return res.status(404).json({ error: 'Post not found.' });
    }
    
    
    const query = `
      SELECT c.*, u.username, u.profile_picture,
             datetime(c.created_at) as created_at_formatted,
             datetime(c.edited_at) as edited_at_formatted
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `;
    
    db.all(query, [postId], (err, comments) => {
      if (err) {
        console.error('Comments fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch comments.' });
      }
      
      comments.forEach(comment => {
        if (comment.post_id != postId) {
          console.log(`  ⚠️  WARNING: Comment ${comment.id} has wrong post_id! Expected ${postId}, got ${comment.post_id}`);
        }
      });
      
      const formattedComments = comments.map(comment => ({
        ...comment,
        profile_picture: comment.profile_picture || 'https://via.placeholder.com/32x32/6a82fb/ffffff?text=👤'
      }));
      
      res.json(formattedComments);
    });
  });
});


// Add a comment to a post
router.post('/:postId/comments', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  const { content } = req.body;
  const userId = req.cookies.user_id;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content is required.' });
  }
    
  // First verify the post exists
  db.get('SELECT id, user_id, content FROM social_posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      console.error('Error checking post existence:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (!post) {
      console.log(`Post ${postId} not found!`);
      return res.status(404).json({ error: 'Post not found.' });
    }
    
    console.log(`Post ${postId} exists: "${post.content.substring(0, 50)}..." (User ${post.user_id})`);
    
    // Insert comment
    const insertQuery = `
      INSERT INTO comments (post_id, user_id, content, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `;
    
    console.log(`Inserting comment with post_id=${postId}, user_id=${userId}`);
    
    db.run(insertQuery, [postId, userId, content.trim()], function(err) {
      if (err) {
        console.error('Comment creation error:', err);
        return res.status(500).json({ error: 'Failed to add comment.' });
      }
      
      const commentId = this.lastID;
      console.log(`Comment inserted with ID: ${commentId}`);
      
      // Verify the comment was inserted correctly
      db.get('SELECT post_id, user_id, content FROM comments WHERE id = ?', [commentId], (verifyErr, insertedComment) => {
        if (verifyErr) {
          console.error('Error verifying inserted comment:', verifyErr);
        } else {
          console.log(`Verified comment ${commentId}: post_id=${insertedComment.post_id}, user_id=${insertedComment.user_id}`);
          if (insertedComment.post_id != postId) {
            console.log(`⚠️  ERROR: Comment was inserted with wrong post_id! Expected ${postId}, got ${insertedComment.post_id}`);
          }
        }
        
        // Get actual comment count and update it
        db.get('SELECT COUNT(*) as comment_count FROM comments WHERE post_id = ?', [postId], (countErr, countResult) => {
          if (countErr) {
            console.error('Failed to get comment count:', countErr);
          } else {
            console.log(`Post ${postId} now has ${countResult.comment_count} comments`);
            // Update post's comment count with actual count
            db.run('UPDATE social_posts SET comments_count = ? WHERE id = ?', [countResult.comment_count, postId], (updateErr) => {
              if (updateErr) {
                console.error('Failed to update comment count:', updateErr);
              }
            });
          }
          
          // Get the created comment with user info
          db.get(`
            SELECT c.*, u.username, u.profile_picture
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
          `, [commentId], (err, comment) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch created comment.' });
            }
            
            comment.profile_picture = comment.profile_picture || 'https://via.placeholder.com/32x32/6a82fb/ffffff?text=👤';
            comment.comments_count = countResult ? countResult.comment_count : null;
            
            console.log(`Returning comment: ID=${comment.id}, post_id=${comment.post_id}, user=${comment.username}\n`);
            res.status(201).json(comment);
          });
        });
      });
    });
  });
});


// Create a new post
router.post('/', upload.single('postImage'), (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const { content, post_type = 'general', tournament_id } = req.body;
  const userId = req.cookies.user_id;
  
  console.log(`\n=== CREATING NEW POST ===`);
  console.log(`User: ${userId}, Content: "${content}"`);
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content is required.' });
  }
  
  let image_url = null;
  if (req.file) {
    image_url = req.file.filename;
  }
    
  const query = `
    INSERT INTO social_posts (user_id, content, image_url, post_type, tournament_id, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;
  
  db.run(query, [userId, content.trim(), image_url, post_type, tournament_id], function(err) {
    if (err) {
      console.error('Post creation error:', err);
      return res.status(500).json({ error: 'Failed to create post.' });
    }
    
    const postId = this.lastID;
    
    // Get the created post with user info
    db.get(`
      SELECT p.*, u.username, u.profile_picture
      FROM social_posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `, [postId], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch created post.' });
      }
      
      post.profile_picture = post.profile_picture || 'https://via.placeholder.com/40x40/6a82fb/ffffff?text=👤';
      post.likes_count = 0;
      post.comments_count = 0;
      post.user_liked = false;
      
      console.log(`Returning new post: ID=${post.id}, User=${post.username}, Content="${post.content.substring(0, 50)}..."\n`);
      
      res.status(201).json(post);
    });
  });
});

// Update a post
router.patch('/:postId', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  const { content } = req.body;
  const userId = req.cookies.user_id;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content is required.' });
  }
    
  // First verify that the user owns this post
  db.get('SELECT user_id FROM social_posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    
    if (post.user_id != userId) {
      return res.status(403).json({ error: 'You can only edit your own posts.' });
    }
    
    // Update the post
    const updateQuery = 'UPDATE social_posts SET content = ? WHERE id = ?';
    db.run(updateQuery, [content.trim(), postId], function(err) {
      if (err) {
        console.error('Post update error:', err);
        return res.status(500).json({ error: 'Failed to update post.' });
      }
      
      res.json({ success: true, message: 'Post updated successfully.' });
    });
  });
});


// Delete a post (only if user owns it)
router.delete('/:postId', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  const userId = req.cookies.user_id;
  
  // Check if user owns the post
  db.get('SELECT * FROM social_posts WHERE id = ? AND user_id = ?', [postId, userId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found or you do not have permission to delete it.' });
    }
    
    // Delete the post (cascade will handle comments and likes)
    db.run('DELETE FROM social_posts WHERE id = ?', [postId], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: 'Failed to delete post.' });
      }
      res.json({ success: true, message: 'Post deleted successfully.' });
    });
  });
});

module.exports = router