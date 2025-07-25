let currentCategory = 'home';
let posts = [];
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    setupEventListeners();
    loadPosts();
    attachCommentEventListeners(); // Add comment event listeners
});

// Check if user is authenticated
function checkAuthentication() {
    fetch(`${API_BASE}/users/profile`, {credentials: 'include'})
        .then(response => {
            if (!response.ok) {
                window.location.href = './login.html';
                return;
            }
            return response.json();
        })
        .then(user => {
            currentUser = user;
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            window.location.href = './login.html';
        });
}

// Setup event listeners
function setupEventListeners() {
    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const category = this.dataset.category;
            switchCategory(category);
        });
    });

    // Create post modal
    document.getElementById('create-post-btn').addEventListener('click', openCreatePostModal);
    document.getElementById('modal-close').addEventListener('click', closeCreatePostModal);
    document.getElementById('cancel-post').addEventListener('click', closeCreatePostModal);
    document.getElementById('post-form').addEventListener('submit', createPost);

    // Close modal on overlay click
    document.getElementById('create-post-modal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeCreatePostModal();
        }
    });

    // Global click handler to close dropdowns
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.post-menu')) {
            document.querySelectorAll('.menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
        }
        if (!e.target.closest('.comment-menu')) {
            document.querySelectorAll('.comment-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

// Switch category
function switchCategory(category) {
    if (category === currentCategory) return;

    currentCategory = category;

    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });

    loadPosts();
}

// Load posts
function loadPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '<div class="loading">Loading posts...</div>';

    fetch(`${API_BASE}/posts?category=${currentCategory}`, {credentials: 'include'})
        .then(response => response.json())
        .then(data => {
            posts = data;
            renderPosts();
        })
        .catch(error => {
            console.error('Error loading posts:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading posts</h3><p>Please try refreshing the page.</p></div>';
        });
}

// Render posts
function renderPosts() {
    const container = document.getElementById('posts-container');

    if (posts.length === 0) {
        let emptyMessage = '';
        switch (currentCategory) {
            case 'home':
                emptyMessage = '<h3>No posts yet</h3><p>Be the first to share something!</p>';
                break;
            case 'friends':
                emptyMessage = '<h3>No posts from friends</h3><p>Follow other users to see their posts here.</p>';
                break;
            case 'you':
                emptyMessage = '<h3>You haven\'t posted anything yet</h3><p>Click the + button to create your first post!</p>';
                break;
        }
        container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
        return;
    }

    // Clear any cached comments when re-rendering posts
    posts.forEach(post => {
        const commentsList = document.getElementById(`comments-list-${post.id}`);
        if (commentsList) {
            commentsList.innerHTML = '';
        }
    });

    container.innerHTML = posts.map(post => createPostHTML(post)).join('');

    // Attach event listeners to new elements
    attachPostEventListeners();
}

// Create post HTML
function createPostHTML(post) {
    const timeAgo = getTimeAgo(new Date(post.created_at));
    const hasImage = post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : '';
    const isOwner = currentUser && currentUser.username === post.username;

    return `
        <div class="post-card" data-post-id="${post.id}">
          <div class="post-header">
            <img src="${post.profile_picture}" alt="${post.username}" class="post-avatar">
            <div class="post-user-info">
              <h4>${escapeHtml(post.username)}</h4>
              <p class="post-time">${timeAgo}</p>
            </div>
            ${isOwner ? `
              <div class="post-menu">
                <button class="menu-trigger" data-post-id="${post.id}">⋯</button>
                <div class="menu-dropdown" id="menu-${post.id}">
                  <button class="menu-item edit-post-btn" data-post-id="${post.id}">✏️ Edit</button>
                  <button class="menu-item delete-post-btn" data-post-id="${post.id}">🗑️ Delete</button>
                </div>
              </div>
            ` : ''}
          </div>
          <div class="post-content">${escapeHtml(post.content)}</div>
          ${hasImage}
          <div class="post-actions">
            <button class="action-btn like-btn ${post.user_liked ? 'liked' : ''}" data-post-id="${post.id}">
              ${post.user_liked ? '❤️' : '🤍'} <span class="count">${post.likes_count}</span>
            </button>
            <button class="action-btn comment-btn" data-post-id="${post.id}">
              💬 <span class="count">${post.comments_count}</span>
            </button>
          </div>
          <div class="comments-section" id="comments-${post.id}">
            <div class="comment-form">
              <input type="text" class="comment-input" placeholder="Write a comment..." data-post-id="${post.id}">
              <button class="comment-submit" data-post-id="${post.id}">Post</button>
            </div>
            <div class="comments-list" id="comments-list-${post.id}"></div>
          </div>
        </div>
      `;
}

