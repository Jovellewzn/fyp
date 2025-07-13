// Main JS for GameVibe Arena
console.log('GameVibe Arena loaded');

// Tournament Participants CRUD System
class TournamentParticipantsCRUD {
    constructor() {
        this.participants = new Map(); // Store participants by tournament ID
        this.currentTournamentId = null;
        this.init();
    }

    init() {
        // Load initial data and set up event listeners
        this.setupEventListeners();
        this.loadSampleData();
    }

    setupEventListeners() {
        // Add event listeners for View Details buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn') || 
                (e.target.closest('.tournament-btn') && e.target.textContent === 'View Details')) {
                e.preventDefault();
                const tournamentCard = e.target.closest('.tournament-card');
                const tournamentId = tournamentCard.dataset.tournamentId || 
                    this.getTournamentIdFromCard(tournamentCard);
                this.showParticipantsModal(tournamentId);
            }

            // Join tournament button
            if (e.target.classList.contains('join-btn') || 
                (e.target.textContent === 'Join' && e.target.classList.contains('tournament-btn'))) {
                e.preventDefault();
                const tournamentCard = e.target.closest('.tournament-card');
                const tournamentId = tournamentCard.dataset.tournamentId || 
                    this.getTournamentIdFromCard(tournamentCard);
                this.showJoinModal(tournamentId);
            }

            // Close modal
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }

            // Edit participant
            if (e.target.classList.contains('edit-participant-btn')) {
                const participantId = e.target.dataset.participantId;
                this.editParticipant(participantId);
            }

            // Delete participant
            if (e.target.classList.contains('delete-participant-btn')) {
                const participantId = e.target.dataset.participantId;
                this.deleteParticipant(participantId);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'join-tournament-form') {
                e.preventDefault();
                this.handleJoinTournament(e.target);
            }

            if (e.target.id === 'edit-participant-form') {
                e.preventDefault();
                this.handleEditParticipant(e.target);
            }
        });
    }

    getTournamentIdFromCard(card) {
        // Extract tournament ID from card title or create a unique ID
        const title = card.querySelector('.tournament-title').textContent.trim();
        return title.toLowerCase().replace(/\s+/g, '-');
    }

    // CREATE: Join tournament
    joinTournament(tournamentId, userData) {
        if (!this.participants.has(tournamentId)) {
            this.participants.set(tournamentId, []);
        }

        const participants = this.participants.get(tournamentId);
        
        // Check if user already joined
        const existingParticipant = participants.find(p => p.username === userData.username);
        if (existingParticipant) {
            alert('You have already joined this tournament!');
            return false;
        }

        const newParticipant = {
            id: Date.now().toString(),
            tournamentId: tournamentId,
            username: userData.username,
            teamName: userData.teamName || '',
            registrationDate: new Date().toISOString(),
            status: 'registered'
        };

        participants.push(newParticipant);
        this.participants.set(tournamentId, participants);
        
        console.log('Participant added:', newParticipant);
        return true;
    }

    // READ: Get participants for a tournament
    getParticipants(tournamentId) {
        return this.participants.get(tournamentId) || [];
    }

    // UPDATE: Edit participant
    updateParticipant(participantId, updateData) {
        for (let [tournamentId, participants] of this.participants) {
            const participantIndex = participants.findIndex(p => p.id === participantId);
            if (participantIndex !== -1) {
                participants[participantIndex] = { ...participants[participantIndex], ...updateData };
                this.participants.set(tournamentId, participants);
                return true;
            }
        }
        return false;
    }

    // DELETE: Remove participant
    removeParticipant(participantId) {
        for (let [tournamentId, participants] of this.participants) {
            const participantIndex = participants.findIndex(p => p.id === participantId);
            if (participantIndex !== -1) {
                participants.splice(participantIndex, 1);
                this.participants.set(tournamentId, participants);
                return true;
            }
        }
        return false;
    }

    showJoinModal(tournamentId) {
        this.currentTournamentId = tournamentId;
        const modal = this.createJoinModal();
        document.body.appendChild(modal);
    }

    showParticipantsModal(tournamentId) {
        this.currentTournamentId = tournamentId;
        const participants = this.getParticipants(tournamentId);
        const modal = this.createParticipantsModal(participants);
        document.body.appendChild(modal);
    }

    createJoinModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Join Tournament</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="join-tournament-form" class="join-form">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="team-name">Team Name (Optional):</label>
                        <input type="text" id="team-name" name="teamName" placeholder="Enter your team name">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                        <button type="submit" class="btn-primary">Join Tournament</button>
                    </div>
                </form>
            </div>
        `;
        return modal;
    }

    createParticipantsModal(participants) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        const participantsList = participants.map(participant => `
            <div class="participant-item">
                <div class="participant-info">
                    <span class="participant-username">${participant.username}</span>
                    <span class="participant-team">${participant.teamName || 'No team'}</span>
                    <span class="participant-status">${participant.status}</span>
                    <span class="participant-date">${new Date(participant.registrationDate).toLocaleDateString()}</span>
                </div>
                <div class="participant-actions">
                    <button class="btn-edit edit-participant-btn" data-participant-id="${participant.id}">Edit</button>
                    <button class="btn-delete delete-participant-btn" data-participant-id="${participant.id}">Remove</button>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Tournament Participants (${participants.length})</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="participants-list">
                    ${participants.length > 0 ? participantsList : '<p class="no-participants">No participants yet.</p>'}
                </div>
            </div>
        `;
        return modal;
    }

    createEditModal(participant) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Participant</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="edit-participant-form" class="edit-form">
                    <input type="hidden" name="participantId" value="${participant.id}">
                    <div class="form-group">
                        <label for="edit-username">Username:</label>
                        <input type="text" id="edit-username" name="username" value="${participant.username}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-team-name">Team Name:</label>
                        <input type="text" id="edit-team-name" name="teamName" value="${participant.teamName || ''}" placeholder="Enter team name">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                        <button type="submit" class="btn-primary">Update</button>
                    </div>
                </form>
            </div>
        `;
        return modal;
    }

    handleJoinTournament(form) {
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            teamName: formData.get('teamName')
        };

        const success = this.joinTournament(this.currentTournamentId, userData);
        if (success) {
            alert('Successfully joined the tournament!');
            this.closeModal();
        }
    }

    handleEditParticipant(form) {
        const formData = new FormData(form);
        const participantId = formData.get('participantId');
        const updateData = {
            username: formData.get('username'),
            teamName: formData.get('teamName')
        };

        const success = this.updateParticipant(participantId, updateData);
        if (success) {
            alert('Participant updated successfully!');
            this.closeModal();
            // Refresh the participants modal
            this.showParticipantsModal(this.currentTournamentId);
        }
    }

    editParticipant(participantId) {
        // Find the participant
        let participant = null;
        for (let [tournamentId, participants] of this.participants) {
            participant = participants.find(p => p.id === participantId);
            if (participant) break;
        }

        if (participant) {
            this.closeModal();
            const editModal = this.createEditModal(participant);
            document.body.appendChild(editModal);
        }
    }

    deleteParticipant(participantId) {
        if (confirm('Are you sure you want to remove this participant?')) {
            const success = this.removeParticipant(participantId);
            if (success) {
                alert('Participant removed successfully!');
                // Refresh the participants modal
                this.showParticipantsModal(this.currentTournamentId);
            }
        }
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    loadSampleData() {
        // Load some sample participants for demonstration
        this.joinTournament('valorant-masters', { username: 'ProGamer123', teamName: 'Elite Squad' });
        this.joinTournament('valorant-masters', { username: 'SniperKing', teamName: 'Shadow Ops' });
        this.joinTournament('rocket-league-cup', { username: 'RocketMan', teamName: 'Flying Cars' });
    }
}

