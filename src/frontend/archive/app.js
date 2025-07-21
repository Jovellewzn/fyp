// Express server for GameVibe Arena
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if the file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware for parsing JSON and urlencoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Debug middleware - log all API requests
app.use('/api', (req, res, next) => {
  console.log(`\n=== API REQUEST DEBUG ===`);
  console.log(`${req.method} ${req.url}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Path: ${req.path}`);
  console.log(`Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`========================\n`);
  next();
});

// ================================
// API ROUTES (MUST COME FIRST!)
// ================================

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Server is running!', 
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    port: PORT 
  });
});

// SIMPLE PUT TEST - to verify PUT method works
app.put('/api/simple-test', (req, res) => {
  console.log('SIMPLE PUT TEST ROUTE HIT');
  res.json({ 
    message: 'PUT method is working!',
    timestamp: new Date().toISOString(),
    body: req.body
  });
});

// Test comment endpoint
app.get('/api/test-comment', (req, res) => {
  res.json({ 
    message: 'Comment endpoints are accessible',
    endpoints: [
      'PUT /api/comments/:commentId',
      'DELETE /api/comments/:commentId'
    ]
  });
});

// Test specific comment route
app.get('/api/comments/test', (req, res) => {
  res.json({ 
    message: 'Comment routes are working',
    method: 'GET',
    path: '/api/comments/test'
  });
});

// Test specific comment ID endpoint - MOVED TO TOP FOR PRIORITY
app.get('/api/comments/:commentId/test', (req, res) => {
  res.json({ 
    message: 'Comment ID route is working',
    commentId: req.params.commentId,
    timestamp: new Date().toISOString()
  });
});

// Test specific comment route with ID
app.get('/api/comments/:id/test', (req, res) => {
  res.json({ 
    message: 'Comment ID route is working',
    method: 'GET',
    path: `/api/comments/${req.params.id}/test`,
    commentId: req.params.id
  });
});

// Test PUT method on comments
app.put('/api/comments/:id/test', (req, res) => {
  res.json({ 
    message: 'PUT method works on comments route',
    method: 'PUT',
    commentId: req.params.id,
    body: req.body
  });
});

// Test DELETE method on comments  
app.delete('/api/comments/:id/test', (req, res) => {
  res.json({ 
    message: 'DELETE method works on comments route',
    method: 'DELETE',
    commentId: req.params.id
  });
});

// Test GET comment by ID to verify route pattern
app.get('/api/comments/:commentId', (req, res) => {
  res.json({ 
    message: 'GET comment route is working',
    method: 'GET',
    commentId: req.params.commentId,
    note: 'This proves the route pattern works'
  });
});

// Update a comment - MOVED HERE FOR PRIORITY
app.put('/api/comments/:commentId', (req, res) => {
  console.log('=== PUT /api/comments/:commentId ROUTE HIT (MOVED VERSION) ===');
  console.log('Comment ID:', req.params.commentId);
  console.log('Request body:', req.body);
  console.log('Cookies:', req.cookies);
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  
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
  
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  console.log('Database connected, checking comment ownership...');
  
  // First verify that the user owns this comment
  db.get('SELECT user_id FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err) {
      console.error('Database error while fetching comment:', err);
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    
    console.log('Comment query result:', comment);
    
    if (!comment) {
      console.log('Comment not found in database');
      db.close();
      return res.status(404).json({ error: 'Comment not found.' });
    }
    
    console.log('Comment owner:', comment.user_id, 'Current user:', userId);
    
    if (comment.user_id != userId) {
      console.log('Permission denied - user does not own comment');
      db.close();
      return res.status(403).json({ error: 'You can only edit your own comments.' });
    }
    
    console.log('Updating comment...');
    
    // Update the comment with current timestamp for edited_at
    const updateQuery = 'UPDATE comments SET content = ?, edited_at = datetime(\'now\') WHERE id = ?';
    db.run(updateQuery, [content.trim(), commentId], function(err) {
      db.close();
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
app.delete('/api/comments/:commentId', (req, res) => {
  console.log('=== DELETE /api/comments/:commentId ROUTE HIT (MOVED VERSION) ===');
  console.log('Comment ID:', req.params.commentId);
  console.log('Cookies:', req.cookies);
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  
  if (!isAuthenticated(req)) {
    console.log('Authentication failed - no user_id cookie');
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const commentId = req.params.commentId;
  const userId = req.cookies.user_id;
  
  console.log('Authenticated user ID:', userId);
  
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  console.log('Database connected, checking permissions...');
  
  // Get comment and post info to check permissions
  db.get(`
    SELECT c.user_id as comment_user_id, c.post_id, p.user_id as post_user_id
    FROM comments c
    JOIN social_posts p ON c.post_id = p.id
    WHERE c.id = ?
  `, [commentId], (err, result) => {
    if (err) {
      console.error('Database error while fetching comment and post info:', err);
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    
    console.log('Permission query result:', result);
    
    if (!result) {
      console.log('Comment not found in database');
      db.close();
      return res.status(404).json({ error: 'Comment not found.' });
    }
    
    // Check if user can delete: either comment owner or post owner
    const canDelete = result.comment_user_id == userId || result.post_user_id == userId;
    
    console.log('Comment owner:', result.comment_user_id);
    console.log('Post owner:', result.post_user_id);
    console.log('Current user:', userId);
    console.log('Can delete:', canDelete);
    
    if (!canDelete) {
      console.log('Permission denied');
      db.close();
      return res.status(403).json({ error: 'You can only delete your own comments or comments on your posts.' });
    }
    
    console.log('Deleting comment...');
    
    // Delete the comment
    db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
      if (err) {
        db.close();
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
        
        db.close();
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

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/index.html'));
});

// Signup endpoint
app.post('/signup', async (req, res) => {
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

  // Connect to DB
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));

  console.log('Database path used for signup and login:', path.join(__dirname, '../../tournament_app.db'));

  // Check for existing username/email
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    if (row) {
      db.close();
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user
    db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password_hash], function(insertErr) {
      db.close();
      if (insertErr) {
        return res.status(500).json({ error: 'Failed to create user.' });
      }
      return res.status(201).json({ message: 'User created successfully.' });
    });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    db.close();
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
    res.cookie('user_id', user.id, { httpOnly: true, sameSite: 'lax' });
    return res.status(200).json({ message: 'Login successful.' });
  });
});

function isAuthenticated(req) {
  // Check for a session cookie (e.g., user_id)
  return req.cookies && req.cookies.user_id;
}

// Middleware to require authentication for API routes
function requireAuth(req, res, next) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

const protectedPages = [
  'social.html',
  'tournaments.html',
  'profile.html',
  'notifications.html'
];

// API endpoint to get current user profile
app.get('/api/profile', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  db.get('SELECT username, profile_picture, bio FROM users WHERE id = ?', [req.cookies.user_id], (err, user) => {
    db.close();
    if (err || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    // Always send anonymous avatar if profile_picture is empty or null
    if (!user.profile_picture || user.profile_picture.trim() === '') {
      user.profile_picture = 'https://via.placeholder.com/100x100/6a82fb/ffffff?text=👤';
    }
    res.json(user);
  });
});

// API endpoint to update user profile
app.post('/api/profile', upload.single('profilePicture'), (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const { username, bio, removeProfilePicture } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  let profile_picture = null;
  if (req.file) {
    profile_picture = '/uploads/' + req.file.filename;
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
  db.run(updateQuery, updateParams, function(err) {
    if (err) {
      db.close();
      console.error('Profile update error:', err);
      return res.status(500).json({ error: 'Failed to update profile.' });
    }
    db.get('SELECT username, profile_picture, bio FROM users WHERE id = ?', [req.cookies.user_id], (err, user) => {
      db.close();
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

// Logout endpoint
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.json({ message: 'Logged out successfully.' });
});

// Social Posts API Endpoints

// Get posts for social feed
app.get('/api/posts', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const { category = 'home' } = req.query;
  const userId = req.cookies.user_id;
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
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
    db.close();
    if (err) {
      console.error('Posts fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch posts.' });
    }
    
    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      ...post,
      profile_picture: post.profile_picture || 'https://via.placeholder.com/40x40/6a82fb/ffffff?text=👤',
      user_liked: post.user_liked > 0
    }));
    
    res.json(formattedPosts);
  });
});

// Create a new post
app.post('/api/posts', upload.single('postImage'), (req, res) => {
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
    image_url = '/uploads/' + req.file.filename;
  }
  
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  const query = `
    INSERT INTO social_posts (user_id, content, image_url, post_type, tournament_id, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;
  
  db.run(query, [userId, content.trim(), image_url, post_type, tournament_id], function(err) {
    if (err) {
      db.close();
      console.error('Post creation error:', err);
      return res.status(500).json({ error: 'Failed to create post.' });
    }
    
    const postId = this.lastID;
    console.log(`Post created with ID: ${postId}`);
    
    // Get the created post with user info
    db.get(`
      SELECT p.*, u.username, u.profile_picture
      FROM social_posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `, [postId], (err, post) => {
      db.close();
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
app.put('/api/posts/:postId', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  const { content } = req.body;
  const userId = req.cookies.user_id;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content is required.' });
  }
  
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  // First verify that the user owns this post
  db.get('SELECT user_id FROM social_posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (!post) {
      db.close();
      return res.status(404).json({ error: 'Post not found.' });
    }
    
    if (post.user_id != userId) {
      db.close();
      return res.status(403).json({ error: 'You can only edit your own posts.' });
    }
    
    // Update the post
    const updateQuery = 'UPDATE social_posts SET content = ? WHERE id = ?';
    db.run(updateQuery, [content.trim(), postId], function(err) {
      db.close();
      if (err) {
        console.error('Post update error:', err);
        return res.status(500).json({ error: 'Failed to update post.' });
      }
      
      res.json({ success: true, message: 'Post updated successfully.' });
    });
  });
});

// Get comments for a post
app.get('/api/posts/:postId/comments', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  console.log(`\n=== FETCHING COMMENTS FOR POST ${postId} ===`);
  
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  // First verify the post exists
  db.get('SELECT id, user_id, content FROM social_posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      console.error('Error checking post existence:', err);
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (!post) {
      console.log(`Post ${postId} not found!`);
      db.close();
      return res.status(404).json({ error: 'Post not found.' });
    }
    
    console.log(`Post ${postId} exists: "${post.content.substring(0, 50)}..." (User ${post.user_id})`);
    
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
      db.close();
      if (err) {
        console.error('Comments fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch comments.' });
      }
      
      console.log(`Found ${comments.length} comments for post ${postId}:`);
      comments.forEach(comment => {
        console.log(`  Comment ${comment.id}: post_id=${comment.post_id}, user=${comment.username}, content="${comment.content.substring(0, 30)}..."`);
        if (comment.post_id != postId) {
          console.log(`  ⚠️  WARNING: Comment ${comment.id} has wrong post_id! Expected ${postId}, got ${comment.post_id}`);
        }
      });
      
      const formattedComments = comments.map(comment => ({
        ...comment,
        profile_picture: comment.profile_picture || 'https://via.placeholder.com/32x32/6a82fb/ffffff?text=👤'
      }));
      
      console.log(`Returning ${formattedComments.length} formatted comments\n`);
      res.json(formattedComments);
    });
  });
});