// Attach event listeners to posts
function attachPostEventListeners() {
    // Menu triggers
    document.querySelectorAll('.menu-trigger').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const postId = this.dataset.postId;
            const dropdown = document.getElementById(`menu-${postId}`);

            // Close all other dropdowns
            document.querySelectorAll('.menu-dropdown').forEach(menu => {
                if (menu.id !== `menu-${postId}`) {
                    menu.classList.remove('show');
                }
            });

            // Toggle current dropdown
            dropdown.classList.toggle('show');
        });
    });

    // Edit post buttons
    document.querySelectorAll('.edit-post-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const postId = this.dataset.postId;
            editPost(postId);
        });
    });

    // Delete post buttons
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const postId = this.dataset.postId;
            deletePost(postId);
        });
    });

    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const postId = this.dataset.postId;
            toggleLike(postId);
        });
    });

    // Comment buttons
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const postId = this.dataset.postId;
            toggleComments(postId);
        });
    });

    // Delete buttons (legacy - keeping for compatibility)
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const postId = this.dataset.postId;
            deletePost(postId);
        });
    });

    // Comment forms
    document.querySelectorAll('.comment-submit').forEach(btn => {
        btn.addEventListener('click', function () {
            const postId = this.dataset.postId;
            const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
            addComment(postId, input.value.trim());
        });
    });

    // Comment input enter key
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const postId = this.dataset.postId;
                addComment(postId, this.value.trim());
            }
        });
    });
}

// Toggle like
function toggleLike(postId) {
    fetch(`${API_BASE}/posts/${postId}/like`, { method: 'POST', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            const btn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
            const countSpan = btn.querySelector('.count');
            const post = posts.find(p => p.id == postId);

            if (data.liked) {
                btn.classList.add('liked');
                btn.innerHTML = `❤️ <span class="count">${data.likes_count || parseInt(countSpan.textContent) + 1}</span>`;
                post.user_liked = true;
                post.likes_count = data.likes_count || post.likes_count + 1;
            } else {
                btn.classList.remove('liked');
                btn.innerHTML = `🤍 <span class="count">${data.likes_count || parseInt(countSpan.textContent) - 1}</span>`;
                post.user_liked = false;
                post.likes_count = data.likes_count || post.likes_count - 1;
            }
        })
        .catch(error => {
            console.error('Error toggling like:', error);
        });
}

// Toggle comments
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentsList = document.getElementById(`comments-list-${postId}`);

    if (commentsSection.classList.contains('show')) {
        commentsSection.classList.remove('show');
    } else {
        commentsSection.classList.add('show');
        // Load comments if not already loaded
        if (commentsList.children.length === 0) {
            loadComments(postId);
        }
    }
}

