const API_BASE = 'http://localhost:5000/api';
const currentUser = 1;

// Fetch user connections from the API
async function fetchUserConnections() {
    try {
        const response = await fetch(`${API_BASE}/connections/users/${currentUser}`);
        const data = await response.json();

        updateFollowersTab(data.followers);
        updateFollowingTab(data.following);
        updatePendingTab(data.incoming_pending, data.outgoing_pending);

        const response2 = await fetch(`${API_BASE}/users`);
        const data2 = await response2.json();
        updateDiscoverUsersTab(data.following, data.incoming_pending, data.outgoing_pending, data2);

    } catch (error) {
        console.error('Error fetching user connections:', error);
    }
}

//fetch tournament data
async function fetchTournaments() {
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser}/tournaments`);
        const data = await response.json();
        console.log("Tournaments:", data);
        updateTournamentsTab(data);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
    }
}

// Fetch post data
async function fetchPosts() {
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser}/social_posts`);
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
                method: 'DELETE'
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
        const response = await fetch(`${API_BASE}/connections/follow/${currentUser}`, {
            method: 'POST',
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
        if (user_id == currentUser) return; 
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
    profileBio.innerHTML = user.bio ; // Clear existing content

    const lastLogin = document.getElementById('profile-lastlogin');
    lastLogin.innerHTML = `Last Login: ${!user.last_login ? 'Never' : user.last_login}`; // Clear existing content
}

function updateTournamentsTab(tournaments) {
    const tournamentsList = document.getElementById('tournamentsList');
    tournamentsList.innerHTML = ''; // Clear existing content
    tournaments.forEach(tournament => {
        const item = `
        <div class="tournament-card">
            <h3>${tournament.name}</h3>
            <p>${tournament.description}</p>
            <p>Date: ${new Date(tournament.date).toLocaleDateString()}</p>
        </div>
        `;
        tournamentsList.insertAdjacentHTML('beforeend', item);
    });
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

setupEventListeners();
fetchUserConnections();
fetchUserProfile(currentUser);