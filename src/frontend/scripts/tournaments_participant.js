const API_BASE = 'http://localhost:5000/api';
const modalRoot = document.getElementById('participantsModalRoot');
const currentUserId = 1;

function showModal(modalElem) {
  modalRoot.innerHTML = '';
  modalRoot.appendChild(modalElem);
}

async function showParticipants(tid) {
  try {
    console.log(`Loading participants for tournament ${tid}`);
    const res = await fetch(`${API_BASE}/tournaments/${tid}/participants`);
    const list = await res.json();
    console.log('Participants:', list);
    currentParticipants = list;
    showModal(createParticipantsModal(list, tid));
  } catch (err) {
    console.error(`Failed to load participants: ${err.message}`);
  }
}

// Join tournament 
async function joinTournament(tid, teamName) {
  try {
    const response = await fetch(`${API_BASE}/tournaments/${tid}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId, teamName })
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(`Error joining tournament: ${errorData.error}`);
    }

    showParticipants(tid);
  } catch (err) {
    console.error(`Join failed: ${err.message}`);
  }
}

// Update team name
async function updateParticipant(pid, teamName, tid) {
  try {
    await fetch(`${API_BASE}/tournaments/participants/${pid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName })
    });
    showParticipants(tid);
  } catch (err) {
    console.error(`Update failed: ${err.message}`);
  }
}

//Remove participant
async function removeParticipant(pid, tid) {
  if (!confirm('Remove this participant?')) return;
  try {

    await fetch(`${API_BASE}/tournaments/participants/${pid}`, { method: 'DELETE' });
    showParticipants(tid);


  } catch (err) {
    console.error(`Delete failed: ${err.message}`);
  }
}

function createJoinModal(tid) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Join Tournament</h2>
        <button class="close-modal">&times;</button>
      </div>
      <form id="join-tournament-form" class="join-form">
         <input type="hidden" name="tid" value="${tid}">
        <div class="form-group">
          <label for="teamName">Team Name:</label>
          <input type="text" id="teamName" name="teamName" placeholder="Enter your team name">
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

function createParticipantsModal(participants, tid) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';

  const participantsList = participants.map(participant => `
            <div class="participant-item">
                <div class="participant-info">
                    <span class="participant-username">${participant.username}</span>
                    <span class="participant-team">${participant.team_name || 'No team'}</span>
                    <span class="participant-date">${new Date(participant.registration_date).toLocaleDateString()}</span>
                </div>
                <div class="participant-actions">
                    <button class="btn-edit edit-participant-btn" data-participant-id="${participant.id}" data-tid="${tid}">Edit</button>
                    <button class="btn-delete delete-participant-btn" data-participant-id="${participant.id}">Remove</button>
                </div>
            </div>
        `).join('');

  modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Tournament Participants (${participants.length})</h2>
                    <button class="close-modal">&times;</button>
                    <input type="hidden" name="tid" value="${tid}">
                </div>
                <div class="participants-list">
                    ${participants.length > 0 ? participantsList : '<p class="no-participants">No participants yet.</p>'}
                </div>
            </div>
        `;
  return modal;
}

function createEditModal(participant,tid) {
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
                    <input type="hidden" name="tid" value="${tid}">

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





document.addEventListener('click', e => {

  if (e.target.matches('.close-modal')) {
    modalRoot.innerHTML = '';
    return;
  }

  // open participants modal
  else if (e.target.matches('.view-details-btn')) {
    const tid = e.target.closest('.tournament-card').dataset.tournamentId;
    showParticipants(tid);
    return;
  }
  
  // open join form
  else if (e.target.matches('.join-btn') || e.target.matches('#openJoinForm')) {
    const tid = e.target.dataset.tid || e.target.closest('.tournament-card').dataset.tournamentId;
    showModal(createJoinModal(tid));
    return;
  }

  // open edit form
  else if (e.target.matches('.edit-participant-btn')) {
     const pid = e.target.dataset.participantId;
    const tid = e.target.dataset.tid;
    const participant = currentParticipants.find(p => p.id.toString() === pid);
    showModal(createEditModal(participant,tid)) ;
    return;
  }

  // Remove participant
  else if (e.target.matches('.delete-participant-btn')) {
    const pid = e.target.dataset.participantId;
    const tid = document.querySelector('input[name="tid"]');
    removeParticipant(pid, tid);
    return;
  }
});



document.addEventListener('submit', e => {
  if (e.target.matches('#join-tournament-form')) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tid = fd.get('tid');
    const teamName = fd.get('teamName');
    joinTournament(tid, teamName);
  }
  if (e.target.matches('#edit-participant-form')) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pid = fd.get('participantId');
    const teamName = fd.get('teamName');
    const tid = modalRoot.querySelector('input[name="tid"]').value;
    updateParticipant(pid, teamName, tid);
    return;
  }
});
