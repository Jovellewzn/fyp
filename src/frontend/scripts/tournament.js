// Tournament Modal Functions
function openTournamentModal(isEdit = false, tournamentId = null) {
    const modal = document.getElementById('tournamentModal');
    const title = modal.querySelector('.modal-title');
    const submitBtn = modal.querySelector('button[type="submit"]');

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    if (isEdit) {
        title.textContent = 'Edit Tournament';
        submitBtn.textContent = 'Update Tournament';
        modal.setAttribute('data-edit-id', tournamentId);
    } else {
        title.textContent = 'Create New Tournament';
        submitBtn.textContent = 'Create Tournament';
        modal.removeAttribute('data-edit-id');

        // Set minimum start date to current date/time
        const now = new Date();
        const currentDateTime = now.toISOString().slice(0, 16);
        document.getElementById('startDate').min = currentDateTime;

        // Clear form
        document.getElementById('tournamentForm').reset();
        document.getElementById('entryFee').value = '0';
        document.getElementById('prizePool').value = '0';
    }
}

function closeTournamentModal() {
    const modal = document.getElementById('tournamentModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.getElementById('tournamentModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeTournamentModal();
    }
});

// Auto-update end date when start date changes
document.getElementById('startDate').addEventListener('change', function () {
    const startDate = new Date(this.value);
    const endDateInput = document.getElementById('endDate');

    if (startDate) {
        // Set minimum end date to start date
        endDateInput.min = this.value;

        // If end date is before start date, clear it
        if (endDateInput.value && new Date(endDateInput.value) < startDate) {
            endDateInput.value = '';
        }
    }
});

// Form submission
document.getElementById('tournamentForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const modal = document.getElementById('tournamentModal');
    const isEdit = modal.hasAttribute('data-edit-id');
    const tournamentId = modal.getAttribute('data-edit-id');

    console.log('Tournament form submitted', isEdit ? 'for editing' : 'for creation');

    const formData = new FormData(this);
    const tournamentData = {};

    // Convert form data to object
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            tournamentData[key] = value;
        }
    }

    console.log('Tournament data to submit:', tournamentData);

    // Validation
    if (!tournamentData.title) {
        alert('Tournament title is required');
        return;
    }

    if (!tournamentData.game_type) {
        alert('Please select a game type');
        return;
    }

    if (!tournamentData.start_date) {
        alert('Start date is required');
        return;
    }

    // Check if start date is in the future (only for new tournaments)
    if (!isEdit) {
        const startDate = new Date(tournamentData.start_date);
        const now = new Date();
        if (startDate <= now) {
            alert('Start date must be in the future');
            return;
        }
    }

    // Check if end date is after start date
    if (tournamentData.end_date) {
        const endDate = new Date(tournamentData.end_date);
        const startDate = new Date(tournamentData.start_date);
        if (endDate <= startDate) {
            alert('End date must be after start date');
            return;
        }
    }

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = isEdit ? 'Updating...' : 'Creating...';
    submitBtn.disabled = true;

    try {
        const url = isEdit ? `${API_BASE}/tournaments/${tournamentId}` : `${API_BASE}/tournaments`;
        const method = isEdit ? 'PUT' : 'POST';

        console.log(`Sending ${method} request to ${url}...`);
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tournamentData),
            credentials: 'include',
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);

        if (response.ok) {
            alert(`Tournament ${isEdit ? 'updated' : 'created'} successfully!`);
            closeTournamentModal();
            // Refresh the tournaments list
            loadTournaments();
        } else {
            console.error('Server error:', result);
            alert(`Error ${isEdit ? 'updating' : 'creating'} tournament: ` + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error(`Network error ${isEdit ? 'updating' : 'creating'} tournament:`, error);
        alert(`Failed to ${isEdit ? 'update' : 'create'} tournament. Please check your connection and try again.`);
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Add event listener to create tournament button
document.addEventListener('DOMContentLoaded', function () {
    const createBtn = document.getElementById('create-tournament-btn');
    if (createBtn) {
        createBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openTournamentModal();
        });
    }

    // Add filter form event listener
    const filterForm = document.querySelector('.filter-bar');
    if (filterForm) {
        filterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            applyFilters();
        });
    }
});