// Load comments
function loadComments(postId) {

    // Clear existing comments first to prevent mixing
    const commentsList = document.getElementById(`comments-list-${postId}`);
    commentsList.innerHTML = '<div class="loading">Loading comments...</div>';

    fetch(`${API_BASE}/posts/${postId}/comments`, {credentials: 'include'})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(comments => {
            console.log(`Received ${comments.length} comments for post ${postId}:`, comments);

            // Verify all comments belong to this post
            const wrongComments = comments.filter(c => c.post_id != postId);
            if (wrongComments.length > 0) {
                console.error(`⚠️  ERROR: Received ${wrongComments.length} comments with wrong post_id for post ${postId}:`, wrongComments);
            }

            const post = posts.find(p => p.id == postId);
            const isPostOwner = currentUser && post && currentUser.username === post.username;

            // Clear loading message and set actual comments
            commentsList.innerHTML = '';

            if (comments.length === 0) {
                commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
            } else {
                commentsList.innerHTML = comments.map(comment => {
                    const isCommentOwner = currentUser && currentUser.username === comment.username;
                    const canEdit = isCommentOwner;
                    const canDelete = isCommentOwner || isPostOwner;

                    console.log(`Comment ${comment.id}: isCommentOwner=${isCommentOwner}, canEdit=${canEdit}, canDelete=${canDelete}`);

                    return `
                <div class="comment" data-comment-id="${comment.id}">
                  <img src="${comment.profile_picture}" alt="${comment.username}" class="comment-avatar">
                  <div class="comment-content">
                    <div class="comment-header">
                      <div class="comment-author">${escapeHtml(comment.username)}</div>
                      ${canEdit || canDelete ? `
                        <div class="comment-menu">
                          <button class="comment-menu-trigger" data-comment-id="${comment.id}" data-post-id="${postId}">⋯</button>
                          <div class="comment-menu-dropdown" id="comment-menu-${comment.id}">
                            ${canEdit ? `<button class="comment-menu-item edit-comment-btn" data-comment-id="${comment.id}" data-post-id="${postId}">✏️ Edit</button>` : ''}
                            ${canDelete ? `<button class="comment-menu-item delete-comment-btn" data-comment-id="${comment.id}" data-post-id="${postId}">🗑️ Delete</button>` : ''}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                    <div class="comment-text">${escapeHtml(comment.content)}</div>
                    <div class="comment-time">
                      ${getTimeAgo(new Date(comment.created_at))}
                      ${comment.edited_at ? `<span class="edited-indicator"> • edited</span>` : ''}
                    </div>
                  </div>
                </div>
              `;
                }).join('');
            }

            // Attach comment event listeners
            attachCommentEventListeners();
        })
        .catch(error => {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = '<div class="error">Failed to load comments. Please try again.</div>';
        });
}

// Add comment
function addComment(postId, content) {
    if (!content) return;

    fetch(`${API_BASE}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(comment => {
            console.log(`Comment added successfully:`, comment);

            // Verify the comment belongs to the correct post
            if (comment.post_id != postId) {
                console.error(`⚠️  ERROR: Comment returned with wrong post_id! Expected ${postId}, got ${comment.post_id}`);
                alert('Error: Comment was not properly associated with this post. Please refresh the page.');
                return;
            }

            const commentsList = document.getElementById(`comments-list-${postId}`);
            const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);

            // Remove "no comments" message if it exists
            const noCommentsMsg = commentsList.querySelector('.no-comments');
            if (noCommentsMsg) {
                noCommentsMsg.remove();
            }

            // Add new comment to list
            const postForComment = posts.find(p => p.id == postId);
            const isPostOwner = currentUser && postForComment && currentUser.username === postForComment.username;
            const isCommentOwner = true; // User just created this comment
            const canEdit = isCommentOwner;
            const canDelete = isCommentOwner || isPostOwner;

            const commentHTML = `
            <div class="comment" data-comment-id="${comment.id}">
              <img src="${comment.profile_picture}" alt="${comment.username}" class="comment-avatar">
              <div class="comment-content">
                <div class="comment-header">
                  <div class="comment-author">${escapeHtml(comment.username)}</div>
                  ${canEdit || canDelete ? `
                    <div class="comment-menu">
                      <button class="comment-menu-trigger" data-comment-id="${comment.id}" data-post-id="${postId}">⋯</button>
                      <div class="comment-menu-dropdown" id="comment-menu-${comment.id}">
                        ${canEdit ? `<button class="comment-menu-item edit-comment-btn" data-comment-id="${comment.id}" data-post-id="${postId}">✏️ Edit</button>` : ''}
                        ${canDelete ? `<button class="comment-menu-item delete-comment-btn" data-comment-id="${comment.id}" data-post-id="${postId}">🗑️ Delete</button>` : ''}
                      </div>
                    </div>
                  ` : ''}
                </div>                    <div class="comment-text">${escapeHtml(comment.content)}</div>
                    <div class="comment-time">
                      just now
                      ${comment.edited_at ? `<span class="edited-indicator"> • edited</span>` : ''}
                    </div>
              </div>
            </div>
          `;
            commentsList.insertAdjacentHTML('beforeend', commentHTML);

            // Attach comment event listeners
            attachCommentEventListeners();

            // Update comment count with accurate count from server
            const commentBtn = document.querySelector(`.comment-btn[data-post-id="${postId}"] .count`);
            if (comment.comments_count !== null && comment.comments_count !== undefined) {
                commentBtn.textContent = comment.comments_count;
            } else {
                commentBtn.textContent = parseInt(commentBtn.textContent) + 1;
            }

            // Clear input
            input.value = '';

            // Update posts array
            const post = posts.find(p => p.id == postId);
            if (post) {
                post.comments_count = comment.comments_count || post.comments_count + 1;
            }

            console.log(`Comment successfully added to post ${postId}`);
        })
        .catch(error => {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        });
}

// Attach comment event listeners using event delegation
function attachCommentEventListeners() {
    // Remove existing delegated listeners first
    document.removeEventListener('click', handleCommentEvents);

    // Add single delegated event listener
    document.addEventListener('click', handleCommentEvents);
}

// Handle comment events using delegation
function handleCommentEvents(e) {
    const target = e.target;

    // Comment menu trigger
    if (target.classList.contains('comment-menu-trigger')) {
        e.stopPropagation();
        const commentId = target.dataset.commentId;
        const dropdown = document.getElementById(`comment-menu-${commentId}`);

        // Close all other comment dropdowns
        document.querySelectorAll('.comment-menu-dropdown').forEach(menu => {
            if (menu.id !== `comment-menu-${commentId}`) {
                menu.classList.remove('show');
            }
        });

        // Toggle current dropdown
        dropdown.classList.toggle('show');
    }

    // Edit comment button
    if (target.classList.contains('edit-comment-btn')) {
        const commentId = target.dataset.commentId;
        const postId = target.dataset.postId;
        console.log('Edit button clicked for comment:', commentId, 'post:', postId);
        console.log('Target element:', target);
        console.log('Dataset:', target.dataset);
        editComment(commentId, postId);
    }

    // Delete comment button
    if (target.classList.contains('delete-comment-btn')) {
        const commentId = target.dataset.commentId;
        const postId = target.dataset.postId;
        console.log('Delete button clicked for comment:', commentId, 'post:', postId);
        console.log('Target element:', target);
        console.log('Dataset:', target.dataset);
        deleteComment(commentId, postId);
    }
}

function editComment(commentId, postId) {
    console.log('Edit comment called:', commentId, postId);

    // Close dropdown menu
    document.getElementById(`comment-menu-${commentId}`).classList.remove('show');

    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    const commentTextElement = commentElement.querySelector('.comment-text');
    const currentText = commentTextElement.textContent;

    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'comment-edit-form';
    editForm.innerHTML = `
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <input type="text" class="comment-edit-input" style="flex: 1; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 0.5rem; color: #fff; font-size: 0.9rem;">
          <button class="comment-edit-save" style="background: var(--gradient-main); border: none; border-radius: 8px; padding: 0.5rem 1rem; color: white; font-size: 0.8rem; cursor: pointer;">Save</button>
          <button class="comment-edit-cancel" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 0.5rem 1rem; color: #bbb; font-size: 0.8rem; cursor: pointer;">Cancel</button>
        </div>
      `;

    // Replace comment text with edit form
    commentTextElement.style.display = 'none';
    commentTextElement.parentNode.appendChild(editForm);

    const input = editForm.querySelector('.comment-edit-input');
    input.value = currentText; // Set the raw text, not escaped
    const saveBtn = editForm.querySelector('.comment-edit-save');
    const cancelBtn = editForm.querySelector('.comment-edit-cancel');

    input.focus();
    input.select();

    // Save handler
    saveBtn.addEventListener('click', function () {
        const newContent = input.value.trim();
        if (!newContent) {
            alert('Comment cannot be empty.');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        console.log('Saving comment with ID:', commentId, 'New content:', newContent);

        const fetchUrl = `${API_BASE}/comments/${commentId}`;
        console.log('Fetch URL:', fetchUrl);

        fetch(fetchUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent }),
            credentials: 'include'
        })
            .then(response => {
                console.log('PUT Response status:', response.status);
                console.log('PUT Response headers:', response.headers);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('PUT Response data:', data);
                if (data.success) {
                    // Update the comment text
                    commentTextElement.textContent = newContent;
                    commentTextElement.style.display = 'block';

                    // Add or update the edited indicator
                    const commentTimeElement = commentElement.querySelector('.comment-time');
                    let editedIndicator = commentTimeElement.querySelector('.edited-indicator');
                    if (!editedIndicator) {
                        editedIndicator = document.createElement('span');
                        editedIndicator.className = 'edited-indicator';
                        editedIndicator.textContent = ' • edited';
                        commentTimeElement.appendChild(editedIndicator);
                    }

                    editForm.remove();
                    alert('Comment updated successfully!');
                } else {
                    throw new Error(data.error || 'Failed to update comment');
                }
            })
            .catch(error => {
                console.error('Error updating comment:', error);
                alert(`Failed to update comment: ${error.message}`);
            })
            .finally(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            });
    });

    // Cancel handler
    cancelBtn.addEventListener('click', function () {
        commentTextElement.style.display = 'block';
        editForm.remove();
    });

    // Enter key handler
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });
}

