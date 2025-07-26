

// Fetch user connections from the API
async function fetchUserConnections() {
    try {
        const response = await fetch(`${API_BASE}/connections/users`,
        { credentials: 'include' });
        const data = await response.json();

        updateFollowersTab(data.followers);
        updateFollowingTab(data.following);
        updatePendingTab(data.incoming_pending, data.outgoing_pending);

        const response2 = await fetch(`${API_BASE}/users`, { credentials: 'include' });
        const data2 = await response2.json();
        updateDiscoverUsersTab(data.following, data.incoming_pending, data.outgoing_pending, data2);

    } catch (error) {
        console.error('Error fetching user connections:', error);
    }
}

// Fetch post data
async function fetchPosts() {
    try {
        const response = await fetch(`${API_BASE}/users/social_posts`, { credentials: 'include' });
        const posts = await response.json();
        console.log("Posts:", posts);
        updatePostsTab(posts);

    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

// Profile display
async function fetchUserProfile(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`);
        const user = await response.json();

        updateProfileDisplay(user);
    } catch (error) {
        console.error('❌ DEBUG: Failed to fetch user profile:', error);
    }
}

// Function to remove a connection
// This function will be called when the user clicks the "Remove" button on a connection    
async function removeConnection(connectionId) {
    if (confirm('Are you sure you want to remove this connection?')) {
        try {
            const response = await fetch(`${API_BASE}/connections/${connectionId}`, {
                method: 'DELETE',
                credentials: 'include',

            });
            fetchUserConnections();
        } catch (error) {
            console.error('❌ DEBUG: Failed to remove connection:', error);
            alert(`Failed to remove connection: ${error.message}`);
        }
    } else {
        console.log('ℹ️ DEBUG: User cancelled connection removal');
    }
}


// Function to update the connection status (accept/reject)
async function updateConnectionStatus(connectionId, status) {
    try {
        const response = await fetch(`${API_BASE}/connections/${connectionId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });

        fetchUserConnections();
    } catch (error) {
        console.error('❌ DEBUG: Failed to update connection status:', error);
        alert(`Failed to ${status} connection: ${error.message}`);
    }
}