// Function for loading tournaments
function loadTournaments() {
    console.log('🔄 Loading tournaments...');
    fetch(`${API_BASE}/tournaments`)
        .then(response => {
            console.log('📡 API Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📊 API Response Data:', data);
            if (data.tournaments) {
                console.log(`🏆 Found ${data.tournaments.length} tournaments`);
                displayTournaments(data.tournaments);
            } else {
                console.warn('⚠️ No tournaments property in response');
                displayTournaments([]);
            }
        })
        .catch(error => {
            console.error('❌ Error loading tournaments:', error);
            // Show error message to user
            const tournamentsGrid = document.querySelector('.tournaments-grid');
            if (tournamentsGrid) {
                tournamentsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #ff6b6b; padding: 2rem;">
            <h3>Failed to load tournaments</h3>
            <p>Please check if the server is running and try refreshing the page.</p>
            <button onclick="loadTournaments()" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
            </div>
        `;
            }
        });
}

// Function to display tournaments
function displayTournaments(tournaments) {
    console.log('🎮 Displaying tournaments:', tournaments);
    const tournamentsGrid = document.querySelector('.tournaments-grid');

    if (!tournamentsGrid) {
        console.error('❌ Tournaments grid element not found!');
        return;
    }

    // Clear existing placeholder content
    tournamentsGrid.innerHTML = '';

    if (tournaments.length === 0) {
        tournamentsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #999; padding: 3rem;">
        <h3>No tournaments found</h3>
        <p>Be the first to create a tournament!</p>
        <button onclick="openTournamentModal()" class="btn btn-primary" style="margin-top: 1rem;">Create Tournament</button>
        </div>
    `;
        return;
    }

    console.log(`✅ Rendering ${tournaments.length} tournament cards`);
    tournaments.forEach((tournament, index) => {
        console.log(`🏆 Rendering tournament ${index + 1}:`, tournament.title);
        const card = createTournamentCard(tournament);
        tournamentsGrid.appendChild(card);
    });
}

// Function to apply filters
function applyFilters() {
    console.log('🔍 Applying filters...');

    const gameType = document.getElementById('game_type').value;
    const status = document.getElementById('status').value;
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;

    console.log('Filter values:', { gameType, status, startDate, endDate });

    // Build query parameters
    const params = new URLSearchParams();
    if (gameType) params.append('game_type', gameType);
    if (status) params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const url = `${API_BASE}/tournaments${queryString ? '?' + queryString : ''}`;

    console.log('🔗 Filter URL:', url);

    fetch(url)
        .then(response => {
            console.log('📡 Filter Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📊 Filter Response Data:', data);
            if (data.tournaments) {
                console.log(`🏆 Found ${data.tournaments.length} filtered tournaments`);
                displayTournaments(data.tournaments);
            } else {
                console.warn('⚠️ No tournaments property in filter response');
                displayTournaments([]);
            }
        })
        .catch(error => {
            console.error('❌ Error applying filters:', error);
            // Show error message
            const tournamentsGrid = document.querySelector('.tournaments-grid');
            if (tournamentsGrid) {
                tournamentsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #ff6b6b; padding: 2rem;">
            <h3>Failed to apply filters</h3>
            <p>Please try again or refresh the page.</p>
            <button onclick="loadTournaments()" class="btn btn-primary" style="margin-top: 1rem;">Reset Filters</button>
            </div>
        `;
            }
        });
}

// Function to create tournament card HTML
function createTournamentCard(tournament) {
    const card = document.createElement('article');
    card.className = 'tournament-card';
    card.setAttribute('data-tournament-id', tournament.id);

    // Check if current user owns this tournament
    const currentUserId = getLocalStorage('currentUser');
    console.log('Current user ID:', currentUserId);
    const isOwner = tournament.organizer_id == currentUserId;
    if (isOwner) {
        card.classList.add('user-owned');
    }


    const startDate = new Date(tournament.start_date);
    const endDate = tournament.end_date ? new Date(tournament.end_date) : null;
    const dateRange = endDate ?
        `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}` :
        startDate.toLocaleDateString();

    const statusClass = tournament.status.toLowerCase();
    const entryFeeText = tournament.entry_fee > 0 ? `$${tournament.entry_fee}` : 'Free';
    const prizePoolText = tournament.prize_pool > 0 ? `$${tournament.prize_pool}` : 'No prize';
    const maxParticipantsText = tournament.max_participants ? tournament.max_participants : 'Unlimited';

    card.innerHTML = `
    ${isOwner ? `
    <div class="tournament-menu">
        <button class="menu-trigger" onclick="toggleTournamentMenu(${tournament.id})" aria-label="Tournament options">⋯</button>
        <div class="menu-dropdown" id="menu-${tournament.id}">
        <button class="menu-item" onclick="editTournament(${tournament.id})">
            <i>✏️</i> Edit
        </button>
        <button class="menu-item delete" onclick="deleteTournament(${tournament.id})">
            <i>🗑️</i> Delete
        </button>
        </div>
    </div>
    ` : ''}
    <div class="tournament-title">${tournament.title}</div>
    <div class="tournament-desc">${tournament.description || 'No description provided'}</div>
    <div class="tournament-meta">${tournament.game_type} | Entry Fee: ${entryFeeText} | Prize: ${prizePoolText} | Max: ${maxParticipantsText} | ${dateRange}</div>
    <div class="tournament-badges">
        <span class="badge ${statusClass}">${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}</span>
        ${isOwner ? '<span class="badge organizer">Organizer</span>' : ''}
    </div>
    <div class="tournament-actions">
        <a href="#details" class="tournament-btn view-details-btn">View Details</a>
        <button class="tournament-btn join-btn">Join</button>
        <button class="tournament-btn view-match-results-btn" data-tournament-id="${tournament.id}">Match Results</button>
        <button class="tournament-btn view-discussions-btn" data-tournament-id="${tournament.id}">Discussions</button>
    </div>
    `;

    return card;
}

// Utility function to get local storage
function getLocalStorage(name) {
    const value = localStorage.getItem(name);
    console.log(`🔍 Local Storage - ${name}:`, value);
    return value;
}

// Tournament menu functions
function toggleTournamentMenu(tournamentId) {
    const menu = document.getElementById(`menu-${tournamentId}`);
    const allMenus = document.querySelectorAll('.menu-dropdown');

    // Close all other menus
    allMenus.forEach(m => {
        if (m.id !== `menu-${tournamentId}`) {
            m.classList.remove('show');
        }
    });

    // Toggle current menu
    menu.classList.toggle('show');
}

// Close menus when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.tournament-menu')) {
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Edit tournament function
function editTournament(tournamentId) {
    console.log('Editing tournament:', tournamentId);

    // Close menu
    document.getElementById(`menu-${tournamentId}`).classList.remove('show');

    // Fetch tournament data and populate edit modal
    fetch(`${API_BASE}/tournaments/${tournamentId}`, { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.tournament) {
                populateEditModal(data.tournament);
                openTournamentModal(true, tournamentId);
            }
        })
        .catch(error => {
            console.error('Error fetching tournament for edit:', error);
            alert('Failed to load tournament data for editing');
        });
}

// Delete tournament function
function deleteTournament(tournamentId) {
    console.log('Deleting tournament:', tournamentId);

    // Close menu
    document.getElementById(`menu-${tournamentId}`).classList.remove('show');

    if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
        fetch(`${API_BASE}/tournaments/${tournamentId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('Tournament deleted successfully!');
                    loadTournaments();
                } else {
                    alert('Error deleting tournament: ' + (result.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error deleting tournament:', error);
                alert('Failed to delete tournament. Please try again.');
            });
    }
}

// Populate edit modal with tournament data
function populateEditModal(tournament) {
    document.getElementById('tournamentTitle').value = tournament.title;
    document.getElementById('tournamentDescription').value = tournament.description || '';
    document.getElementById('gameType').value = tournament.game_type;
    document.getElementById('entryFee').value = tournament.entry_fee;
    document.getElementById('prizePool').value = tournament.prize_pool;
    document.getElementById('maxParticipants').value = tournament.max_participants || '';

    // Format dates for datetime-local input
    if (tournament.start_date) {
        const startDate = new Date(tournament.start_date);
        document.getElementById('startDate').value = startDate.toISOString().slice(0, 16);
    }

    if (tournament.end_date) {
        const endDate = new Date(tournament.end_date);
        document.getElementById('endDate').value = endDate.toISOString().slice(0, 16);
    }
}

// Load tournaments when page loads
loadTournaments();