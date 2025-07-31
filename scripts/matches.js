const matchModalRoot = document.getElementById('matchModalRoot');

function matchShowDialog(modalElem) {
  matchModalRoot.innerHTML = '';
  matchModalRoot.appendChild(modalElem);
}

async function fetchMatchResults(tid) {
  try {
    currentTid = tid;
    const res = await fetch(`${API_BASE}/matches/tournaments/${tid}/matches`);
    const matches = await res.json();
    matchShowDialog(createMatchResultsModal(matches, tid));

    // try{
    const aiResponse = await fetch(`${API_BASE}/ai/${tid}`);
    if (!aiResponse.ok) {
      showAIPrediction({ analysis: 'No match data available', prediction: ['No match data available'] });
    } else {
      const aiData = await aiResponse.json();
      showAIPrediction(aiData);
    }


  } catch (err) {
    console.error('Error fetching matches:', err);
  }
}

async function fetchTournamentTeams(tid) {
  try {
    const res = await fetch(`${API_BASE}/tournaments/${tid}/teams`);
    const teams = await res.json();
    createReportFormModal(tid, teams);

  } catch (err) {
    console.error('Error fetching teams:', err);
  }
}

async function fetchMatch(mid) {
  try {
    const res = await fetch(`${API_BASE}/matches/${mid}`);
    const match = await res.json();
    matchShowDialog(createEditMatchModal(mid, match));
  } catch (err) {
    console.error('Error fetching match:', err);
  }
}