// User Connections CRUD System
class UserConnectionsCRUD {
    constructor() {
        this.connections = new Map(); // Store connections by user ID
        this.users = new Map(); // Store all users
        this.currentUserId = 1; // Mock current user ID
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.updateConnectionsUI();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // Follow/Unfollow buttons
            if (e.target.classList.contains('follow-user-btn')) {
                const userId = parseInt(e.target.dataset.userId);
                this.followUser(userId);
            }

            if (e.target.classList.contains('unfollow-user-btn')) {
                const userId = parseInt(e.target.dataset.userId);
                this.unfollowUser(userId);
            }

            // Connection status updates
            if (e.target.classList.contains('accept-request-btn')) {
                const connectionId = e.target.dataset.connectionId;
                this.updateConnectionStatus(connectionId, 'accepted');
            }

            if (e.target.classList.contains('reject-request-btn')) {
                const connectionId = e.target.dataset.connectionId;
                this.updateConnectionStatus(connectionId, 'blocked');
            }

            // Remove connections
            if (e.target.classList.contains('remove-connection-btn')) {
                const connectionId = e.target.dataset.connectionId;
                this.removeConnection(connectionId);
            }

            // Show discover users modal
            if (e.target.classList.contains('discover-users-btn')) {
                e.preventDefault();
                this.showDiscoverUsersModal();
            }

            // Close modal
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }

            // Tab switching for connections
            if (e.target.classList.contains('connections-tab-btn')) {
                this.switchConnectionsTab(e.target.dataset.tab);
            }
        });
    }

    // CREATE: Follow a user
    followUser(targetUserId) {
        if (targetUserId === this.currentUserId) {
            alert("You can't follow yourself!");
            return false;
        }

        // Check if connection already exists
        const existingConnection = this.findConnection(this.currentUserId, targetUserId);
        if (existingConnection) {
            alert('Connection already exists!');
            return false;
        }

        const newConnection = {
            id: Date.now().toString(),
            follower_id: this.currentUserId,
            following_id: targetUserId,
            connection_type: 'pending',
            created_at: new Date().toISOString()
        };

        if (!this.connections.has(this.currentUserId)) {
            this.connections.set(this.currentUserId, []);
        }

        this.connections.get(this.currentUserId).push(newConnection);
        
        alert('Follow request sent!');
        this.updateConnectionsUI();
        this.refreshDiscoverModal();
        return true;
    }

    // READ: Get connections for a user
    getFollowers(userId) {
        const followers = [];
        for (let [otherId, connections] of this.connections) {
            connections.forEach(conn => {
                if (conn.following_id === userId && conn.connection_type === 'accepted') {
                    followers.push({
                        ...conn,
                        user: this.users.get(conn.follower_id)
                    });
                }
            });
        }
        return followers;
    }

    getFollowing(userId) {
        const userConnections = this.connections.get(userId) || [];
        return userConnections
            .filter(conn => conn.connection_type === 'accepted')
            .map(conn => ({
                ...conn,
                user: this.users.get(conn.following_id)
            }));
    }

    getPendingRequests(userId) {
        const pending = [];
        for (let [otherId, connections] of this.connections) {
            connections.forEach(conn => {
                if (conn.following_id === userId && conn.connection_type === 'pending') {
                    pending.push({
                        ...conn,
                        user: this.users.get(conn.follower_id)
                    });
                }
            });
        }
        return pending;
    }

    // Get outgoing pending requests (requests sent by the user)
    getOutgoingPendingRequests(userId) {
        const userConnections = this.connections.get(userId) || [];
        return userConnections
            .filter(conn => conn.connection_type === 'pending')
            .map(conn => ({
                ...conn,
                user: this.users.get(conn.following_id)
            }));
    }

    // UPDATE: Change connection status
    updateConnectionStatus(connectionId, newStatus) {
        for (let [userId, connections] of this.connections) {
            const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
            if (connectionIndex !== -1) {
                const connection = connections[connectionIndex];
                connections[connectionIndex].connection_type = newStatus;
                this.connections.set(userId, connections);
                
                // If accepting a follow request, automatically follow them back (mutual follow)
                if (newStatus === 'accepted' && connection.following_id === this.currentUserId) {
                    const followBackConnection = {
                        id: Date.now().toString() + '_followback',
                        follower_id: this.currentUserId,
                        following_id: connection.follower_id,
                        connection_type: 'accepted',
                        created_at: new Date().toISOString()
                    };
                    
                    // Check if we're not already following them back
                    const existingFollowBack = this.findConnection(this.currentUserId, connection.follower_id);
                    if (!existingFollowBack) {
                        if (!this.connections.has(this.currentUserId)) {
                            this.connections.set(this.currentUserId, []);
                        }
                        this.connections.get(this.currentUserId).push(followBackConnection);
                    }
                }
                
                const statusMessages = {
                    'accepted': 'Follow request accepted! You are now following each other.',
                    'blocked': 'User has been blocked!',
                    'pending': 'Status updated to pending!'
                };
                
                alert(statusMessages[newStatus] || 'Status updated!');
                this.updateConnectionsUI();
                return true;
            }
        }
        return false;
    }

    // DELETE: Unfollow user
    unfollowUser(targetUserId) {
        const connection = this.findConnection(this.currentUserId, targetUserId);
        if (connection) {
            return this.removeConnection(connection.id);
        }
        return false;
    }

    // DELETE: Remove connection
    removeConnection(connectionId) {
        if (confirm('Are you sure you want to remove this connection?')) {
            for (let [userId, connections] of this.connections) {
                const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
                if (connectionIndex !== -1) {
                    connections.splice(connectionIndex, 1);
                    this.connections.set(userId, connections);
                    alert('Connection removed successfully!');
                    this.updateConnectionsUI();
                    return true;
                }
            }
        }
        return false;
    }

    // Helper: Find connection between two users
    findConnection(followerId, followingId) {
        const userConnections = this.connections.get(followerId) || [];
        return userConnections.find(conn => 
            conn.follower_id === followerId && conn.following_id === followingId
        );
    }

    // Helper: Check if user is connected
    isConnected(targetUserId) {
        return this.findConnection(this.currentUserId, targetUserId) !== undefined;
    }

    // Helper: Get connection status
    getConnectionStatus(targetUserId) {
        const connection = this.findConnection(this.currentUserId, targetUserId);
        return connection ? connection.connection_type : null;
    }

    // UI: Update connections in profile tabs
    updateConnectionsUI() {
        this.updateFollowersTab();
        this.updateFollowingTab();
        this.updatePendingTab();
    }

    updateFollowersTab() {
        const followers = this.getFollowers(this.currentUserId);
        const followersContainer = document.getElementById('followers-list');
        
        if (followersContainer) {
            if (followers.length === 0) {
                followersContainer.innerHTML = '<p class="no-connections">No followers yet.</p>';
            } else {
                followersContainer.innerHTML = followers.map(follower => `
                    <li class="insta-card">
                        <div class="user-avatar-small">${follower.user.username.charAt(0).toUpperCase()}</div>
                        <div class="insta-content">
                            <span class="insta-title">${follower.user.username}</span>
                            <span class="insta-meta">Following since ${new Date(follower.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="connection-actions">
                            <button class="btn-small btn-danger remove-connection-btn" data-connection-id="${follower.id}">Remove</button>
                        </div>
                    </li>
                `).join('');
            }
        }
    }

    updateFollowingTab() {
        const following = this.getFollowing(this.currentUserId);
        const followingContainer = document.getElementById('following-list');
        
        if (followingContainer) {
            if (following.length === 0) {
                followingContainer.innerHTML = '<p class="no-connections">Not following anyone yet.</p>';
            } else {
                followingContainer.innerHTML = following.map(follow => `
                    <li class="insta-card">
                        <div class="user-avatar-small">${follow.user.username.charAt(0).toUpperCase()}</div>
                        <div class="insta-content">
                            <span class="insta-title">${follow.user.username}</span>
                            <span class="insta-meta">Following since ${new Date(follow.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="connection-actions">
                            <button class="btn-small btn-secondary unfollow-user-btn" data-user-id="${follow.user.id}">Unfollow</button>
                        </div>
                    </li>
                `).join('');
            }
        }
    }

    updatePendingTab() {
        const incomingPending = this.getPendingRequests(this.currentUserId);
        const outgoingPending = this.getOutgoingPendingRequests(this.currentUserId);
        const pendingContainer = document.getElementById('pending-list');
        
        if (pendingContainer) {
            let content = '';
            
            // Outgoing pending requests (people you've requested to follow)
            if (outgoingPending.length > 0) {
                content += '<h3 style="color: #6a82fb; margin: 1rem 0 0.5rem 0; font-size: 1rem;">Requests Sent</h3>';
                content += outgoingPending.map(request => `
                    <li class="insta-card">
                        <div class="user-avatar-small">${request.user.username.charAt(0).toUpperCase()}</div>
                        <div class="insta-content">
                            <span class="insta-title">${request.user.username}</span>
                            <span class="insta-meta">Follow request sent ${new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="connection-actions">
                            <button class="btn-small btn-secondary remove-connection-btn" data-connection-id="${request.id}">Cancel</button>
                        </div>
                    </li>
                `).join('');
            }
            
            // Incoming pending requests (people who want to follow you)
            if (incomingPending.length > 0) {
                content += '<h3 style="color: #6a82fb; margin: 1rem 0 0.5rem 0; font-size: 1rem;">Requests Received</h3>';
                content += incomingPending.map(request => `
                    <li class="insta-card">
                        <div class="user-avatar-small">${request.user.username.charAt(0).toUpperCase()}</div>
                        <div class="insta-content">
                            <span class="insta-title">${request.user.username}</span>
                            <span class="insta-meta">Requested to follow ${new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="connection-actions">
                            <button class="btn-small btn-success accept-request-btn" data-connection-id="${request.id}">Accept</button>
                            <button class="btn-small btn-danger reject-request-btn" data-connection-id="${request.id}">Reject</button>
                        </div>
                    </li>
                `).join('');
            }
            
            if (content === '') {
                pendingContainer.innerHTML = '<p class="no-connections">No pending requests.</p>';
            } else {
                pendingContainer.innerHTML = content;
            }
        }
    }

    // UI: Switch connection tabs
    switchConnectionsTab(tabName) {
        // Hide all connection content
        document.querySelectorAll('.connections-content').forEach(content => {
            content.style.display = 'none';
        });

        // Show selected content
        const selectedContent = document.getElementById(`${tabName}-content`);
        if (selectedContent) {
            selectedContent.style.display = 'block';
        }

        // Update tab buttons
        document.querySelectorAll('.connections-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    // UI: Show discover users modal
    showDiscoverUsersModal() {
        const modal = this.createDiscoverUsersModal();
        document.body.appendChild(modal);
    }

    createDiscoverUsersModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay discover-modal';
        
        const availableUsers = Array.from(this.users.values())
            .filter(user => user.id !== this.currentUserId)
            .map(user => {
                const isConnected = this.isConnected(user.id);
                const connectionStatus = this.getConnectionStatus(user.id);
                
                let actionButton = '';
                if (!isConnected) {
                    actionButton = `<button class="btn-primary follow-user-btn" data-user-id="${user.id}">Follow</button>`;
                } else if (connectionStatus === 'pending') {
                    actionButton = `<button class="btn-secondary" disabled>Pending</button>`;
                } else if (connectionStatus === 'accepted') {
                    actionButton = `<button class="btn-danger unfollow-user-btn" data-user-id="${user.id}">Unfollow</button>`;
                } else if (connectionStatus === 'blocked') {
                    actionButton = `<button class="btn-secondary" disabled>Blocked</button>`;
                }

                return `
                    <div class="user-discover-item">
                        <div class="user-info">
                            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                            <div class="user-details">
                                <div class="user-name">${user.username}</div>
                                <div class="user-email">${user.email}</div>
                                <div class="user-bio">${user.bio || 'No bio available'}</div>
                            </div>
                        </div>
                        <div class="user-actions">
                            ${actionButton}
                        </div>
                    </div>
                `;
            }).join('');

        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Discover Users</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="discover-users-list">
                    ${availableUsers || '<p class="no-users">No users to discover.</p>'}
                </div>
            </div>
        `;
        return modal;
    }

    refreshDiscoverModal() {
        const existingModal = document.querySelector('.discover-modal');
        if (existingModal) {
            existingModal.remove();
            this.showDiscoverUsersModal();
        }
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    // Sample data
    loadSampleData() {
        // Load sample users
        this.users.set(1, { id: 1, username: 'GamerTag123', email: 'gamer@example.com', bio: 'Current logged in user' });
        this.users.set(2, { id: 2, username: 'ProGamer', email: 'pro@example.com', bio: 'Professional esports player' });
        this.users.set(3, { id: 3, username: 'StreamerQueen', email: 'streamer@example.com', bio: 'Twitch streamer and content creator' });
        this.users.set(4, { id: 4, username: 'TechNinja', email: 'tech@example.com', bio: 'Tech enthusiast and developer' });
        this.users.set(5, { id: 5, username: 'StrategyMaster', email: 'strategy@example.com', bio: 'Strategy game expert' });
        this.users.set(6, { id: 6, username: 'CasualGamer', email: 'casual@example.com', bio: 'Weekend warrior gamer' });
        this.users.set(7, { id: 7, username: 'RocketAce', email: 'rocket@example.com', bio: 'Rocket League champion' });
        this.users.set(8, { id: 8, username: 'ApexHunter', email: 'apex@example.com', bio: 'Battle royale specialist' });
        this.users.set(9, { id: 9, username: 'ValorantSniper', email: 'valorant@example.com', bio: 'Tactical FPS master' });
        this.users.set(10, { id: 10, username: 'MinecraftBuilder', email: 'minecraft@example.com', bio: 'Creative sandbox enthusiast' });
        this.users.set(11, { id: 11, username: 'FightingLegend', email: 'fighting@example.com', bio: 'Fighting game tournament winner' });

        // Load sample connections
        this.connections.set(1, [
            {
                id: 'conn1',
                follower_id: 1,
                following_id: 2,
                connection_type: 'accepted',
                created_at: '2025-07-10T10:00:00Z'
            }
        ]);

        this.connections.set(3, [
            {
                id: 'conn2',
                follower_id: 3,
                following_id: 1,
                connection_type: 'accepted',
                created_at: '2025-07-09T16:20:00Z'
            }
        ]);

        this.connections.set(4, [
            {
                id: 'conn3',
                follower_id: 4,
                following_id: 1,
                connection_type: 'pending',
                created_at: '2025-07-12T08:15:00Z'
            }
        ]);

        this.connections.set(5, [
            {
                id: 'conn9',
                follower_id: 5,
                following_id: 1,
                connection_type: 'pending',
                created_at: '2025-07-12T14:30:00Z'
            }
        ]);

        this.connections.set(6, [
            {
                id: 'conn10',
                follower_id: 6,
                following_id: 1,
                connection_type: 'pending',
                created_at: '2025-07-12T10:45:00Z'
            }
        ]);

        this.connections.set(7, [
            {
                id: 'conn4',
                follower_id: 7,
                following_id: 1,
                connection_type: 'accepted',
                created_at: '2025-07-08T14:30:00Z'
            }
        ]);

        this.connections.set(8, [
            {
                id: 'conn5',
                follower_id: 8,
                following_id: 1,
                connection_type: 'accepted',
                created_at: '2025-07-07T11:45:00Z'
            }
        ]);

        this.connections.set(9, [
            {
                id: 'conn6',
                follower_id: 9,
                following_id: 1,
                connection_type: 'accepted',
                created_at: '2025-07-06T19:20:00Z'
            }
        ]);

        this.connections.set(10, [
            {
                id: 'conn7',
                follower_id: 10,
                following_id: 1,
                connection_type: 'accepted',
                created_at: '2025-07-05T13:10:00Z'
            }
        ]);

        this.connections.set(11, [
            {
                id: 'conn8',
                follower_id: 11,
                following_id: 1,
                connection_type: 'accepted',
                created_at: '2025-07-04T16:55:00Z'
            }
        ]);
    }
}

// Match Results CRUD System
class MatchResultsCRUD {
    constructor() {
        this.matchResults = new Map(); // Store match results by tournament ID
        this.currentTournamentId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // View Match Results button
            if (e.target.classList.contains('view-match-results-btn')) {
                e.preventDefault();
                const tournamentId = e.target.dataset.tournamentId;
                this.showMatchResultsModal(tournamentId);
            }

            // Report new match result
            if (e.target.classList.contains('report-match-btn')) {
                e.preventDefault();
                this.showReportMatchModal();
            }

            // Edit match result
            if (e.target.classList.contains('edit-match-btn')) {
                const matchId = e.target.dataset.matchId;
                this.editMatchResult(matchId);
            }

            // Delete match result
            if (e.target.classList.contains('delete-match-btn')) {
                const matchId = e.target.dataset.matchId;
                this.deleteMatchResult(matchId);
            }

            // Close modal
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'report-match-form') {
                e.preventDefault();
                this.handleReportMatch(e.target);
            }

            if (e.target.id === 'edit-match-form') {
                e.preventDefault();
                this.handleEditMatch(e.target);
            }
        });
    }

    // CREATE: Report new match result
    reportMatchResult(tournamentId, matchData) {
        if (!this.matchResults.has(tournamentId)) {
            this.matchResults.set(tournamentId, []);
        }

        const matches = this.matchResults.get(tournamentId);
        
        const newMatch = {
            id: Date.now().toString(),
            tournamentId: tournamentId,
            player1: matchData.player1,
            player2: matchData.player2,
            score1: parseInt(matchData.score1),
            score2: parseInt(matchData.score2),
            winner: this.determineWinner(matchData.score1, matchData.score2, matchData.player1, matchData.player2),
            matchDate: matchData.date || new Date().toISOString().split('T')[0],
            reportedBy: matchData.reportedBy || 'Admin',
            reportedAt: new Date().toISOString(),
            status: 'confirmed'
        };

        matches.push(newMatch);
        this.matchResults.set(tournamentId, matches);
        
        console.log('Match result reported:', newMatch);
        return newMatch;
    }

    // READ: Get match results for a tournament
    getMatchResults(tournamentId) {
        return this.matchResults.get(tournamentId) || [];
    }

    // READ: Get specific match result
    getMatchResult(matchId) {
        for (let [tournamentId, matches] of this.matchResults) {
            const match = matches.find(m => m.id === matchId);
            if (match) return match;
        }
        return null;
    }

    // UPDATE: Edit match result
    updateMatchResult(matchId, updateData) {
        for (let [tournamentId, matches] of this.matchResults) {
            const matchIndex = matches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                const updatedMatch = {
                    ...matches[matchIndex],
                    ...updateData,
                    winner: this.determineWinner(updateData.score1, updateData.score2, updateData.player1, updateData.player2),
                    updatedAt: new Date().toISOString()
                };
                matches[matchIndex] = updatedMatch;
                this.matchResults.set(tournamentId, matches);
                return updatedMatch;
            }
        }
        return null;
    }

    // DELETE: Remove match result
    removeMatchResult(matchId) {
        for (let [tournamentId, matches] of this.matchResults) {
            const matchIndex = matches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                const removedMatch = matches[matchIndex];
                matches.splice(matchIndex, 1);
                this.matchResults.set(tournamentId, matches);
                return removedMatch;
            }
        }
        return null;
    }

    // Helper: Determine winner based on scores
    determineWinner(score1, score2, player1, player2) {
        const s1 = parseInt(score1);
        const s2 = parseInt(score2);
        
        if (s1 > s2) return player1;
        if (s2 > s1) return player2;
        return 'Draw';
    }

    // UI: Show match results modal
    showMatchResultsModal(tournamentId) {
        this.currentTournamentId = tournamentId;
        const matches = this.getMatchResults(tournamentId);
        const modal = this.createMatchResultsModal(matches, tournamentId);
        document.body.appendChild(modal);
    }

    // UI: Show report match modal
    showReportMatchModal() {
        const modal = this.createReportMatchModal();
        document.body.appendChild(modal);
    }

    createMatchResultsModal(matches, tournamentId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay match-results-modal';
        
        const matchesList = matches.map(match => `
            <div class="match-item">
                <div class="match-info">
                    <div class="match-players">
                        <span class="player ${match.winner === match.player1 ? 'winner' : ''}">${match.player1}</span>
                        <span class="vs">vs</span>
                        <span class="player ${match.winner === match.player2 ? 'winner' : ''}">${match.player2}</span>
                    </div>
                    <div class="match-score">
                        <span class="score">${match.score1} - ${match.score2}</span>
                        ${match.winner !== 'Draw' ? `<span class="winner-badge">Winner: ${match.winner}</span>` : '<span class="draw-badge">Draw</span>'}
                    </div>
                    <div class="match-meta">
                        <span class="match-date">Date: ${new Date(match.matchDate).toLocaleDateString()}</span>
                        <span class="reported-by">Reported by: ${match.reportedBy}</span>
                        <span class="status">Status: ${match.status}</span>
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn-edit edit-match-btn" data-match-id="${match.id}">Edit</button>
                    <button class="btn-delete delete-match-btn" data-match-id="${match.id}">Delete</button>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Match Results - Tournament ${tournamentId}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary report-match-btn">Report New Match</button>
                </div>
                <div class="matches-list">
                    ${matches.length > 0 ? matchesList : '<p class="no-matches">No match results reported yet.</p>'}
                </div>
            </div>
        `;
        return modal;
    }

    createReportMatchModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Report Match Result</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="report-match-form" class="match-form">
                    <div class="form-group">
                        <label for="player1">Player 1:</label>
                        <input type="text" id="player1" name="player1" required placeholder="Enter player 1 name">
                    </div>
                    <div class="form-group">
                        <label for="score1">Player 1 Score:</label>
                        <input type="number" id="score1" name="score1" required min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label for="player2">Player 2:</label>
                        <input type="text" id="player2" name="player2" required placeholder="Enter player 2 name">
                    </div>
                    <div class="form-group">
                        <label for="score2">Player 2 Score:</label>
                        <input type="number" id="score2" name="score2" required min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label for="match-date">Match Date:</label>
                        <input type="date" id="match-date" name="date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="reported-by">Reported By:</label>
                        <input type="text" id="reported-by" name="reportedBy" value="Admin" placeholder="Admin/Referee">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                        <button type="submit" class="btn-primary">Report Match</button>
                    </div>
                </form>
            </div>
        `;
        return modal;
    }

    createEditMatchModal(match) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Match Result</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="edit-match-form" class="match-form">
                    <input type="hidden" name="matchId" value="${match.id}">
                    <div class="form-group">
                        <label for="edit-player1">Player 1:</label>
                        <input type="text" id="edit-player1" name="player1" required value="${match.player1}">
                    </div>
                    <div class="form-group">
                        <label for="edit-score1">Player 1 Score:</label>
                        <input type="number" id="edit-score1" name="score1" required min="0" value="${match.score1}">
                    </div>
                    <div class="form-group">
                        <label for="edit-player2">Player 2:</label>
                        <input type="text" id="edit-player2" name="player2" required value="${match.player2}">
                    </div>
                    <div class="form-group">
                        <label for="edit-score2">Player 2 Score:</label>
                        <input type="number" id="edit-score2" name="score2" required min="0" value="${match.score2}">
                    </div>
                    <div class="form-group">
                        <label for="edit-match-date">Match Date:</label>
                        <input type="date" id="edit-match-date" name="date" required value="${match.matchDate}">
                    </div>
                    <div class="form-group">
                        <label for="edit-reported-by">Reported By:</label>
                        <input type="text" id="edit-reported-by" name="reportedBy" value="${match.reportedBy}">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                        <button type="submit" class="btn-primary">Update Match</button>
                    </div>
                </form>
            </div>
        `;
        return modal;
    }

    handleReportMatch(form) {
        const formData = new FormData(form);
        const matchData = {
            player1: formData.get('player1'),
            player2: formData.get('player2'),
            score1: formData.get('score1'),
            score2: formData.get('score2'),
            date: formData.get('date'),
            reportedBy: formData.get('reportedBy')
        };

        const newMatch = this.reportMatchResult(this.currentTournamentId, matchData);
        if (newMatch) {
            alert('Match result reported successfully!');
            this.closeModal();
            // Refresh the match results modal
            this.showMatchResultsModal(this.currentTournamentId);
        }
    }

    handleEditMatch(form) {
        const formData = new FormData(form);
        const matchId = formData.get('matchId');
        const updateData = {
            player1: formData.get('player1'),
            player2: formData.get('player2'),
            score1: parseInt(formData.get('score1')),
            score2: parseInt(formData.get('score2')),
            matchDate: formData.get('date'),
            reportedBy: formData.get('reportedBy')
        };

        const updatedMatch = this.updateMatchResult(matchId, updateData);
        if (updatedMatch) {
            alert('Match result updated successfully!');
            this.closeModal();
            // Refresh the match results modal
            this.showMatchResultsModal(this.currentTournamentId);
        }
    }

    editMatchResult(matchId) {
        const match = this.getMatchResult(matchId);
        if (match) {
            this.closeModal();
            const editModal = this.createEditMatchModal(match);
            document.body.appendChild(editModal);
        }
    }

    deleteMatchResult(matchId) {
        if (confirm('Are you sure you want to delete this match result? This action cannot be undone.')) {
            const removedMatch = this.removeMatchResult(matchId);
            if (removedMatch) {
                alert('Match result deleted successfully!');
                // Refresh the match results modal
                this.showMatchResultsModal(this.currentTournamentId);
            }
        }
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    loadSampleData() {
        // Load sample match results for demonstration
        this.reportMatchResult('valorant-masters', {
            player1: 'ProGamer123',
            player2: 'SniperKing',
            score1: 16,
            score2: 12,
            date: '2025-07-10',
            reportedBy: 'Tournament Admin'
        });

        this.reportMatchResult('valorant-masters', {
            player1: 'ShadowNinja',
            player2: 'FireStorm',
            score1: 14,
            score2: 16,
            date: '2025-07-09',
            reportedBy: 'Referee Bot'
        });

        this.reportMatchResult('rocket-league-cup', {
            player1: 'RocketMan',
            player2: 'SkyDriver',
            score1: 3,
            score2: 1,
            date: '2025-07-08',
            reportedBy: 'Admin'
        });
    }
}

// Tournament Discussions CRUD System
class TournamentDiscussionsCRUD {
    constructor() {
        this.discussions = new Map(); // Store discussions by tournament ID
        this.currentTournamentId = null;
        this.currentUserId = 1; // Mock current user ID
        this.currentUserRole = 'user'; // 'user', 'mod', 'admin'
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // View Discussions button
            if (e.target.classList.contains('view-discussions-btn')) {
                e.preventDefault();
                const tournamentId = e.target.dataset.tournamentId;
                this.showDiscussionsModal(tournamentId);
            }

            // Create new discussion
            if (e.target.classList.contains('create-discussion-btn')) {
                e.preventDefault();
                this.showCreateDiscussionModal();
            }

            // Edit discussion
            if (e.target.classList.contains('edit-discussion-btn')) {
                const discussionId = e.target.dataset.discussionId;
                this.editDiscussion(discussionId);
            }

            // Delete discussion
            if (e.target.classList.contains('delete-discussion-btn')) {
                const discussionId = e.target.dataset.discussionId;
                this.deleteDiscussion(discussionId);
            }

            // View discussion details
            if (e.target.classList.contains('view-discussion-btn')) {
                const discussionId = e.target.dataset.discussionId;
                this.viewDiscussionDetails(discussionId);
            }

            // Reply to discussion
            if (e.target.classList.contains('reply-discussion-btn')) {
                const discussionId = e.target.dataset.discussionId;
                this.showReplyModal(discussionId);
            }

            // Close modal
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'create-discussion-form') {
                e.preventDefault();
                this.handleCreateDiscussion(e.target);
            }

            if (e.target.id === 'edit-discussion-form') {
                e.preventDefault();
                this.handleEditDiscussion(e.target);
            }

            if (e.target.id === 'reply-discussion-form') {
                e.preventDefault();
                this.handleReplyToDiscussion(e.target);
            }
        });
    }

    // CREATE: Start new discussion thread
    createDiscussion(tournamentId, discussionData) {
        if (!this.discussions.has(tournamentId)) {
            this.discussions.set(tournamentId, []);
        }

        const discussions = this.discussions.get(tournamentId);
        
        const newDiscussion = {
            id: Date.now().toString(),
            tournamentId: tournamentId,
            title: discussionData.title,
            content: discussionData.content,
            authorId: discussionData.authorId || this.currentUserId,
            authorName: discussionData.authorName || 'Current User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replies: [],
            isSticky: false,
            isLocked: false,
            views: 0
        };

        discussions.unshift(newDiscussion); // Add to beginning for newest first
        this.discussions.set(tournamentId, discussions);
        
        console.log('Discussion created:', newDiscussion);
        return newDiscussion;
    }

    // READ: Get discussions for a tournament
    getDiscussions(tournamentId) {
        return this.discussions.get(tournamentId) || [];
    }

    // READ: Get specific discussion
    getDiscussion(discussionId) {
        for (let [tournamentId, discussions] of this.discussions) {
            const discussion = discussions.find(d => d.id === discussionId);
            if (discussion) return discussion;
        }
        return null;
    }

    // UPDATE: Edit discussion (author or mod only)
    updateDiscussion(discussionId, updateData) {
        const discussion = this.getDiscussion(discussionId);
        if (!discussion) return null;

        // Check permissions
        if (!this.canEditDiscussion(discussion)) {
            alert('You do not have permission to edit this discussion.');
            return null;
        }

        for (let [tournamentId, discussions] of this.discussions) {
            const discussionIndex = discussions.findIndex(d => d.id === discussionId);
            if (discussionIndex !== -1) {
                const updatedDiscussion = {
                    ...discussions[discussionIndex],
                    ...updateData,
                    updatedAt: new Date().toISOString()
                };
                discussions[discussionIndex] = updatedDiscussion;
                this.discussions.set(tournamentId, discussions);
                return updatedDiscussion;
            }
        }
        return null;
    }

    // DELETE: Remove discussion thread (author or mod only)
    removeDiscussion(discussionId) {
        const discussion = this.getDiscussion(discussionId);
        if (!discussion) return null;

        // Check permissions
        if (!this.canDeleteDiscussion(discussion)) {
            alert('You do not have permission to delete this discussion.');
            return null;
        }

        for (let [tournamentId, discussions] of this.discussions) {
            const discussionIndex = discussions.findIndex(d => d.id === discussionId);
            if (discussionIndex !== -1) {
                const removedDiscussion = discussions[discussionIndex];
                discussions.splice(discussionIndex, 1);
                this.discussions.set(tournamentId, discussions);
                return removedDiscussion;
            }
        }
        return null;
    }

    // Helper: Check if user can edit discussion
    canEditDiscussion(discussion) {
        return discussion.authorId === this.currentUserId || 
               this.currentUserRole === 'mod' || 
               this.currentUserRole === 'admin';
    }

    // Helper: Check if user can delete discussion
    canDeleteDiscussion(discussion) {
        return discussion.authorId === this.currentUserId || 
               this.currentUserRole === 'mod' || 
               this.currentUserRole === 'admin';
    }

    // UI: Show discussions modal
    showDiscussionsModal(tournamentId) {
        this.currentTournamentId = tournamentId;
        const discussions = this.getDiscussions(tournamentId);
        const modal = this.createDiscussionsModal(discussions, tournamentId);
        document.body.appendChild(modal);
    }

    // UI: Show create discussion modal
    showCreateDiscussionModal() {
        const modal = this.createDiscussionFormModal();
        document.body.appendChild(modal);
    }

    createDiscussionsModal(discussions, tournamentId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay discussions-modal';
        
        const discussionsList = discussions.map(discussion => {
            const canEdit = this.canEditDiscussion(discussion);
            const canDelete = this.canDeleteDiscussion(discussion);
            
            return `
                <div class="discussion-item">
                    <div class="discussion-info">
                        <div class="discussion-header">
                            <h4 class="discussion-title">${discussion.title}</h4>
                            ${discussion.isSticky ? '<span class="sticky-badge">📌 Sticky</span>' : ''}
                            ${discussion.isLocked ? '<span class="locked-badge">🔒 Locked</span>' : ''}
                        </div>
                        <div class="discussion-content">${discussion.content.substring(0, 150)}${discussion.content.length > 150 ? '...' : ''}</div>
                        <div class="discussion-meta">
                            <span class="author">By: ${discussion.authorName}</span>
                            <span class="created-date">Created: ${new Date(discussion.createdAt).toLocaleDateString()}</span>
                            <span class="replies-count">Replies: ${discussion.replies.length}</span>
                            <span class="views-count">Views: ${discussion.views}</span>
                        </div>
                    </div>
                    <div class="discussion-actions">
                        <button class="btn-primary view-discussion-btn" data-discussion-id="${discussion.id}">View</button>
                        ${canEdit ? `<button class="btn-edit edit-discussion-btn" data-discussion-id="${discussion.id}">Edit</button>` : ''}
                        ${canDelete ? `<button class="btn-delete delete-discussion-btn" data-discussion-id="${discussion.id}">Delete</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Tournament Discussions - ${tournamentId}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary create-discussion-btn">Start New Discussion</button>
                </div>
                <div class="discussions-list">
                    ${discussions.length > 0 ? discussionsList : '<p class="no-discussions">No discussions yet. Start the conversation!</p>'}
                </div>
            </div>
        `;
        return modal;
    }

    createDiscussionFormModal(discussion = null) {
        const isEdit = discussion !== null;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit Discussion' : 'Start New Discussion'}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="${isEdit ? 'edit-discussion-form' : 'create-discussion-form'}" class="discussion-form">
                    ${isEdit ? `<input type="hidden" name="discussionId" value="${discussion.id}">` : ''}
                    <div class="form-group">
                        <label for="discussion-title">Discussion Title:</label>
                        <input type="text" id="discussion-title" name="title" required 
                               placeholder="Enter discussion title..." 
                               value="${isEdit ? discussion.title : ''}" maxlength="100">
                    </div>
                    <div class="form-group">
                        <label for="discussion-content">Content:</label>
                        <textarea id="discussion-content" name="content" required 
                                  placeholder="Share your thoughts, questions, or start a conversation..." 
                                  rows="6">${isEdit ? discussion.content : ''}</textarea>
                    </div>
                    ${this.currentUserRole === 'mod' || this.currentUserRole === 'admin' ? `
                        <div class="form-group">
                            <label>
                                <input type="checkbox" name="isSticky" ${isEdit && discussion.isSticky ? 'checked' : ''}>
                                Pin this discussion (Sticky)
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" name="isLocked" ${isEdit && discussion.isLocked ? 'checked' : ''}>
                                Lock discussion (No new replies)
                            </label>
                        </div>
                    ` : ''}
                    <div class="form-actions">
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                        <button type="submit" class="btn-primary">${isEdit ? 'Update Discussion' : 'Start Discussion'}</button>
                    </div>
                </form>
            </div>
        `;
        return modal;
    }

    createDiscussionDetailsModal(discussion) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay discussion-details-modal';
        
        const canEdit = this.canEditDiscussion(discussion);
        const canDelete = this.canDeleteDiscussion(discussion);
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>${discussion.title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="discussion-full-content">
                    <div class="discussion-header-full">
                        ${discussion.isSticky ? '<span class="sticky-badge">📌 Sticky</span>' : ''}
                        ${discussion.isLocked ? '<span class="locked-badge">🔒 Locked</span>' : ''}
                    </div>
                    <div class="discussion-content-full">${discussion.content}</div>
                    <div class="discussion-meta-full">
                        <span class="author">Started by: <strong>${discussion.authorName}</strong></span>
                        <span class="created-date">Created: ${new Date(discussion.createdAt).toLocaleString()}</span>
                        ${discussion.updatedAt !== discussion.createdAt ? `<span class="updated-date">Last updated: ${new Date(discussion.updatedAt).toLocaleString()}</span>` : ''}
                        <span class="views-count">Views: ${discussion.views + 1}</span>
                    </div>
                    <div class="discussion-actions-full">
                        ${canEdit ? `<button class="btn-edit edit-discussion-btn" data-discussion-id="${discussion.id}">Edit</button>` : ''}
                        ${canDelete ? `<button class="btn-delete delete-discussion-btn" data-discussion-id="${discussion.id}">Delete</button>` : ''}
                        ${discussion.authorId !== this.currentUserId ? `<button class="btn-primary reply-discussion-btn" data-discussion-id="${discussion.id}">Reply</button>` : ''}
                    </div>
                    <div class="replies-section">
                        <h3>Replies (${discussion.replies.length})</h3>
                        <div class="replies-list">
                            ${discussion.replies.length > 0 ? 
                                discussion.replies.map(reply => `
                                    <div class="reply-item">
                                        <div class="reply-content">${reply.content}</div>
                                        <div class="reply-meta">
                                            <span>By: ${reply.authorName}</span>
                                            <span>${new Date(reply.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                `).join('') : 
                                '<p class="no-replies">No replies yet. Be the first to reply!</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Increment views
        discussion.views++;
        
        return modal;
    }

    handleCreateDiscussion(form) {
        const formData = new FormData(form);
        const discussionData = {
            title: formData.get('title'),
            content: formData.get('content'),
            isSticky: formData.get('isSticky') === 'on',
            isLocked: formData.get('isLocked') === 'on'
        };

        const newDiscussion = this.createDiscussion(this.currentTournamentId, discussionData);
        if (newDiscussion) {
            alert('Discussion started successfully!');
            this.closeModal();
            // Refresh the discussions modal
            this.showDiscussionsModal(this.currentTournamentId);
        }
    }

    handleEditDiscussion(form) {
        const formData = new FormData(form);
        const discussionId = formData.get('discussionId');
        const updateData = {
            title: formData.get('title'),
            content: formData.get('content'),
            isSticky: formData.get('isSticky') === 'on',
            isLocked: formData.get('isLocked') === 'on'
        };

        const updatedDiscussion = this.updateDiscussion(discussionId, updateData);
        if (updatedDiscussion) {
            alert('Discussion updated successfully!');
            this.closeModal();
            // Refresh the discussions modal
            this.showDiscussionsModal(this.currentTournamentId);
        }
    }

    editDiscussion(discussionId) {
        const discussion = this.getDiscussion(discussionId);
        if (discussion) {
            this.closeModal();
            const editModal = this.createDiscussionFormModal(discussion);
            document.body.appendChild(editModal);
        }
    }

    deleteDiscussion(discussionId) {
        if (confirm('Are you sure you want to delete this discussion? This action cannot be undone and will remove all replies.')) {
            const removedDiscussion = this.removeDiscussion(discussionId);
            if (removedDiscussion) {
                alert('Discussion deleted successfully!');
                // Refresh the discussions modal
                this.showDiscussionsModal(this.currentTournamentId);
            }
        }
    }

    viewDiscussionDetails(discussionId) {
        const discussion = this.getDiscussion(discussionId);
        if (discussion) {
            this.closeModal();
            const detailsModal = this.createDiscussionDetailsModal(discussion);
            document.body.appendChild(detailsModal);
        }
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    loadSampleData() {
        // Load sample discussions for demonstration
        this.createDiscussion('valorant-masters', {
            title: 'Team Strategy Discussion',
            content: 'What are the best strategies for the upcoming Valorant Masters tournament? Share your insights and team compositions here!',
            authorName: 'TacticsPro',
            authorId: 2
        });

        this.createDiscussion('valorant-masters', {
            title: 'Looking for Team Members',
            content: 'Hi everyone! I\'m looking for skilled players to form a team for this tournament. Must have good communication and be available for practice sessions.',
            authorName: 'TeamCaptain',
            authorId: 3
        });

        this.createDiscussion('rocket-league-cup', {
            title: 'Car Builds and Customization',
            content: 'Let\'s discuss the best car setups for competitive play. What\'s your favorite car and boost combination?',
            authorName: 'RocketExpert',
            authorId: 4
        });

        // Add some sample replies
        const discussions = this.getDiscussions('valorant-masters');
        if (discussions.length > 0) {
            discussions[0].replies.push({
                id: 'reply1',
                content: 'Great topic! I think Sage and Sova are essential for any competitive team.',
                authorName: 'EliteTactician',
                authorId: 5,
                createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
            });
        }
    }

    // UI: Show reply modal
    showReplyModal(discussionId) {
        const modal = this.createReplyFormModal(discussionId);
        document.body.appendChild(modal);
    }

    // UI: Create reply form modal
    createReplyFormModal(discussionId) {
        const discussion = this.getDiscussion(discussionId);
        if (!discussion) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Reply to: ${discussion.title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="reply-discussion-form" class="discussion-form">
                    <input type="hidden" name="discussionId" value="${discussionId}">
                    <div class="form-group">
                        <label for="reply-content">Your Reply:</label>
                        <textarea id="reply-content" name="content" rows="5" placeholder="Write your reply here..." required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Post Reply</button>
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        return modal;
    }

    // Handle reply form submission
    handleReplyToDiscussion(form) {
        const formData = new FormData(form);
        const discussionId = formData.get('discussionId');
        const content = formData.get('content');

        if (!discussionId || !content.trim()) {
            alert('Please provide a reply content.');
            return;
        }

        const replyData = {
            content: content.trim(),
            authorId: this.currentUserId,
            authorName: 'Current User'
        };

        if (this.addReplyToDiscussion(discussionId, replyData)) {
            this.closeModal();
            // Refresh the discussion details modal to show the new reply
            this.viewDiscussionDetails(discussionId);
        }
    }

    // Add reply to discussion
    addReplyToDiscussion(discussionId, replyData) {
        const discussion = this.getDiscussion(discussionId);
        if (!discussion) {
            alert('Discussion not found.');
            return false;
        }

        if (discussion.isLocked && this.currentUserRole !== 'mod' && this.currentUserRole !== 'admin') {
            alert('This discussion is locked. Only moderators can reply.');
            return false;
        }

        const newReply = {
            id: Date.now().toString(),
            content: replyData.content,
            authorId: replyData.authorId,
            authorName: replyData.authorName,
            createdAt: new Date().toISOString()
        };

        discussion.replies.push(newReply);
        
        console.log('Reply added:', newReply);
        return true;
    }
}

// Initialize all CRUD systems when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tournamentCRUD = new TournamentParticipantsCRUD();
    window.userConnectionsCRUD = new UserConnectionsCRUD();
    window.matchResultsCRUD = new MatchResultsCRUD();
    window.tournamentDiscussionsCRUD = new TournamentDiscussionsCRUD();
});
