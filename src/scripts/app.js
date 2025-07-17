// Main JS for GameVibe Arena - Database Connected Version
console.log('GameVibe Arena loaded with Database Connection');

// API Configuration
const API_BASE = 'http://localhost:5000/api';

// Utility function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        console.log('🌐 API Call:', `${API_BASE}${endpoint}`, options);
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        console.log('📡 API Response status:', response.status);
        
        const data = await response.json();
        console.log('📄 API Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || `API call failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('❌ API Error details:', {
            endpoint: `${API_BASE}${endpoint}`,
            error: error.message,
            stack: error.stack
        });
        
        // Provide more specific error messages
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
        } else if (error.message.includes('CORS')) {
            throw new Error('Cross-origin request blocked. Please check server CORS settings.');
        } else {
            throw error;
        }
    }
}

// Tournament Participants CRUD System - Database Connected
class TournamentParticipantsCRUD {
    constructor() {
        this.currentTournamentId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn') || 
                (e.target.closest('.tournament-btn') && e.target.textContent === 'View Details')) {
                e.preventDefault();
                const tournamentCard = e.target.closest('.tournament-card');
                const tournamentId = this.getTournamentId(tournamentCard);
                console.log('🔍 DEBUG: View Details clicked for tournament ID:', tournamentId);
                this.showParticipantsModal(tournamentId);
            }