// Report a new match result
async function reportMatch(tid, matchData) {
  await fetch(`${API_BASE}/matches/tournaments/${tid}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matchData)
  });
  fetchMatchResults(tid);
}

// Update an existing match result
async function updateMatch(mid, updateData) {
  await fetch(`${API_BASE}/matches/${mid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  fetchMatchResults(currentTid);
}

// Delete a match result
async function deleteMatch(mid) {
  if (!confirm('Delete this match result?')) return;
  await fetch(`${API_BASE}/matches/${mid}`, { method: 'DELETE' });
  fetchMatchResults(currentTid);
}

function createMatchResultsModal(matches, tid) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay match-results-modal';

  const matchesList = matches.map(match => `
      <div class="match-item">
          <div class="match-info">
              <div class="match-players">
                  <span class="player">${match.team1_name}</span>
                  <span class="vs">vs</span>
                  <span class="player">${match.team2_name}</span>
              </div>
              <div class="match-score">
                  <span class="score">${match.score_team1} - ${match.score_team2}</span>
                  <span class="winner-badge">Winner: ${match.winner_name}</span>
              </div>
              <div class="match-meta">
                  <span class="match-date">Date: ${new Date(match.match_date).toLocaleDateString()}</span>
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
              <h2>Match Results - ${tid}</h2>
              <button class="close-modal">&times;</button>
          </div>
          <div class="modal-actions">
              <button class="btn-primary report-match-btn" data-tid="${tid}" >Report New Match</button>
          </div>
          <div class="ai-prediction-box">
            <h3>AI Match Prediction</h3>
            <div class="ai-prediction-content">
              Loading...
            </div>
          </div>
          <div class="matches-list">
              ${matches.length > 0 ? matchesList : '<p class="no-matches">No match results reported yet.</p>'}
          </div>
      </div>
  `;
  return modal;
}

function showAIPrediction(aiData) {
  const aiPredictionBox = document.querySelector('.ai-prediction-box');
  aiPredictionBox.querySelector('.ai-prediction-content').innerHTML = `
    <p><strong>Analysis:</strong> ${aiData.analysis}</p>
    <p><strong>Prediction:</strong> ${aiData.prediction.join(', ')}</p>
  `;
}

function createReportFormModal(tid, teams) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  const teamOption = teams.map(team => `<option value="${team}">${team}</option>`).join('')
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Report Match</h2>
        <button class="cancel-to-results" aria-label="Close">&times;</button>
      </div>
      <form id="report-match-form" data-tid="${tid}" class="match-form">
        <div class="form-group">
          <label for="team1">Team 1:</label>
          <select name="team1" id="team1" required>
            <option value="">- Select Team -</option>
            ${teamOption}
          </select>
        </div>
        <div class="form-group">
          <label for="score1">Score 1:</label>
          <input type="number" id="score1" name="score1" placeholder="0" min="0" required />
        </div>
        <div class="form-group">
          <label for="team2">Team 2:</label>
          <select name="team2" id="team2" required>
            <option value="">- Select Team -</option>
            ${teamOption}
          </select>
        </div>
        <div class="form-group">
          <label for="score2">Score 2:</label>
          <input type="number" id="score2" name="score2" placeholder="0" min="0" required />
        </div>
        <div class="form-group">
          <label for="date">Date:</label>
          <input type="date" id="date" name="date"
                 value="${new Date().toISOString().split('T')[0]}" required />
        </div>
        <button type="submit" class="btn-primary">Submit</button>
      </form>
    </div>
  `;
  matchShowDialog(modal);
}

function createEditMatchModal(matchId, match) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Match Result</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="edit-match-form" class="match-form" data-match-id="${matchId}">
                    <input type="hidden" name="matchId" value="${matchId}">
                    <div class="form-group">
                        <label for="edit-score1">Team 1 Score:</label>
                        <input type="number" id="edit-score1" name="score1" required min="0" value="${match.score_team1}">

                    </div>
                    <div class="form-group">
                        <label for="edit-score2">Team 2 Score:</label>
                        <input type="number" id="edit-score2" name="score2" required min="0" value="${match.score_team2}">
                    <div class="form-group">
                        <label for="edit-match-date">Match Date:</label>
                        <input type="date" id="edit-match-date" name="date" required value="${match.match_date}">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary cancel-to-results">Cancel</button>
                        <button type="submit" class="btn-primary">Update Match</button>
                    </div>
                </form>
            </div>
        `;
  return modal;
}



document.addEventListener('click', e => {
  if (e.target.matches('.close-modal')) {
    matchModalRoot.innerHTML = '';
    return;
  }

  else if (e.target.matches('.view-match-results-btn')) {
    e.preventDefault();
    const tid = e.target.dataset.tournamentId;
    fetchMatchResults(tid);
  }

  else if (e.target.matches('.report-match-btn')) {
    e.preventDefault();
    const tid = e.target.dataset.tid;
    fetchTournamentTeams(tid);
  }

  else if (e.target.matches('.edit-match-btn')) {
    e.preventDefault();
    console.log("abc");
    const mid = e.target.dataset.matchId;
    fetchMatch(mid);
  }
  
  else if (e.target.matches('.cancel-to-results')) {
      e.preventDefault();
      if (typeof currentTid !== 'undefined' && currentTid) {
        fetchMatchResults(currentTid);
      } else {
        const form = e.target.closest('form');
        const tid = form?.dataset.tid;
        if (tid) {
          fetchMatchResults(tid);
        } else {
          matchModalRoot.innerHTML = '';
        }
      }
    }
    else if (e.target.matches('.delete-match-btn')) {
      e.preventDefault();
      const mid = e.target.dataset.matchId;
      deleteMatch(mid);
    }

});

document.addEventListener('submit', e => {
  if (e.target.id === 'report-match-form') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tid = e.target.dataset.tid
    const matchData = {
      team1: fd.get('team1'),
      team2: fd.get('team2'),
      score1: fd.get('score1'),
      score2: fd.get('score2'),
      date: fd.get('date')
    }
    reportMatch(tid, matchData);
  }

  else if (e.target.id === 'edit-match-form') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const mid = e.target.dataset.matchId;
    const matchData = {
      score1: fd.get('score1'),
      score2: fd.get('score2'),
      date: fd.get('date')
    }
    updateMatch(mid, matchData);
  }
});