function deleteComment(commentId, postId) {
    // Close dropdown menu
    document.getElementById(`comment-menu-${commentId}`).classList.remove('show');

    if (!confirm('Are you sure you want to delete this comment?')) return;

    console.log('Deleting comment with ID:', commentId);

    const fetchUrl = `${API_BASE}/comments/${commentId}`;
    console.log('Delete fetch URL:', fetchUrl);

    fetch(fetchUrl, { method: 'DELETE', credentials: 'include' })
        .then(response => {
            console.log('DELETE Response status:', response.status);
            console.log('DELETE Response headers:', response.headers);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('DELETE Response data:', data);
            if (data.success) {
                // Remove comment from DOM
                const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
                commentElement.remove();

                // Update comment count with accurate count from server
                const commentBtn = document.querySelector(`.comment-btn[data-post-id="${postId}"] .count`);
                if (data.comments_count !== null && data.comments_count !== undefined) {
                    commentBtn.textContent = data.comments_count;
                } else {
                    commentBtn.textContent = parseInt(commentBtn.textContent) - 1;
                }

                // Update posts array
                const post = posts.find(p => p.id == postId);
                if (post) {
                    post.comments_count = data.comments_count || post.comments_count - 1;
                }

                alert('Comment deleted successfully!');
            } else {
                throw new Error(data.error || 'Failed to delete comment');
            }
        })
        .catch(error => {
            console.error('Error deleting comment:', error);
            alert(`Failed to delete comment: ${error.message}`);
        });
}