            if (e.target.classList.contains('join-btn') || 
                (e.target.textContent === 'Join' && e.target.classList.contains('tournament-btn'))) {
                e.preventDefault();
                const tournamentCard = e.target.closest('.tournament-card');
                const tournamentId = this.getTournamentId(tournamentCard);
                console.log('🔍 DEBUG: Join clicked for tournament ID:', tournamentId);
                this.showJoinModal(tournamentId);
            }

            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }

            if (e.target.classList.contains('edit-participant-btn')) {
                const participantId = e.target.dataset.participantId;
                this.editParticipant(participantId);
            }

            if (e.target.classList.contains('delete-participant-btn')) {
                const participantId = e.target.dataset.participantId;
                this.deleteParticipant(participantId);
            }
        });

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

    getTournamentId(card) {
        // Always prioritize the data attribute from HTML
        const dataId = card.dataset.tournamentId;
        if (dataId) {
            console.log('✅ DEBUG: Using tournament ID from data attribute:', dataId);
            console.log('🔍 DEBUG: Data attribute type:', typeof dataId);
            return dataId;
        }
        
        // Fallback (this should never happen with your HTML structure)
        const title = card.querySelector('.tournament-title');
        if (title) {
            const titleText = title.textContent.trim();
            console.error('⚠️ WARNING: No data-tournament-id found! Using title fallback.');
            console.error('⚠️ This might cause errors. Please check your HTML.');
            console.log('🔍 Card HTML:', card.outerHTML);
            
            // For emergency fallback, let's use title to ID mapping
            const titleToId = {
                'Valorant Masters': '1',
                'Rocket League Cup': '2', 
                'Apex Legends Showdown': '3'
            };
            
            const mappedId = titleToId[titleText];
            if (mappedId) {
                console.log('🔍 DEBUG: Mapped title to ID:', titleText, '->', mappedId);
                return mappedId;
            }
            
            // Last resort: generate slug
            const generatedId = titleText.toLowerCase().replace(/\s+/g, '-');
            console.error('❌ WARNING: Using generated slug (this will likely fail):', generatedId);
            return generatedId;
        }
        
        console.error('❌ Could not determine tournament ID from card:', card);
        return null;
    }

    getTournamentIdFromCard(card) {
        // Deprecated - use getTournamentId instead
        return this.getTournamentId(card);
    }

    // API: Join tournament
    async joinTournament(tournamentId, userData) {
        try {
            console.log('🎯 Joining tournament:', tournamentId, 'with data:', userData);
            console.log('🔍 Tournament ID type:', typeof tournamentId);
            console.log('🔍 Full API URL will be:', `${API_BASE}/tournaments/${tournamentId}/participants`);
            
            await apiCall(`/tournaments/${tournamentId}/participants`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            console.log('✅ Successfully joined tournament');
            return true;
        } catch (error) {
            console.error('❌ Failed to join tournament:', error);
            
            // Show detailed error message to user
            let errorMessage = `Failed to join tournament: ${error.message}`;
            
            if (error.message.includes('Cannot connect to server')) {
                errorMessage += '\n\nTo fix this:\n1. Open a terminal\n2. Run: python backend_api.py\n3. Wait for "Running on http://127.0.0.1:5000"\n4. Try joining again';
            }
            
            alert(errorMessage);
            return false;
        }
    }

    // API: Get participants
    async getParticipants(tournamentId) {
        try {
            return await apiCall(`/tournaments/${tournamentId}/participants`);
        } catch (error) {
            console.error('Failed to fetch participants:', error);
            return [];
        }
    }

    // API: Update participant
    async updateParticipant(participantId, updateData) {
        try {
            await apiCall(`/participants/${participantId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    }

    // API: Remove participant
    async removeParticipant(participantId) {
        try {
            await apiCall(`/participants/${participantId}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    }

    async showParticipantsModal(tournamentId) {
        this.currentTournamentId = tournamentId;
        const participants = await this.getParticipants(tournamentId);
        const modal = this.createParticipantsModal(participants);
        document.body.appendChild(modal);
    }

    showJoinModal(tournamentId) {
        this.currentTournamentId = tournamentId;
        const modal = this.createJoinModal();
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
                    <span class="participant-team">${participant.team_name || 'No team'}</span>
                    <span class="participant-status">${participant.status}</span>
                    <span class="participant-date">${new Date(participant.registration_date).toLocaleDateString()}</span>
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
                        <input type="text" id="edit-username" name="username" value="${participant.username || ''}" placeholder="Enter username" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-team-name">Team Name:</label>
                        <input type="text" id="edit-team-name" name="teamName" value="${participant.team_name || ''}" placeholder="Enter team name">
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

    async handleJoinTournament(form) {
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            teamName: formData.get('teamName')
        };

        const success = await this.joinTournament(this.currentTournamentId, userData);
        if (success) {
            alert('Successfully joined the tournament!');
            this.closeModal();
        }
    }

    async handleEditParticipant(form) {
        const formData = new FormData(form);
        const participantId = formData.get('participantId');
        const updateData = {
            username: formData.get('username'),
            teamName: formData.get('teamName')
        };

        const success = await this.updateParticipant(participantId, updateData);
        if (success) {
            alert('Participant updated successfully!');
            this.closeModal();
            this.showParticipantsModal(this.currentTournamentId);
        }
    }

    async editParticipant(participantId) {
        // Get all participants to find the one being edited
        const participants = await this.getParticipants(this.currentTournamentId);
        const participant = participants.find(p => p.id == participantId);

        if (participant) {
            this.closeModal();
            const editModal = this.createEditModal(participant);
            document.body.appendChild(editModal);
        }
    }

    async deleteParticipant(participantId) {
        if (confirm('Are you sure you want to remove this participant?')) {
            const success = await this.removeParticipant(participantId);
            if (success) {
                alert('Participant removed successfully!');
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
}

// User Connections CRUD System - Database Connected
class UserConnectionsCRUD {
    constructor() {
        this.currentUserId = 1; // Mock current user ID
        console.log('🚀 DEBUG: UserConnectionsCRUD initialized with current user ID:', this.currentUserId);
        this.init();
    }

    async init() {
        console.log('🔧 DEBUG: Setting up UserConnectionsCRUD...');
        const serverOnline = await this.checkServerStatus();
        this.setupEventListeners();
        
        // Only update connections UI if server is online
        if (serverOnline) {
            this.updateConnectionsUI();
        } else {
            console.log('⚠️ Server offline - skipping connections UI update');
        }
        console.log('✅ DEBUG: UserConnectionsCRUD setup complete');
    }

    async checkServerStatus() {
        console.log('🌐 DEBUG: Checking server status...');
        try {
            const response = await apiCall('/health');
            console.log('✅ DEBUG: Server is running:', response);
            return true;
        } catch (error) {
            console.log('⚠️ DEBUG: Server appears to be offline:', error);
            return false;
        }
    }

    setupEventListeners() {
        console.log('🎯 DEBUG: Setting up UserConnections event listeners...');
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('follow-user-btn')) {
                console.log('🔔 DEBUG: Follow button clicked');
                e.preventDefault();
                e.stopPropagation();
                const userId = parseInt(e.target.dataset.userId);
                this.followUser(userId);
            }

            if (e.target.classList.contains('unfollow-user-btn')) {
                console.log('🔔 DEBUG: Unfollow button clicked');
                e.preventDefault();
                e.stopPropagation();
                const userId = parseInt(e.target.dataset.userId);
                this.unfollowUser(userId);
            }

            if (e.target.classList.contains('accept-request-btn')) {
                console.log('🔔 DEBUG: Accept request button clicked');
                e.preventDefault();
                e.stopPropagation();
                const connectionId = e.target.dataset.connectionId;
                this.updateConnectionStatus(connectionId, 'accepted');
            }

            if (e.target.classList.contains('reject-request-btn')) {
                console.log('🔔 DEBUG: Reject request button clicked');
                e.preventDefault();
                e.stopPropagation();
                const connectionId = e.target.dataset.connectionId;
                this.updateConnectionStatus(connectionId, 'blocked');
            }

            if (e.target.classList.contains('remove-connection-btn')) {
                console.log('🔔 DEBUG: Remove connection button clicked');
                e.preventDefault();
                e.stopPropagation();
                const connectionId = e.target.dataset.connectionId;
                this.removeConnection(connectionId);
            }

            if (e.target.classList.contains('discover-users-btn')) {
                console.log('🔔 DEBUG: Discover users button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.showDiscoverUsersModal();
            }

            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
                console.log('🔔 DEBUG: Close modal triggered');
                this.closeModal();
            }

            if (e.target.classList.contains('connections-tab-btn')) {
                console.log('🔔 DEBUG: Connections tab button clicked:', e.target.dataset.tab);
                e.preventDefault();
                e.stopPropagation();
                this.switchConnectionsTab(e.target.dataset.tab);
            }
        });
        console.log('✅ DEBUG: UserConnections event listeners setup complete');
    }

    // API: Follow a user
    async followUser(targetUserId) {
        console.log('🚀 DEBUG: Following user', { currentUserId: this.currentUserId, targetUserId });
        try {
            const response = await apiCall('/users/follow', {
                method: 'POST',
                body: JSON.stringify({
                    follower_id: this.currentUserId,
                    following_id: targetUserId
                })
            });
            console.log('✅ DEBUG: Follow request successful', response);
            alert('Follow request sent successfully!');
            this.updateConnectionsUI();
            this.refreshDiscoverModal();
            // Stay on friends tab after following
            this.ensureFriendsTabActive();
        } catch (error) {
            console.error('❌ DEBUG: Follow request failed', error);
            alert(`Failed to send follow request: ${error.message}`);
        }
    }

    // API: Unfollow a user  
    async unfollowUser(targetUserId) {
        console.log('🚫 DEBUG: Unfollowing user', { currentUserId: this.currentUserId, targetUserId });
        try {
            const connections = await this.getUserConnections();
            const connection = connections.following.find(f => f.following_id === targetUserId);
            if (connection) {
                console.log('🔍 DEBUG: Found connection to remove:', connection);
                await this.removeConnection(connection.id);
                // Stay on friends tab after unfollowing
                this.ensureFriendsTabActive();
            } else {
                console.warn('⚠️ DEBUG: No connection found to unfollow for user ID:', targetUserId);
            }
        } catch (error) {
            console.error('❌ DEBUG: Unfollow failed:', error);
            alert(error.message);
        }
    }

    // API: Get user connections
    async getUserConnections() {
        console.log('🔍 DEBUG: Fetching user connections for user ID:', this.currentUserId);
        
        // Check if server is running first
        try {
            await fetch('http://localhost:5000/api/health');
        } catch (error) {
            console.log('⚠️ Server is offline - returning empty connections data');
            return { followers: [], following: [], incoming_pending: [], outgoing_pending: [] };
        }
        
        try {
            const connections = await apiCall(`/users/${this.currentUserId}/connections`);
            console.log('📄 DEBUG: User connections fetched successfully from database', connections);
            return connections;
        } catch (error) {
            console.error('❌ DEBUG: Failed to fetch connections from database:', error);
            console.log('⚠️ Server may be offline - returning empty connections data');
            return { followers: [], following: [], incoming_pending: [], outgoing_pending: [] };
        }
    }

    // API: Update connection status
    async updateConnectionStatus(connectionId, newStatus) {
        console.log('🔄 DEBUG: Updating connection status', { connectionId, newStatus });
        try {
            const response = await apiCall(`/connections/${connectionId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            console.log('✅ DEBUG: Connection status updated successfully', response);
            alert(`Connection ${newStatus} successfully!`);
            this.updateConnectionsUI();
            // Stay on friends tab after updating status
            this.ensureFriendsTabActive();
        } catch (error) {
            console.error('❌ DEBUG: Failed to update connection status:', error);
            alert(`Failed to ${newStatus} connection: ${error.message}`);
        }
    }

    // API: Remove connection
    async removeConnection(connectionId) {
        console.log('🗑️ DEBUG: Removing connection ID:', connectionId);
        if (confirm('Are you sure you want to remove this connection?')) {
            try {
                const response = await apiCall(`/connections/${connectionId}`, {
                    method: 'DELETE'
                });
                console.log('✅ DEBUG: Connection removed successfully', response);
                alert('Connection removed successfully!');
                this.updateConnectionsUI();
                // Stay on friends tab after removing connection
                this.ensureFriendsTabActive();
            } catch (error) {
                console.error('❌ DEBUG: Failed to remove connection:', error);
                alert(`Failed to remove connection: ${error.message}`);
            }
        } else {
            console.log('ℹ️ DEBUG: User cancelled connection removal');
        }
    }

    // API: Get all users
    async getAllUsers() {
        console.log('👥 DEBUG: Fetching all users from database...');
        
        // Check if server is running first
        try {
            await fetch('http://localhost:5000/api/health');
        } catch (error) {
            console.log('⚠️ Server is offline - returning empty users list');
            return [];
        }
        
        try {
            const users = await apiCall('/users');
            console.log('✅ DEBUG: All users fetched successfully from database, count:', users.length);
            return users;
        } catch (error) {
            console.error('❌ DEBUG: Failed to fetch users from database:', error);
            console.log('⚠️ Server may be offline - returning empty users list');
            return [];
        }
    }

    async updateConnectionsUI() {
        console.log('🔄 DEBUG: Updating connections UI...');
        
        // Remember which connections tab was active
        const activeConnectionsTab = document.querySelector('.connections-tab-btn.active');
        const activeTabName = activeConnectionsTab ? activeConnectionsTab.dataset.tab : 'followers';
        console.log('📌 DEBUG: Current active connections tab:', activeTabName);
        
        const connections = await this.getUserConnections();
        console.log('📊 DEBUG: Connections data for UI update:', connections);
        this.updateFollowersTab(connections.followers);
        this.updateFollowingTab(connections.following);
        this.updatePendingTab(connections.incoming_pending, connections.outgoing_pending);
        
        // Ensure we stay on the Friends & Followers tab after any CRUD operation
        this.ensureFriendsTabActive();
        
        // Restore the previously active connections tab
        this.switchConnectionsTab(activeTabName);
        
        console.log('✅ DEBUG: UI update complete');
    }

    ensureFriendsTabActive() {
        console.log('🎯 DEBUG: ensureFriendsTabActive called - but keeping current tab active');
        // Function disabled to keep default tournament tab active
        // Original behavior: force friends tab to be active
        // New behavior: do nothing, let user choose tabs
        console.log('✅ DEBUG: Keeping current tab state unchanged');
    }

    updateFollowersTab(followers) {
        console.log('👥 DEBUG: Updating followers tab with data:', followers);
        const followersContainer = document.getElementById('followers-list');
        
        if (followersContainer) {
            if (followers.length === 0) {
                followersContainer.innerHTML = '<p class="no-connections">No followers yet.</p>';
                console.log('ℹ️ DEBUG: No followers to display');
            } else {
                followersContainer.innerHTML = followers.map(follower => `
                    <li class="insta-card">
                        <div class="user-avatar-small">${follower.follower_username.charAt(0).toUpperCase()}</div>
                        <div class="insta-content">
                            <span class="insta-title">${follower.follower_username}</span>
                            <span class="insta-meta">Following since ${new Date(follower.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="connection-actions">
                            <button class="btn-small btn-danger remove-connection-btn" data-connection-id="${follower.id}">Remove</button>
                        </div>
                    </li>
                `).join('');
                console.log(`✅ DEBUG: Displayed ${followers.length} followers`);
            }
        } else {
            console.error('❌ DEBUG: followers-list container not found');
        }
    }

    updateFollowingTab(following) {
        console.log('👤 DEBUG: Updating following tab with data:', following);
        const followingContainer = document.getElementById('following-list');
        
        if (followingContainer) {
            if (following.length === 0) {
                followingContainer.innerHTML = '<p class="no-connections">Not following anyone yet.</p>';
                console.log('ℹ️ DEBUG: No following to display');
            } else {
                followingContainer.innerHTML = following.map(follow => `
                    <li class="insta-card">
                        <div class="user-avatar-small">${follow.following_username.charAt(0).toUpperCase()}</div>
                        <div class="insta-content">
                            <span class="insta-title">${follow.following_username}</span>
                            <span class="insta-meta">Following since ${new Date(follow.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="connection-actions">
                            <button class="btn-small btn-secondary unfollow-user-btn" data-user-id="${follow.following_id}">Unfollow</button>
                        </div>
                    </li>
                `).join('');
                console.log(`✅ DEBUG: Displayed ${following.length} following`);
            }
        } else {
            console.error('❌ DEBUG: following-list container not found');
        }
    }

    updatePendingTab(incomingPending, outgoingPending) {
        console.log('⏳ DEBUG: Updating pending tab with data:', { incomingPending, outgoingPending });
        const pendingContainer = document.getElementById('pending-list');
        
        if (pendingContainer) {
            let content = '';
            
            if (outgoingPending.length > 0) {
                content += '<h3 style="color: #6a82fb; margin: 1rem 0 0.5rem 0; font-size: 1rem;">Requests Sent</h3>';
                content += outgoingPending.map(request => `
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
                `).join('');
                console.log(`✅ DEBUG: Displayed ${outgoingPending.length} outgoing pending requests`);
            }
            
            if (incomingPending.length > 0) {
                content += '<h3 style="color: #6a82fb; margin: 1rem 0 0.5rem 0; font-size: 1rem;">Requests Received</h3>';
                content += incomingPending.map(request => `
                    <li class="insta-card">
                        <div class="user-avatar-small">${request.requester_username.charAt(0).toUpperCase()}</div>
                        <div class="insta-content">
                            <span class="insta-title">${request.requester_username}</span>
                            <span class="insta-meta">Requested to follow ${new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="connection-actions">
                            <button class="btn-small btn-success accept-request-btn" data-connection-id="${request.id}">Accept</button>
                            <button class="btn-small btn-danger reject-request-btn" data-connection-id="${request.id}">Reject</button>
                        </div>
                    </li>
                `).join('');
                console.log(`✅ DEBUG: Displayed ${incomingPending.length} incoming pending requests`);
            }
            
            if (content === '') {
                pendingContainer.innerHTML = '<p class="no-connections">No pending requests.</p>';
                console.log('ℹ️ DEBUG: No pending requests to display');
            } else {
                pendingContainer.innerHTML = content;
            }
        } else {
            console.error('❌ DEBUG: pending-list container not found');
        }
    }

    switchConnectionsTab(tabName) {
        console.log('🔄 DEBUG: Switching to connections tab:', tabName);
        
        document.querySelectorAll('.connections-content').forEach(content => {
            content.style.display = 'none';
        });

        const selectedContent = document.getElementById(`${tabName}-content`);
        if (selectedContent) {
            selectedContent.style.display = 'block';
            console.log('✅ DEBUG: Successfully showed tab content for:', tabName);
        } else {
            console.error('❌ DEBUG: Could not find tab content for:', tabName);
        }

        document.querySelectorAll('.connections-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
            console.log('✅ DEBUG: Successfully activated tab button for:', tabName);
        } else {
            console.error('❌ DEBUG: Could not find tab button for:', tabName);
        }
    }

    async showDiscoverUsersModal() {
        console.log('🌐 DEBUG: Opening discover users modal...');
        const modal = await this.createDiscoverUsersModal();
        document.body.appendChild(modal);
        console.log('✅ DEBUG: Discover users modal created and added to DOM');
    }

    async createDiscoverUsersModal() {
        console.log('🔍 DEBUG: Creating discover users modal...');
        const modal = document.createElement('div');
        modal.className = 'modal-overlay discover-modal';
        
        const users = await this.getAllUsers();
        console.log('👥 DEBUG: All users fetched:', users);
        const connections = await this.getUserConnections();
        console.log('🔗 DEBUG: Current connections for filtering:', connections);
        
        // Create a set of connected user IDs for quick lookup
        const connectedUserIds = new Set();
        connections.followers.forEach(f => connectedUserIds.add(f.follower_id));
        connections.following.forEach(f => connectedUserIds.add(f.following_id));
        connections.incoming_pending.forEach(p => connectedUserIds.add(p.follower_id));
        connections.outgoing_pending.forEach(p => connectedUserIds.add(p.following_id));
        
        console.log('🚫 DEBUG: Connected user IDs to filter out:', Array.from(connectedUserIds));
        
        const availableUsers = users
            .filter(user => user.id !== this.currentUserId)
            .map(user => {
                const isConnected = connectedUserIds.has(user.id);
                
                let actionButton = '';
                if (!isConnected) {
                    actionButton = `<button class="btn-primary follow-user-btn" data-user-id="${user.id}">Follow</button>`;
                } else {
                    actionButton = `<button class="btn-secondary" disabled>Connected</button>`;
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

        console.log('📋 DEBUG: Available users HTML generated, count:', users.filter(user => user.id !== this.currentUserId).length);

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
            console.log('🗑️ DEBUG: Modal closed');
            // Ensure we stay on friends tab after closing modal
            this.ensureFriendsTabActive();
        }
    }
}

// Match Results CRUD System - Database Connected
class MatchResultsCRUD {
    constructor() {
        this.currentTournamentId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-match-results-btn')) {
                e.preventDefault();
                const tournamentId = e.target.dataset.tournamentId;
                this.showMatchResultsModal(tournamentId);
            }

            if (e.target.classList.contains('report-match-btn')) {
                e.preventDefault();
                this.showReportMatchModal();
            }

            if (e.target.classList.contains('edit-match-btn')) {
                const matchId = e.target.dataset.matchId;
                this.editMatchResult(matchId);
            }

            if (e.target.classList.contains('delete-match-btn')) {
                const matchId = e.target.dataset.matchId;
                this.deleteMatchResult(matchId);
            }

            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

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

    // API: Report match result
    async reportMatchResult(tournamentId, matchData) {
        try {
            await apiCall(`/tournaments/${tournamentId}/matches`, {
                method: 'POST',
                body: JSON.stringify(matchData)
            });
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    }

    // API: Get match results
    async getMatchResults(tournamentId) {
        try {
            return await apiCall(`/tournaments/${tournamentId}/matches`);
        } catch (error) {
            console.error('Failed to fetch matches:', error);
            return [];
        }
    }

    // API: Update match result
    async updateMatchResult(matchId, updateData) {
        try {
            await apiCall(`/matches/${matchId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    }

    // API: Delete match result
    async removeMatchResult(matchId) {
        try {
            await apiCall(`/matches/${matchId}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    }

    async showMatchResultsModal(tournamentId) {
        this.currentTournamentId = tournamentId;
        const matches = await this.getMatchResults(tournamentId);
        const modal = this.createMatchResultsModal(matches, tournamentId);
        document.body.appendChild(modal);
    }

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
                        <span class="player ${match.winner_username === match.player1_username ? 'winner' : ''}">${match.player1_username}</span>
                        <span class="vs">vs</span>
                        <span class="player ${match.winner_username === match.player2_username ? 'winner' : ''}">${match.player2_username}</span>
                    </div>
                    <div class="match-score">
                        <span class="score">${match.score_player1} - ${match.score_player2}</span>
                        <span class="winner-badge">Winner: ${match.winner_username}</span>
                    </div>
                    <div class="match-meta">
                        <span class="match-date">Date: ${new Date(match.match_date).toLocaleDateString()}</span>
                        <span class="match-round">Round: ${match.match_round}</span>
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
                    <h2>Match Results - ${tournamentId}</h2>
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
                    <div class="form-actions">
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                        <button type="submit" class="btn-primary">Report Match</button>
                    </div>
                </form>
            </div>
        `;
        return modal;
    }

    createEditMatchModal(matchId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Match Result</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="edit-match-form" class="match-form">
                    <input type="hidden" name="matchId" value="${matchId}">
                    <div class="form-group">
                        <label for="edit-score1">Player 1 Score:</label>
                        <input type="number" id="edit-score1" name="score1" required min="0">
                    </div>
                    <div class="form-group">
                        <label for="edit-score2">Player 2 Score:</label>
                        <input type="number" id="edit-score2" name="score2" required min="0">
                    </div>
                    <div class="form-group">
                        <label for="edit-match-date">Match Date:</label>
                        <input type="date" id="edit-match-date" name="date" required>
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

    async handleReportMatch(form) {
        const formData = new FormData(form);
        const matchData = {
            player1: formData.get('player1'),
            player2: formData.get('player2'),
            score1: formData.get('score1'),
            score2: formData.get('score2'),
            date: formData.get('date')
        };

        const success = await this.reportMatchResult(this.currentTournamentId, matchData);
        if (success) {
            alert('Match result reported successfully!');
            this.closeModal();
            this.showMatchResultsModal(this.currentTournamentId);
        }
    }

    async handleEditMatch(form) {
        const formData = new FormData(form);
        const matchId = formData.get('matchId');
        const updateData = {
            score1: parseInt(formData.get('score1')),
            score2: parseInt(formData.get('score2')),
            date: formData.get('date')
        };

        const success = await this.updateMatchResult(matchId, updateData);
        if (success) {
            alert('Match result updated successfully!');
            this.closeModal();
            this.showMatchResultsModal(this.currentTournamentId);
        }
    }

    async editMatchResult(matchId) {
        // For simplicity, we'll just show a basic edit form
        // In a real app, you'd fetch the specific match data first
        const modal = this.createEditMatchModal(matchId);
        this.closeModal();
        document.body.appendChild(modal);
    }

    async deleteMatchResult(matchId) {
        if (confirm('Are you sure you want to delete this match result?')) {
            const success = await this.removeMatchResult(matchId);
            if (success) {
                alert('Match result deleted successfully!');
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
}

// Tournament Discussions CRUD System - Database Connected
class TournamentDiscussionsCRUD {
    constructor() {
        this.discussions = new Map();
        this.currentTournamentId = null;
        this.currentUserId = 1;
        this.currentUserRole = 'user';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.removeDuplicatesFromAllTournaments();
        await this.loadSampleData();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // View Discussions button
            if (e.target.classList.contains('view-discussions-btn')) {
                e.preventDefault();
                
                const tournamentId = e.target.dataset.tournamentId;
                
                if (!tournamentId) {
                    alert('Error: No tournament ID found. Please refresh the page and try again.');
                    return;
                }
                
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
                console.log('🔍 Reply button clicked!');
                const discussionId = e.target.dataset.discussionId;
                console.log('🔍 Discussion ID:', discussionId);
                this.showReplyModal(discussionId);
            }

            // Back to discussions button
            if (e.target.classList.contains('back-to-discussions-btn')) {
                e.preventDefault();
                this.closeModal();
                this.showDiscussionsModal(this.currentTournamentId);
            }

            // Handle reply form submit button clicks directly as backup
            if (e.target.type === 'submit' && e.target.closest('#reply-discussion-form')) {
                console.log('🔍 Reply submit button clicked directly!');
                e.preventDefault();
                e.stopPropagation();
                const form = e.target.closest('form');
                if (form && form.id === 'reply-discussion-form') {
                    console.log('🔍 Calling handleReplyToDiscussion from button click');
                    this.handleReplyToDiscussion(form);
                }
                return false;
            }

            // Close modal
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            console.log('🔍 Form submission detected:', e.target.id, e.target);
            console.log('🔍 Event target tagName:', e.target.tagName);
            console.log('🔍 Event target classes:', e.target.className);
            
            if (e.target.id === 'create-discussion-form') {
                console.log('🔍 Create discussion form submission detected!');
                e.preventDefault();
                this.handleCreateDiscussion(e.target);
            }

            if (e.target.id === 'edit-discussion-form') {
                console.log('🔍 Edit discussion form submission detected!');
                e.preventDefault();
                this.handleEditDiscussion(e.target);
            }

            if (e.target.id === 'reply-discussion-form') {
                console.log('🔍 Reply form submission detected!');
                console.log('🔍 Form element:', e.target);
                console.log('🔍 Form method:', e.target.method);
                console.log('🔍 Form action:', e.target.action);
                e.preventDefault();
                e.stopPropagation();
                this.handleReplyToDiscussion(e.target);
                return false;
            }
        }, true); // Use capture phase
    }

    // CREATE: Start new discussion thread
    async createDiscussion(tournamentId, discussionData) {
        try {
            console.log('🚀 Creating discussion for tournament:', tournamentId);
            console.log('🚀 Discussion data:', discussionData);
            
            // Validate inputs
            if (!tournamentId) {
                console.error('❌ Tournament ID is required');
                return null;
            }
            
            if (!discussionData.title || !discussionData.content) {
                console.error('❌ Title and content are required');
                alert('Please fill in both title and content fields');
                return null;
            }
            
            // Check for duplicates by title
            const existingDiscussions = this.getDiscussions(tournamentId);
            const isDuplicate = existingDiscussions.some(d => d.title === discussionData.title);
            if (isDuplicate) {
                console.log('⚠️ Discussion with this title already exists, skipping...');
                alert('A discussion with this title already exists for this tournament');
                return null;
            }
            
            // For now, let's use local storage to ensure it works
            console.log('🔄 Creating discussion locally...');
            
            const newDiscussion = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // More unique ID
                tournament_id: tournamentId,
                title: discussionData.title,
                description: discussionData.content,
                creator_username: discussionData.authorName || 'Current User',
                created_at: new Date().toISOString(),
                replies_count: 0,
                is_pinned: false,
                replies: [] // Add replies array for local storage
            };
            
            // Add to local discussions
            if (!this.discussions.has(tournamentId)) {
                this.discussions.set(tournamentId, []);
            }
            const discussions = this.discussions.get(tournamentId);
            discussions.unshift(newDiscussion);
            this.discussions.set(tournamentId, discussions);
            
            console.log('✅ Discussion created locally:', newDiscussion);
            return newDiscussion;
        } catch (error) {
            console.error('❌ Error creating discussion:', error);
            return null;
        }
    }

    async refreshDiscussions(tournamentId) {
        try {
            // Fetch latest discussions from backend
            const backendDiscussions = await apiCall(`/tournaments/${tournamentId}/discussions`);
            const discussionsArray = Array.isArray(backendDiscussions) ? backendDiscussions : [];
            
            // Update local storage
            this.discussions.set(tournamentId, discussionsArray);
            
            console.log('Discussions refreshed successfully');
        } catch (error) {
            console.error('Error refreshing discussions:', error);
        }
    }

    // READ: Get discussions for a tournament
    getDiscussions(tournamentId) {
        return this.discussions.get(tournamentId) || [];
    }

    // READ: Get specific discussion
    getDiscussion(discussionId) {
        console.log('🔍 getDiscussion called with:', discussionId, 'type:', typeof discussionId);
        console.log('🔍 Available discussions:', this.discussions);
        
        for (let [tournamentId, discussions] of this.discussions) {
            console.log(`🔍 Searching in tournament ${tournamentId}, discussions:`, discussions);
            const discussion = discussions.find(d => {
                console.log(`🔍 Comparing ${d.id} (${typeof d.id}) === ${discussionId} (${typeof discussionId})`);
                return d.id == discussionId; // Use == instead of === for type coercion
            });
            if (discussion) {
                console.log('🔍 Found discussion:', discussion);
                return discussion;
            }
        }
        console.log('🔍 No discussion found for ID:', discussionId);
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
    async showDiscussionsModal(tournamentId) {
        console.log('🔍 DEBUG: showDiscussionsModal called with ID:', tournamentId);
        
        this.currentTournamentId = tournamentId;
        
        try {
            // Fetch discussions from backend
            console.log('🔍 Fetching discussions from backend...');
            const backendDiscussions = await apiCall(`/tournaments/${tournamentId}/discussions`);
            console.log('🔍 Backend discussions raw:', backendDiscussions);
            
            // Ensure backendDiscussions is an array
            const discussionsArray = Array.isArray(backendDiscussions) ? backendDiscussions : [];
            console.log('🔍 Discussions array:', discussionsArray);
            
            // Store discussions in local Map
            this.discussions.set(tournamentId, discussionsArray);
            
            const discussions = this.getDiscussions(tournamentId);
            console.log('🔍 DEBUG: Retrieved discussions after API call:', discussions);
            
            const modal = this.createDiscussionsModal(discussions, tournamentId);
            console.log('🔍 DEBUG: Modal created successfully');
            document.body.appendChild(modal);
            console.log('🔍 DEBUG: Modal added to body');
        } catch (error) {
            console.error('❌ Error fetching or showing discussions:', error);
            
            // Fallback to local/sample data
            console.log('🔍 Falling back to local discussions data');
            const discussions = this.getDiscussions(tournamentId);
            console.log('🔍 DEBUG: Fallback discussions:', discussions);
            
            try {
                const modal = this.createDiscussionsModal(discussions || [], tournamentId);
                document.body.appendChild(modal);
            } catch (modalError) {
                console.error('❌ Error creating modal:', modalError);
                console.error('❌ Modal error stack:', modalError.stack);
                alert(`Error showing discussions: ${modalError.message}. Check console for details.`);
            }
        }
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
            
            // Handle field name differences between frontend and backend
            const content = discussion.content || discussion.description || '';
            const authorName = discussion.authorName || discussion.creator_username || 'Unknown';
            const createdAt = discussion.createdAt || discussion.created_at || new Date().toISOString();
            const isSticky = discussion.isSticky || discussion.is_pinned || false;
            const isLocked = discussion.isLocked || false; // No isLocked in backend yet
            const repliesCount = discussion.replies ? discussion.replies.length : (discussion.replies_count || 0);
            const views = discussion.views || 0;
            
            return `
                <div class="discussion-item">
                    <div class="discussion-info">
                        <div class="discussion-header">
                            <h4 class="discussion-title">${discussion.title}</h4>
                        </div>
                        <div class="discussion-content">${content.substring(0, 150)}${content.length > 150 ? '...' : ''}</div>
                        <div class="discussion-meta">
                            <span class="author">By: ${authorName}</span>
                            <span class="created-date">Created: ${new Date(createdAt).toLocaleDateString()}</span>
                            <span class="replies-count">Replies: ${repliesCount}</span>
                            <span class="views-count">Views: ${views}</span>
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
        
        // Handle field name differences between frontend and backend
        const content = discussion.content || discussion.description || '';
        const authorName = discussion.authorName || discussion.creator_username || 'Unknown';
        const createdAt = discussion.createdAt || discussion.created_at || new Date().toISOString();
        const isSticky = discussion.isSticky || discussion.is_pinned || false;
        const isLocked = discussion.isLocked || false;
        const replies = discussion.replies || [];
        const views = discussion.views || 0;
        const authorId = discussion.authorId || discussion.creator_id;
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <button class="back-to-discussions-btn" style="margin-right: 10px;">← Back to Discussions</button>
                    <h2>${discussion.title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="discussion-full-content">
                    <div class="discussion-content-full">${content}</div>
                    <div class="discussion-meta-full">
                        <span class="author">Started by: <strong>${authorName}</strong></span>
                        <span class="created-date">Created: ${new Date(createdAt).toLocaleString()}</span>
                        <span class="views-count">Views: ${views + 1}</span>
                    </div>
                    <div class="discussion-actions-full">
                        ${canEdit ? `<button class="btn-edit edit-discussion-btn" data-discussion-id="${discussion.id}">Edit</button>` : ''}
                        ${canDelete ? `<button class="btn-delete delete-discussion-btn" data-discussion-id="${discussion.id}">Delete</button>` : ''}
                        ${authorId !== this.currentUserId ? `<button class="btn-primary reply-discussion-btn" data-discussion-id="${discussion.id}">Reply</button>` : ''}
                    </div>
                    <div class="replies-section">
                        <h3>Replies (${replies.length})</h3>
                        <div class="replies-list">
                            ${replies.length > 0 ? 
                                replies.map(reply => `
                                    <div class="reply-item">
                                        <div class="reply-content">${reply.content}</div>
                                        <div class="reply-meta">
                                            <span>By: ${reply.author_name || reply.authorName || 'Unknown'}</span>
                                            <span>${new Date(reply.created_at || reply.createdAt).toLocaleString()}</span>
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
        if (discussion.views !== undefined) {
            discussion.views++;
        }
        
        return modal;
    }

    async handleCreateDiscussion(form) {
        try {
            const formData = new FormData(form);
            const discussionData = {
                title: formData.get('title'),
                content: formData.get('content'),
                isSticky: formData.get('isSticky') === 'on',
                isLocked: formData.get('isLocked') === 'on'
            };

            console.log('🔄 Creating discussion with data:', discussionData);
            console.log('🔄 Tournament ID:', this.currentTournamentId);

            if (!this.currentTournamentId) {
                console.error('❌ No tournament ID set');
                alert('Error: No tournament selected. Please try again.');
                return;
            }

            const result = await this.createDiscussion(this.currentTournamentId, discussionData);
            if (result) {
                alert('Discussion started successfully!');
                this.closeModal();
                // Refresh the discussions modal
                this.showDiscussionsModal(this.currentTournamentId);
            } else {
                console.error('❌ Discussion creation failed - result was null');
                alert('Failed to create discussion. Please check the console for details.');
            }
        } catch (error) {
            console.error('❌ Error in handleCreateDiscussion:', error);
            alert('Failed to create discussion. Error: ' + error.message);
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

    async viewDiscussionDetails(discussionId) {
        const discussion = this.getDiscussion(discussionId);
        if (discussion) {
            // Fetch replies from backend
            try {
                const replies = await apiCall(`/discussions/${discussionId}/replies`);
                discussion.replies = replies || [];
            } catch (error) {
                console.error('Failed to load replies:', error);
                discussion.replies = discussion.replies || [];
            }
            
            this.closeModal();
            const detailsModal = this.createDiscussionDetailsModal(discussion);
            document.body.appendChild(detailsModal);
        }
    }

    // Utility method to clear all discussions (useful for testing)
    clearAllDiscussions() {
        this.discussions.clear();
        localStorage.removeItem('sampleDiscussionsLoaded');
        localStorage.clear();
        window.sampleDataLoadedThisSession = false;
        console.log('All discussions cleared');
    }
    
    // Force clear everything and reload page
    forceResetDiscussions() {
        this.discussions.clear();
        localStorage.clear();
        sessionStorage.clear();
        window.sampleDataLoadedThisSession = false;
        window.location.reload();
    }

    // Utility method to remove duplicates
    removeDuplicateDiscussions(tournamentId) {
        const discussions = this.getDiscussions(tournamentId);
        const seen = new Set();
        const uniqueDiscussions = discussions.filter(discussion => {
            if (seen.has(discussion.title)) {
                return false;
            }
            seen.add(discussion.title);
            return true;
        });
        
        const duplicatesRemoved = discussions.length - uniqueDiscussions.length;
        this.discussions.set(tournamentId, uniqueDiscussions);
        return duplicatesRemoved;
    }

    // Remove duplicates from all tournaments
    removeDuplicatesFromAllTournaments() {
        let totalRemoved = 0;
        for (let tournamentId of this.discussions.keys()) {
            totalRemoved += this.removeDuplicateDiscussions(tournamentId);
        }
        return totalRemoved;
    }

    async loadSampleData() {
        // Check if sample data was already loaded
        const sampleDataLoaded = localStorage.getItem('sampleDiscussionsLoaded');
        if (sampleDataLoaded === 'true' || window.sampleDataLoadedThisSession) {
            return;
        }
        
        // Check if discussions already exist
        const existingCount = Array.from(this.discussions.values()).reduce((total, discussions) => total + discussions.length, 0);
        if (existingCount > 0) {
            localStorage.setItem('sampleDiscussionsLoaded', 'true');
            window.sampleDataLoadedThisSession = true;
            return;
        }
        
        // Load minimal sample data
        await this.createDiscussion('1', {
            title: 'Team Strategy Discussion',
            content: 'What are the best strategies for the upcoming tournament?',
            authorName: 'TacticsPro',
            authorId: 2
        });

        await this.createDiscussion('1', {
            title: 'Looking for Team Members',
            content: 'Looking for skilled players to form a team for this tournament.',
            authorName: 'TeamCaptain',
            authorId: 3
        });
        
        localStorage.setItem('sampleDiscussionsLoaded', 'true');
        window.sampleDataLoadedThisSession = true;
    }

    // UI: Show reply modal
    showReplyModal(discussionId) {
        console.log('🔍 showReplyModal called with discussionId:', discussionId);
        const modal = this.createReplyFormModal(discussionId);
        console.log('🔍 Modal created:', modal);
        if (modal) {
            document.body.appendChild(modal);
            console.log('🔍 Modal appended to body');
            
            // Add direct event listener to the form as backup
            const form = modal.querySelector('#reply-discussion-form');
            if (form) {
                console.log('🔍 Adding direct submit listener to reply form');
                form.addEventListener('submit', (e) => {
                    console.log('🔍 Direct form submit listener triggered!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleReplyToDiscussion(form);
                    return false;
                });
            }
        } else {
            console.error('❌ Failed to create reply modal');
        }
    }

    // UI: Create reply form modal
    createReplyFormModal(discussionId) {
        console.log('🔍 createReplyFormModal called with discussionId:', discussionId);
        const discussion = this.getDiscussion(discussionId);
        console.log('🔍 Found discussion:', discussion);
        
        if (!discussion) {
            console.error('❌ No discussion found for ID:', discussionId);
            alert('Discussion not found. Please refresh the page and try again.');
            return null;
        }

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
    async handleReplyToDiscussion(form) {
        console.log('🔍 handleReplyToDiscussion called with form:', form);
        
        const formData = new FormData(form);
        const discussionId = formData.get('discussionId');
        const content = formData.get('content');

        console.log('🔍 Form data - Discussion ID:', discussionId, 'Content:', content);

        if (!discussionId || !content.trim()) {
            alert('Please provide a reply content.');
            return;
        }

        const replyData = {
            content: content.trim(),
            authorName: 'Current User'
        };

        console.log('🔍 About to call addReplyToDiscussion with:', replyData);

        try {
            const success = await this.addReplyToDiscussion(discussionId, replyData);
            console.log('🔍 addReplyToDiscussion result:', success);
            if (success) {
                this.closeModal();
                // Refresh the discussion details modal to show the new reply
                this.viewDiscussionDetails(discussionId);
            }
        } catch (error) {
            console.error('Failed to add reply:', error);
            alert('Failed to add reply. Please try again.');
        }
    }

    // Add reply to discussion
    async addReplyToDiscussion(discussionId, replyData) {
        try {
            const response = await apiCall(`/discussions/${discussionId}/replies`, {
                method: 'POST',
                body: JSON.stringify(replyData)
            });

            if (response.success) {
                // Update local discussion with new reply
                const discussion = this.getDiscussion(discussionId);
                if (discussion) {
                    if (!discussion.replies) {
                        discussion.replies = [];
                    }
                    discussion.replies.push(response.reply);
                }
                
                console.log('Reply added successfully:', response.reply);
                return true;
            } else {
                console.error('Failed to add reply:', response.error);
                return false;
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            return false;
        }
    }
}

// Test backend connection on page load
async function testBackendConnection() {
    try {
        await apiCall('/health');
    } catch (error) {
        console.log('Backend disconnected - using local storage');
    }
}

// Initialize all CRUD systems when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tournamentCRUD = new TournamentParticipantsCRUD();
    window.userConnectionsCRUD = new UserConnectionsCRUD();
    window.matchResultsCRUD = new MatchResultsCRUD();
    window.tournamentDiscussionsCRUD = new TournamentDiscussionsCRUD();

    // Test backend connection
    testBackendConnection();
});