// Add a comment to a post
app.post('/api/posts/:postId/comments', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  const { content } = req.body;
  const userId = req.cookies.user_id;
  
  console.log(`\n=== ADDING COMMENT TO POST ${postId} ===`);
  console.log(`User: ${userId}, Content: "${content}"`);
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content is required.' });
  }
  
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  // First verify the post exists
  db.get('SELECT id, user_id, content FROM social_posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      console.error('Error checking post existence:', err);
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (!post) {
      console.log(`Post ${postId} not found!`);
      db.close();
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
        db.close();
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
            db.close();
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

// Like/Unlike a post
app.post('/api/posts/:postId/like', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  const userId = req.cookies.user_id;
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  // Check if user already liked the post
  db.get('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, existingLike) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (existingLike) {
      // Unlike the post
      db.run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (deleteErr) => {
        if (deleteErr) {
          db.close();
          return res.status(500).json({ error: 'Failed to unlike post.' });
        }
        
        // Get actual like count from database
        db.get('SELECT COUNT(*) as like_count FROM post_likes WHERE post_id = ?', [postId], (countErr, result) => {
          if (countErr) {
            db.close();
            return res.status(500).json({ error: 'Failed to get like count.' });
          }
          
          // Update post's like count with actual count
          db.run('UPDATE social_posts SET likes_count = ? WHERE id = ?', [result.like_count, postId], (updateErr) => {
            db.close();
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
          db.close();
          return res.status(500).json({ error: 'Failed to like post.' });
        }
        
        // Get actual like count from database
        db.get('SELECT COUNT(*) as like_count FROM post_likes WHERE post_id = ?', [postId], (countErr, result) => {
          if (countErr) {
            db.close();
            return res.status(500).json({ error: 'Failed to get like count.' });
          }
          
          // Update post's like count with actual count
          db.run('UPDATE social_posts SET likes_count = ? WHERE id = ?', [result.like_count, postId], (updateErr) => {
            db.close();
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

// Delete a post (only if user owns it)
app.delete('/api/posts/:postId', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  
  const postId = req.params.postId;
  const userId = req.cookies.user_id;
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  // Check if user owns the post
  db.get('SELECT * FROM social_posts WHERE id = ? AND user_id = ?', [postId, userId], (err, post) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    
    if (!post) {
      db.close();
      return res.status(404).json({ error: 'Post not found or you do not have permission to delete it.' });
    }
    
    // Delete the post (cascade will handle comments and likes)
    db.run('DELETE FROM social_posts WHERE id = ?', [postId], (deleteErr) => {
      db.close();
      if (deleteErr) {
        return res.status(500).json({ error: 'Failed to delete post.' });
      }
      res.json({ success: true, message: 'Post deleted successfully.' });
    });
  });
});

// Delete account endpoint
app.post('/api/delete-account', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const userId = req.cookies.user_id;
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  // First, check if user exists
  db.get('SELECT * FROM users WHERE id = ?', [userId], function(err, user) {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Database error.' });
    }
    if (!user) {
      db.close();
      res.clearCookie('user_id');
      return res.status(404).json({ error: 'User not found.' });
    }
    // Delete user from users table
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to delete account.' });
      }
      // Optionally: delete related data (posts, connections, etc.)
      db.close();
      res.clearCookie('user_id');
      return res.json({ success: true, message: 'Account deleted.' });
    });
  });
});

// Function to recalculate and fix post counts in database
function updatePostCounts() {
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
  
  console.log('Updating post counts in database...');
  
  // Update comments_count for all posts
  db.run(`
    UPDATE social_posts 
    SET comments_count = (
      SELECT COUNT(*) 
      FROM comments 
      WHERE comments.post_id = social_posts.id
    )
  `, (err) => {
    if (err) {
      console.error('Error updating comments count:', err);
    } else {
      console.log('Comments count updated successfully');
    }
  });
  
  // Update likes_count for all posts
  db.run(`
    UPDATE social_posts 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM post_likes 
      WHERE post_likes.post_id = social_posts.id
    )
  `, (err) => {
    if (err) {
      console.error('Error updating likes count:', err);
    } else {
      console.log('Likes count updated successfully');
    }
    db.close();
  });
}

// ================================
// TOURNAMENT API ROUTES  
// ================================

// Create a new tournament (temporarily without auth for testing)
app.post('/api/tournaments', (req, res) => {
  console.log('\n=== CREATING NEW TOURNAMENT ===');
  console.log('Request body:', req.body);
  console.log('User ID:', req.cookies.user_id);
  
  const dbPath = path.join(__dirname, '../../tournament_app.db');
  console.log('Database path:', dbPath);
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err.message);
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
    console.log('✅ Connected to tournaments database for creation');
  });
  
  const userId = req.cookies.user_id || 1; // Default to admin user for testing
  
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
    db.close();
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
    db.close();
    return res.status(400).json({ error: 'Invalid start date format' });
  }
  
  if (startDateTime <= now) {
    console.log('Validation failed: start date not in future');
    db.close();
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
      db.close();
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
      db.close();
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

  db.run(query, values, function(err) {
    if (err) {
      console.error('Error creating tournament:', err);
      db.close();
      return res.status(500).json({ error: 'Failed to create tournament: ' + err.message });
    }

    console.log('Tournament created with ID:', this.lastID);

    // Get the created tournament
    db.get('SELECT * FROM tournaments WHERE id = ?', [this.lastID], (err, tournament) => {
      db.close();
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

// Get all tournaments with optional filters
app.get('/api/tournaments', (req, res) => {
  console.log('\n🎯🎯🎯 GET /api/tournaments ROUTE HIT! 🎯🎯🎯');
  console.log('✅ THIS ROUTE IS WORKING!');
  console.log('Query params:', req.query);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  
  const dbPath = path.join(__dirname, '../../tournament_app.db');
  console.log('Database path:', dbPath);
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err.message);
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
    console.log('✅ Connected to tournaments database');
  });
  
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
  
  console.log('Final SQL query:', query);
  console.log('Query parameters:', params);
  
  db.all(query, params, (err, tournaments) => {
    db.close();
    if (err) {
      console.error('❌ Error fetching tournaments:', err);
      return res.status(500).json({ error: 'Failed to fetch tournaments', details: err.message });
    }
    
    console.log(`✅ Found ${tournaments.length} tournaments`);
    tournaments.forEach(t => {
      console.log(`  - ID: ${t.id}, Title: ${t.title}, Status: ${t.status}`);
    });
    
    res.json({ 
      success: true,
      tournaments: tournaments,
      count: tournaments.length 
    });
  });
});

// Get a specific tournament by ID
app.get('/api/tournaments/:id', (req, res) => {
  const db = new sqlite3.Database(path.join(__dirname, '../../tournament_app.db'));
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
    db.close();
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

// Update a tournament (temporarily without auth for testing)
app.put('/api/tournaments/:id', (req, res) => {
  console.log('\n=== UPDATING TOURNAMENT ===');
  console.log('Tournament ID:', req.params.id);
  console.log('Request body:', req.body);
  
  const dbPath = path.join(__dirname, '../../tournament_app.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err.message);
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
  });
  
  const tournamentId = req.params.id;
  const userId = req.cookies.user_id || 1; // Default to admin user for testing
  
  // Skip authorization check for testing
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

  console.log('Update data:', { title, description, game_type, status });

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
        status = COALESCE(?, status),
        updated_at = datetime('now')
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

    db.run(query, values, function(err) {
      if (err) {
        console.error('Error updating tournament:', err);
        db.close();
        return res.status(500).json({ error: 'Failed to update tournament' });
      }

      // Get the updated tournament
      db.get('SELECT * FROM tournaments WHERE id = ?', [tournamentId], (err, updatedTournament) => {
        db.close();
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
app.delete('/api/tournaments/:id', (req, res) => {
  console.log('\n=== DELETING TOURNAMENT ===');
  console.log('Tournament ID:', req.params.id);
  
  const dbPath = path.join(__dirname, '../../tournament_app.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err.message);
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
  });
  
  const tournamentId = req.params.id;
  const userId = req.cookies.user_id || 1; // Default to admin user for testing
  
  // Skip authorization check for testing - just delete the tournament
  db.run('DELETE FROM tournaments WHERE id = ?', [tournamentId], function(err) {
    db.close();
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

// ================================
// STATIC FILE MIDDLEWARE (AFTER API ROUTES)
// ================================

// Serve static files from src directory
app.use(express.static(path.join(__dirname, '../../src')));
// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ================================
// PAGE ROUTES (MUST BE LAST)
// ================================

// Serve HTML pages - SHOULD NEVER MATCH /api/* paths
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  
  console.log(`🌟 WILDCARD ROUTE HIT`);
  console.log(`🌟 Page param: "${page}"`);
  console.log(`🌟 Original URL: "${req.originalUrl}"`);
  console.log(`🌟 Method: ${req.method}`);
  
  // If this is ANY API path, it should NOT be here!
  if (req.originalUrl.startsWith('/api')) {
    console.log(`🚨 CRITICAL ERROR: Wildcard caught API request!`);
    console.log(`🚨 This means API routes are not being matched properly!`);
    return res.status(500).json({ 
      error: 'Server routing error - API request reached wildcard route',
      url: req.originalUrl,
      method: req.method
    });
  }
  
  // Also check just 'api' for safety
  if (page === 'api') {
    console.log(`⚠️ Direct /api access blocked by wildcard`);
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  if (protectedPages.includes(page)) {
    if (!isAuthenticated(req)) {
      return res.redirect('/');
    }
  }
  
  const filePath = path.join(__dirname, '../../src/', page);
  res.sendFile(filePath, err => {
    if (err) {
      res.status(404).send('Page not found');
    }
  });
});

app.listen(PORT, () => {
  console.log(`======================================`);
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`======================================`);
  console.log(`📋 Registered API Routes:`);
  console.log(`GET  /api/test`);
  console.log(`PUT  /api/simple-test`);
  console.log(`GET  /api/comments/:commentId`);
  console.log(`PUT  /api/comments/:commentId`);
  console.log(`DELETE /api/comments/:commentId`);
  console.log(`GET  /api/tournaments`);
  console.log(`POST /api/tournaments`);
  console.log(`GET  /api/tournaments/:id`);
  console.log(`PUT  /api/tournaments/:id`);
  console.log(`DELETE /api/tournaments/:id`);
  console.log(`======================================`);
  // Update counts on server start to ensure accuracy
  updatePostCounts();
});