// Edit post
function editPost(postId) {
    const post = posts.find(p => p.id == postId);
    if (!post) return;

    // Close dropdown menu
    document.getElementById(`menu-${postId}`).classList.remove('show');

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'modal-overlay show';
    editModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Edit Post</h2>
            <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <form id="edit-post-form">
            <div class="form-group">
              <label for="edit-post-content">Content</label>
              <textarea id="edit-post-content" rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: #fff; font-size: 1rem; resize: vertical; font-family: inherit; outline: none; transition: border-color 0.3s;" onfocus="this.style.borderColor='#6a82fb'" onblur="this.style.borderColor='rgba(255, 255, 255, 0.3)'"></textarea>
            </div>
            <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
              <button type="submit" class="btn-primary" id="update-post-btn">Update Post</button>
            </div>
          </form>
        </div>
      `;

    document.body.appendChild(editModal);

    // Set the textarea content and focus
    const textarea = document.getElementById('edit-post-content');
    textarea.value = post.content; // Set raw content, not escaped
    textarea.focus();
    textarea.select(); // Select all text for easy editing

    // Handle form submission
    document.getElementById('edit-post-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const content = document.getElementById('edit-post-content').value.trim();
        if (!content) {
            alert('Please enter some content for your post.');
            return;
        }

        const updateBtn = document.getElementById('update-post-btn');
        updateBtn.disabled = true;
        updateBtn.textContent = 'Updating...';

        fetch(`${API_BASE}/posts/${postId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content }),
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update post in posts array
                    post.content = content;

                    // Update DOM
                    const postElement = document.querySelector(`[data-post-id="${postId}"] .post-content`);
                    postElement.textContent = content;

                    // Close modal
                    editModal.remove();

                    alert('Post updated successfully!');
                } else {
                    throw new Error(data.error || 'Failed to update post');
                }
            })
            .catch(error => {
                console.error('Error updating post:', error);
                alert('Failed to update post. Please try again.');
            })
            .finally(() => {
                updateBtn.disabled = false;
                updateBtn.textContent = 'Update Post';
            });
    });
}