// Function to follow a user
// This function will be called when the user clicks the "Follow" button on a user in the discover tab
async function followUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/connections/follow`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                followingId: userId
            })
        });

        fetchUserConnections();
    } catch (error) {
        console.error('❌ DEBUG: Failed to follow user:', error);
    }
}


// Function to update the followers tab with fetched data
// This function updates the followers tab with the data fetched from the API
function updateFollowersTab(data) {
    const followersList = document.getElementById('followers-list');
    followersList.innerHTML = ''; // Clear existing list

    data.forEach((follower) => {
        item = `
        <li class="insta-card">
            <div class="user-avatar-small">${follower.follower_username.charAt(0).toUpperCase()}</div>
            <div class="insta-content">
                <span class="insta-title">${follower.follower_username}</span>
                <span class="insta-meta">Following since ${new Date(follower.created_at).toLocaleDateString()}</span>
            </div>
            <div class="connection-actions">
                <button type="button" class="btn-small btn-danger remove-connection-btn" data-connection-id="${follower.id}">Remove</button>
            </div>
        </li>
        `
        followersList.insertAdjacentHTML('beforeend', item);
    });
}

// Function to update the following tab with fetched data
// This function updates the following tab with the data fetched from the API
function updateFollowingTab(data) {
    const followingList = document.getElementById('following-list');
    followingList.innerHTML = ''; // Clear existing list

    data.forEach((following) => {
        const item = `
        <li class="insta-card">
            <div class="user-avatar-small">${following.following_username.charAt(0).toUpperCase()}</div>
            <div class="insta-content">
                <span class="insta-title">${following.following_username}</span>
                <span class="insta-meta">Following since ${new Date(following.created_at).toLocaleDateString()}</span>
            </div>
            <div class="connection-actions">
                <button type="button" class="btn-small btn-danger remove-connection-btn" data-connection-id="${following.id}">Remove</button>
            </div>
        </li>
        `;
        followingList.insertAdjacentHTML('beforeend', item);
    });
}

// Function to update the pending tab with fetched data
// This function updates the pending tab with the data fetched from the API
function updatePendingTab(upcoming_pending, outgoing_pending) {
    const pendingList = document.getElementById('pending-list');
    pendingList.innerHTML = ''; // Clear existing list

    pendingList.insertAdjacentHTML('beforeend', '<h3 style="color: #6a82fb; margin: 1rem 0 0.5rem 0; font-size: 1rem;">Requests Received</h3>'
    );
    upcoming_pending.forEach((pending) => {
        const item = `
        <li class="insta-card">
            <div class="user-avatar-small">${pending.requester_username.charAt(0).toUpperCase()}</div>
            <div class="insta-content">
                <span class="insta-title">${pending.requester_username}</span>
                <span class="insta-meta">Requested to follow ${new Date(pending.created_at).toLocaleDateString()}</span>
            </div>
            <div class="connection-actions">
                <button class="btn-small btn-success accept-request-btn" data-connection-id="${pending.id}">Accept</button>
                <button class="btn-small btn-danger reject-request-btn" data-connection-id="${pending.id}">Reject</button>
            </div>  
        </li>
        `;

        pendingList.insertAdjacentHTML('beforeend', item);
    });

    content = '<h3 style="color: #6a82fb; margin: 1rem 0 0.5rem 0; font-size: 1rem;">Requests Sent</h3>';
    pendingList.insertAdjacentHTML('beforeend', content);


    outgoing_pending.forEach((request) => {
        const item = `
        <li class="insta-card">
            <div class="user-avatar-small">${request.target_username.charAt(0).toUpperCase()}</div>
            <div class="insta-content">
                <span class="insta-title">${request.target_username}</span>
                <span class="insta-meta">Follow request sent ${new Date(request.created_at).toLocaleDateString()}</span>
            </div>
            <div class="connection-actions">
                <button class="btn-small btn-secondary remove-connection-btn" data-connection-id="${request.id}">Cancel</button>
            </div>
        </li>
        `;

        pendingList.insertAdjacentHTML('beforeend', item);
    });
}

// Function to update the discover users tab with fetched data
// This function updates the discover users tab with the data fetched from the API
function updateDiscoverUsersTab(followingList, upcoming_pending, outgoing_pending, discoveruserList) {
    const discoverList = document.getElementById('discover-list');
    discoverList.innerHTML = ''; // Clear existing list
    console.log("followingList:", followingList);
    discoveruserList.forEach((user) => {
        const user_id = user.id;
        if (followingList.some((following) => following.following_id === user_id)) return;
        if (upcoming_pending.some((pending) => pending.follower_id === user_id)) return;
        if (outgoing_pending.some((pending) => pending.following_id === user_id)) return;

        const item = `
        <li class="insta-card">
            <div class="user-avatar-small">${user.username.charAt(0).toUpperCase()}</div>
            <div class="insta-content">
                <span class="insta-title">${user.username}</span>
                <span class="insta-meta">Follow request sent ${new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <div class="connection-actions">
                <button type="button" class="btn-primary follow-user-btn" data-user-id="${user.id}">Follow</button>
            </div>
        </li>
    `;
        discoverList.insertAdjacentHTML('beforeend', item);
    });
}

function updateProfileDisplay(user) {
    const profileusername = document.getElementById('profile-username');
    profileusername.innerHTML = user.username; // Clear existing content

    const profileBio = document.getElementById('profile-bio');
    profileBio.innerHTML = user.bio; // Clear existing content

    const lastLogin = document.getElementById('profile-lastlogin');
    lastLogin.innerHTML = `Last Login: ${!user.last_login ? 'Never' : user.last_login}`; // Clear existing content
}

function updatePostsTab(posts) {
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = ''; // Clear existing content
    posts.forEach(post => {
        const item = `
        <div class="post-card">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <p>Date: ${new Date(post.date).toLocaleDateString()}</p>
        </div>
        `;
        postsList.insertAdjacentHTML('beforeend', item);
    });
}

// Function to switch between different connections tabs
function switchConnectionsTab(tabName) {
    if (!tabName) { tabName = 'followers'; }

    // Hide all connection content 
    document.querySelectorAll('.connections-content').forEach(content => {
        content.style.display = 'none';
    });

    // Show the selected tab content
    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }

    // Activate the clicked tab button
    document.querySelectorAll('.connections-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Find and activate the clicked tab button
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

//function for button events
function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('connections-tab-btn')) {
            console.log('🔔 DEBUG: Connections tab button clicked:', e.target.dataset.tab);
            e.preventDefault();
            e.stopPropagation();
            switchConnectionsTab(e.target.dataset.tab);
        }
        else if (e.target.classList.contains('follow-user-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const userId = parseInt(e.target.dataset.userId);
            followUser(userId);
        }
        else if (e.target.classList.contains('remove-connection-btn')) {
            console.log('🔔 DEBUG: Remove connection button clicked');
            e.preventDefault();
            e.stopPropagation();
            const connectionId = e.target.dataset.connectionId;
            removeConnection(connectionId);
        }

        else if (e.target.classList.contains('accept-request-btn')) {
            console.log('🔔 DEBUG: Accept request button clicked');
            e.preventDefault();
            e.stopPropagation();
            const connectionId = e.target.dataset.connectionId;
            updateConnectionStatus(connectionId, 'accepted');
        }

        else if (e.target.classList.contains('reject-request-btn')) {
            console.log('🔔 DEBUG: Reject request button clicked');
            e.preventDefault();
            e.stopPropagation();
            const connectionId = e.target.dataset.connectionId;
            updateConnectionStatus(connectionId, 'blocked');
        }
        else if (e.target.classList.contains('tab-btn')) {
            // Identify all tab buttons and contents
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = [
                document.getElementById('tab-tournaments'),
                document.getElementById('tab-friends'),
                document.getElementById('tab-posts')
            ];

            // Find which button was clicked
            const clickedBtn = e.target;
            const clickedIndex = Array.from(tabBtns).indexOf(clickedBtn);

            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            clickedBtn.classList.add('active');

            // Show/hide content
            tabContents.forEach((c, i) => {
                c.style.display = i === clickedIndex ? '' : 'none';
            });

            // Call connections tab function if needed
            switchConnectionsTab();
        }
    });
}

// Load profile data from backend
async function loadProfile() {
    try {
        // 1. Fetch user info
        const res = await fetch(`${API_BASE}/users/profile`, { credentials: 'include' });
        if (!res.ok) return;
        const user = await res.json();

        // Fill in user info
        document.querySelector('.profile-username').textContent = user.username || 'GamerTag123';
        document.querySelector('.profile-bio').textContent = user.bio || 'Competitive gamer. FPS enthusiast. Always up for a challenge!';
        document.querySelector('.profile-lastlogin').textContent = user.last_login ? 'Last login: ' + user.last_login : 'Last login: 2025-07-12 14:30';

        // Set profile picture - use anonymous placeholder if no picture exists
        const profileAvatar = document.querySelector('.profile-avatar');
        if (user.profile_picture && user.profile_picture.trim() !== '') {
            profileAvatar.src = user.profile_picture;
        } else {
            profileAvatar.src = 'https://via.placeholder.com/100x100/6a82fb/ffffff?text=👤';
        }

        // Stats
        const statValue = document.querySelector('.stat-value');
        if (statValue) {
            statValue.textContent = user.total_hours || '1,250';
        }

        // Achievements/badges
        if (user.badges && Array.isArray(user.badges)) {
            document.querySelector('.profile-badges').innerHTML = user.badges.map(b =>
                `<span class="badge"><span class="badge-icon" aria-hidden="true">${b.icon || '🏆'}</span> ${b.title} <span class="badge-desc">${b.desc || ''}</span></span>`
            ).join('');
        }

        // Tournaments
        const tRes = await fetch(`${API_BASE}/tournaments`, { credentials: 'include' });
        if (tRes.ok) {
            const tournaments = await tRes.json();
            const tournamentsList = tournaments.tournaments || [];
            document.querySelector('#tab-tournaments .insta-list').innerHTML = tournaments.count
                ? tournamentsList.map(t => (`
                <li class="insta-card">
                <img src="${t.logo || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=facearea&w=256&h=256'}" alt="Tournament Logo" class="insta-thumb">
                <div class="insta-content">
                    <span class="insta-title">${t.title}</span>
                    <span class="insta-meta">Joined: ${t.joined_at || '-'} · Status: ${t.status || '-'}</span>
                </div>
                <span class="insta-action">View</span>
                </li>
            `)).join('') : '<li class="no-users">No tournaments joined yet.</li>';
        }

        // Posts
        const pRes = await fetch(`${API_BASE}/posts`, { credentials: 'include' });
        if (pRes.ok) {
            const posts = await pRes.json();
            document.querySelector('#tab-posts .insta-list').innerHTML = posts.length
                ? posts.map(post => `
                <li class="insta-card">
                <img src="${post.image_url || 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=facearea&w=256&h=256'}" alt="Post Image" class="insta-thumb">
                <div class="insta-content">
                    <span class="insta-title">${post.content}</span>
                    <span class="insta-meta">${post.created_at} · ${post.likes_count || 0} Likes · ${post.comments_count || 0} Comments</span>
                </div>
                <span class="insta-action">Like</span>
                </li>
            `).join('') : '<li class="no-users">No posts yet.</li>';
        }
    } catch (e) {
        console.error('Error loading profile:', e);
        // Keep default static content if API fails
    }
}

// Tab switching logic, keyboard accessible
document.addEventListener('DOMContentLoaded', function () {

    // Setup event listeners for tab buttons
    setupEventListeners();

    // Fetch user connections
    fetchUserConnections();

    // Load profile data first
    loadProfile();

    // Edit Profile Modal Logic - More robust approach
    setupEditProfileModal();
});

function setupEditProfileModal() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditProfile = document.getElementById('closeEditProfile');
    const cancelEditProfile = document.getElementById('cancelEditProfile');
    const editProfileForm = document.getElementById('editProfileForm');
    const uploadBtn = document.getElementById('uploadProfilePictureBtn');
    const fileInput = document.getElementById('editProfilePicture');
    const preview = document.getElementById('profilePicturePreview');

    if (!editProfileBtn) {
        console.error('Edit Profile button not found!');
        return;
    }

    if (!editProfileModal) {
        console.error('Edit Profile modal not found!');
        return;
    }

    // File upload handlers
    if (uploadBtn && fileInput && preview) {
        // Click upload button to trigger file input
        uploadBtn.onclick = function () {
            fileInput.click();
        };

        // Click preview image to trigger file input
        preview.onclick = function () {
            fileInput.click();
        };

        // Handle file selection
        fileInput.onchange = function (e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    return;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image file size must be less than 5MB.');
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    }

    // Remove profile picture button
    const removeBtn = document.getElementById('removeProfilePictureBtn');
    if (removeBtn) {
        removeBtn.onclick = function () {
            preview.src = 'https://via.placeholder.com/80x80/6a82fb/ffffff?text=👤';
            fileInput.value = '';
            preview.setAttribute('data-removed', 'true');
        };
    }

    // Reset data-removed when opening modal or selecting a new file
    if (fileInput) {
        fileInput.onchange = function (e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    return;
                }
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image file size must be less than 5MB.');
                    return;
                }
                // Show preview
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result;
                    preview.removeAttribute('data-removed');
                };
                reader.readAsDataURL(file);
            }
        };
    }

    // Also clear data-removed when opening modal
    if (preview) {
        preview.removeAttribute('data-removed');
    }

    // Add click event to button
    editProfileBtn.onclick = function (e) {
        e.preventDefault();
        console.log('Edit Profile button clicked (onclick)');
        openEditModal();
    };

    // Also add event listener as backup
    editProfileBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('Edit Profile button clicked (event listener)');
        openEditModal();
    });

    // Close modal events
    if (closeEditProfile) {
        closeEditProfile.onclick = function () {
            editProfileModal.style.display = 'none';
            console.log('Modal closed (X)');
        };
    }

    if (cancelEditProfile) {
        cancelEditProfile.onclick = function () {
            editProfileModal.style.display = 'none';
            console.log('Modal closed (Cancel)');
        };
    }

    // Form submission
    if (editProfileForm) {
        editProfileForm.onsubmit = async function (e) {
            e.preventDefault();
            console.log('Form submitted');
            await saveProfile();
        };
    }

    // Click outside to close
    editProfileModal.onclick = function (e) {
        if (e.target === editProfileModal) {
            editProfileModal.style.display = 'none';
            console.log('Modal closed (outside click)');
        }
    };
}

async function openEditModal() {
    const editProfileModal = document.getElementById('editProfileModal');
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    console.log('Opening modal...');

    // Show modal immediately
    editProfileModal.style.display = 'flex';
    console.log('Modal display set to flex');

    // Try to fetch profile data
    try {
        const response = await fetch(`${API_BASE}/users/profile`, { credentials: 'include' });
        if (response.ok) {
            const user = await response.json();
            console.log('User data loaded:', user);
            document.getElementById('editUsername').value = user.username || '';
            document.getElementById('editBio').value = user.bio || '';

            // Set profile picture preview - use anonymous placeholder if no picture exists
            if (user.profile_picture && user.profile_picture.trim() !== '') {
                profilePicturePreview.src = user.profile_picture;
            } else {
                profilePicturePreview.src = 'https://via.placeholder.com/80x80/6a82fb/ffffff?text=👤';
            }
        } else {
            console.log('Not logged in, using default values');
            // Use default values from current page
            document.getElementById('editUsername').value = 'GamerTag123';
            document.getElementById('editBio').value = 'Competitive gamer. FPS enthusiast. Always up for a challenge!';
            profilePicturePreview.src = 'https://via.placeholder.com/80x80/6a82fb/ffffff?text=👤';
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        // Use default values
        document.getElementById('editUsername').value = 'GamerTag123';
        document.getElementById('editBio').value = 'Competitive gamer. FPS enthusiast. Always up for a challenge!';
        profilePicturePreview.src = 'https://via.placeholder.com/80x80/6a82fb/ffffff?text=👤';
    }
}

async function saveProfile() {
    const username = document.getElementById('editUsername').value;
    const bio = document.getElementById('editBio').value;
    const fileInput = document.getElementById('editProfilePicture');
    const preview = document.getElementById('profilePicturePreview');
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('bio', bio);
        if (fileInput.files[0]) {
            formData.append('profilePicture', fileInput.files[0]);
        }
        if (preview.getAttribute('data-removed') === 'true') {
            formData.append('removeProfilePicture', 'true');
        }
        const response = await fetch(`${API_BASE}/users/profile`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        if (response.ok) {
            const result = await response.json();
            document.getElementById('editProfileModal').style.display = 'none';
            document.querySelector('.profile-username').textContent = username;
            document.querySelector('.profile-bio').textContent = bio;
            // Always update profile picture immediately
            if (preview.getAttribute('data-removed') === 'true' || !result.profile_picture || result.profile_picture.trim() === '') {
                document.getElementById('profileAvatar').src = 'https://via.placeholder.com/100x100/6a82fb/ffffff?text=👤';
            } else {
                document.getElementById('profileAvatar').src = result.profile_picture;
            }
            alert('Profile updated successfully!');
            await loadProfile();
        } else {
            const errorData = await response.json();
            alert('Error saving profile: ' + (errorData.message || 'Please try again.'));
        }
    } catch (error) {
        alert('Error saving profile. Please try again.');
    }
}

// Delete Account logic
document.addEventListener('DOMContentLoaded', function () {
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.onclick = async function () {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                try {
                    const res = await fetch(`${API_BASE}/users`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (res.ok) {
                        alert('Your account has been deleted.');
                        window.location.href = 'login.html';
                    } else {
                        const err = await res.json();
                        alert('Error deleting account: ' + (err.message || 'Please try again.'));
                    }
                } catch (e) {
                    alert('Error deleting account. Please try again.');
                }
            }
        };
    }
});

// Delete Account logic for modal and top button
document.addEventListener('DOMContentLoaded', function () {
    // Top right delete button only
    const deleteAccountTopBtn = document.getElementById('deleteAccountTopBtn');
    if (deleteAccountTopBtn) {
        deleteAccountTopBtn.onclick = async function () {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                try {
                    const response = await fetch('/api/delete-account', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        alert('Your account has been deleted.');
                        window.location.href = 'login.html';
                    } else {
                        const errorData = await response.json();
                        alert('Error deleting account: ' + (errorData.message || 'Please try again.'));
                    }
                } catch (error) {
                    alert('Error deleting account. Please try again.');
                }
            }
        };
    }
});