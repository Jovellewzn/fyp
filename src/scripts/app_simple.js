// Tournament Management System - Frontend JavaScript
console.log('Tournament Management System loaded');

// API Configuration
const API_BASE = 'http://localhost:5000/api';

// Current user state
let currentUser = null;

// Utility function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include', // Include session cookies
            ...options
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `API call failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please make sure the backend is running.');
        }
        throw error;
    }
}

// Authentication functions
async function register(username, email, password) {
    try {
        const result = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        showMessage('Registration successful! Please login.', 'success');
        return result;
    } catch (error) {
        showMessage(error.message, 'error');
        throw error;
    }
}

async function login(username, password) {
    try {
        const result = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        currentUser = result.user;
        updateUI();
        showMessage('Login successful!', 'success');
        return result;
    } catch (error) {
        showMessage(error.message, 'error');
        throw error;
    }
}

async function logout() {
    try {
        await apiCall('/auth/logout', { method: 'POST' });
        currentUser = null;
        updateUI();
        showMessage('Logged out successfully!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Tournament functions
async function loadTournaments() {
    try {
        const result = await apiCall('/tournaments');
        displayTournaments(result.tournaments);
    } catch (error) {
        showMessage('Failed to load tournaments: ' + error.message, 'error');
    }
}

async function createTournament(tournamentData) {
    try {
        const result = await apiCall('/tournaments', {
            method: 'POST',
            body: JSON.stringify(tournamentData)
        });
        
        showMessage('Tournament created successfully!', 'success');
        loadTournaments(); // Refresh the list
        return result;
    } catch (error) {
        showMessage(error.message, 'error');
        throw error;
    }
}

async function joinTournament(tournamentId, teamName = '') {
    try {
        const result = await apiCall(`/tournaments/${tournamentId}/join`, {
            method: 'POST',
            body: JSON.stringify({ team_name: teamName })
        });
        
        showMessage('Successfully joined tournament!', 'success');
        loadTournaments(); // Refresh the list
        return result;
    } catch (error) {
        showMessage(error.message, 'error');
        throw error;
    }
}

// UI Functions
function showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'message';
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            max-width: 300px;
        `;
        document.body.appendChild(messageEl);
    }
    
    // Set message and styling based on type
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    
    // Color coding
    switch (type) {
        case 'success':
            messageEl.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            messageEl.style.backgroundColor = '#f44336';
            break;
        default:
            messageEl.style.backgroundColor = '#2196F3';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

function updateUI() {
    // Update login/logout buttons
    const loginSection = document.getElementById('loginSection');
    const userSection = document.getElementById('userSection');
    const createTournamentBtn = document.getElementById('createTournamentBtn');
    
    if (currentUser) {
        if (loginSection) loginSection.style.display = 'none';
        if (userSection) {
            userSection.style.display = 'block';
            userSection.innerHTML = `
                <span>Welcome, ${currentUser.username}!</span>
                <button onclick="logout()" class="btn btn-secondary">Logout</button>
            `;
        }
        if (createTournamentBtn) createTournamentBtn.style.display = 'inline-block';
    } else {
        if (loginSection) loginSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (createTournamentBtn) createTournamentBtn.style.display = 'none';
    }
}

function displayTournaments(tournaments) {
    const container = document.getElementById('tournamentsContainer');
    if (!container) return;
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p>No tournaments available.</p>';
        return;
    }
    
    container.innerHTML = tournaments.map(tournament => `
        <div class="tournament-card">
            <h3>${tournament.title}</h3>
            <p>${tournament.description || 'No description available'}</p>
            <div class="tournament-info">
                <span>Game: ${tournament.game_type}</span>
                <span>Entry Fee: $${tournament.entry_fee}</span>
                <span>Prize Pool: $${tournament.prize_pool}</span>
                <span>Participants: ${tournament.participant_count}/${tournament.max_participants}</span>
                <span>Status: ${tournament.status}</span>
            </div>
            <div class="tournament-dates">
                <small>Start: ${new Date(tournament.start_date).toLocaleString()}</small><br>
                <small>End: ${new Date(tournament.end_date).toLocaleString()}</small>
            </div>
            ${currentUser && tournament.participant_count < tournament.max_participants ? 
                `<button onclick="joinTournamentPrompt(${tournament.id})" class="btn btn-primary">Join Tournament</button>` : 
                ''}
        </div>
    `).join('');
}

function joinTournamentPrompt(tournamentId) {
    const teamName = prompt('Enter your team name (optional):');
    if (teamName !== null) { // User didn't cancel
        joinTournament(tournamentId, teamName);
    }
}

// Form handlers
function handleLoginForm(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;
    
    login(username, password);
}

function handleRegisterForm(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value;
    const email = form.email.value;
    const password = form.password.value;
    
    register(username, email, password);
}

function handleTournamentForm(event) {
    event.preventDefault();
    const form = event.target;
    
    const tournamentData = {
        title: form.title.value,
        description: form.description.value,
        game_type: form.game_type.value,
        entry_fee: parseFloat(form.entry_fee.value) || 0,
        prize_pool: parseFloat(form.prize_pool.value) || 0,
        max_participants: parseInt(form.max_participants.value),
        start_date: form.start_date.value,
        end_date: form.end_date.value
    };
    
    createTournament(tournamentData);
    form.reset();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tournament Management System initialized');
    
    // Load tournaments on page load
    loadTournaments();
    
    // Set up form event listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginForm);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterForm);
    }
    
    const tournamentForm = document.getElementById('tournamentForm');
    if (tournamentForm) {
        tournamentForm.addEventListener('submit', handleTournamentForm);
    }
    
    // Update UI based on current user state
    updateUI();
    
    // Auto-refresh tournaments every 30 seconds
    setInterval(loadTournaments, 30000);
});

// Export functions for global use
window.apiCall = apiCall;
window.register = register;
window.login = login;
window.logout = logout;
window.loadTournaments = loadTournaments;
window.createTournament = createTournament;
window.joinTournament = joinTournament;
window.joinTournamentPrompt = joinTournamentPrompt;