// Delete post
function deletePost(postId) {
    // Close dropdown menu if open
    const dropdown = document.getElementById(`menu-${postId}`);
    if (dropdown) dropdown.classList.remove('show');

    if (!confirm('Are you sure you want to delete this post?')) return;

    fetch(`${API_BASE}/posts/${postId}`, { method: 'DELETE', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove post from DOM
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                postElement.remove();

                // Remove from posts array
                posts = posts.filter(p => p.id != postId);

                // Check if we need to show empty state
                if (posts.length === 0) {
                    renderPosts();
                }
            }
        })
        .catch(error => {
            console.error('Error deleting post:', error);
        });
}

// Create post modal functions
function openCreatePostModal() {
    document.getElementById('create-post-modal').classList.add('show');
    document.getElementById('post-content').focus();
}

function closeCreatePostModal() {
    document.getElementById('create-post-modal').classList.remove('show');
    document.getElementById('post-form').reset();
}

// Create post
function createPost(e) {
    e.preventDefault();

    const content = document.getElementById('post-content').value.trim();
    const imageFile = document.getElementById('post-image').files[0];

    if (!content) {
        alert('Please enter some content for your post.');
        return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('post_type', 'general');
    if (imageFile) {
        formData.append('postImage', imageFile);
    }

    const submitBtn = document.getElementById('submit-post');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    fetch(`${API_BASE}/posts`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
        .then(response => response.json())
        .then(post => {
            // Add new post to the beginning of posts array
            posts.unshift(post);

            // Re-render posts
            renderPosts();

            // Close modal
            closeCreatePostModal();

            // Show success message
            alert('Post created successfully!');
        })
        .catch(error => {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post';
        });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(date) {
    try {
        // Handle different date formats
        let dateObj;
        if (typeof date === 'string') {
            // SQLite datetime format: "2025-01-16 10:30:45"
            // Convert to ISO format for proper parsing
            if (date.includes(' ') && !date.includes('T')) {
                dateObj = new Date(date.replace(' ', 'T') + 'Z'); // Add Z for UTC
            } else {
                dateObj = new Date(date);
            }
        } else {
            dateObj = date;
        }

        // Validate date
        if (isNaN(dateObj.getTime())) {
            console.error('Invalid date:', date);
            return 'unknown time';
        }

        const now = new Date();
        const diffInSeconds = Math.floor((now - dateObj) / 1000);

        // Debug logging
        console.log('Date calculation:', {
            original: date,
            parsed: dateObj.toISOString(),
            now: now.toISOString(),
            diffInSeconds: diffInSeconds
        });

        if (diffInSeconds < 0) {
            return 'just now'; // Handle future dates
        }
        if (diffInSeconds < 60) {
            return 'just now';
        }
        if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        }
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        }
        if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        }

        // For older dates, show the actual date
        return dateObj.toLocaleDateString();
    } catch (error) {
        console.error('Error in getTimeAgo:', error, 'Date:', date);
        return 'unknown time';
    }
}