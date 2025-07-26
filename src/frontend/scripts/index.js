// // --- Navbar Auth & Responsive Logic ---
//       const navLinks = document.getElementById('navLinks');
//       const navAuth = document.getElementById('navAuth');
//       const navHamburger = document.getElementById('navHamburger');
//       // Set your nav links here for logged-in state
//       const NAV_LINKS = [
//         { href: 'index.html', label: 'Home' },
//         { href: 'tournaments.html', label: 'Tournaments' },
//         { href: 'social.html', label: 'Social' },
//         { href: 'profile.html', label: 'Profile' },
//         { href: 'notifications.html', label: 'Notifications' }
//       ];
      // Utility: get current page filename
      function getCurrentPage() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1);
      }
      async function renderNavbar() {
        try {
          // Check authentication status from server
          const response = await fetch(`${API_BASE}/users/profile`, {
            credentials: 'include',
            method: 'GET'
          });
          
          navLinks.innerHTML = '';
          navAuth.innerHTML = '';
          
          if (response.ok) {
            // User is authenticated
            const user = await response.json();
            
            const current = getCurrentPage();
            NAV_LINKS.forEach(link => {
              const a = document.createElement('a');
              a.href = link.href;
              a.className = 'nav-link' + (current === link.href ? ' active' : '');
              a.setAttribute('tabindex', '0');
              if (current === link.href) {
                a.setAttribute('aria-current', 'page');
              }
              a.textContent = link.label;
              navLinks.appendChild(a);
            });
            
            navAuth.innerHTML = `
              <button type="button" class="nav-btn logout-btn" id="logoutBtn">Logout</button>
            `;
            
            document.getElementById('logoutBtn').onclick = async () => {
              try {
                await fetch(`${API_BASE}/users/logout`, {
                  method: 'POST', 
                  credentials: 'include' 
                });
                window.location.href = '/';
              } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/';
              }
            };
          } else {
            // User is not authenticated
            navLinks.innerHTML = '';
            navAuth.innerHTML = `
              <button class="nav-btn login-btn" id="loginBtn">Login</button>
              <button class="nav-btn signup-btn" id="signupBtn">Sign Up</button>
            `;
            document.getElementById('loginBtn').onclick = () => {
              window.location.href = 'login.html';
            };
            document.getElementById('signupBtn').onclick = () => {
              window.location.href = 'signup.html';
            };
          }
        } catch (error) {
          console.error('Authentication check failed:', error);
          // Fallback: show login/signup buttons
          navLinks.innerHTML = '';
          navAuth.innerHTML = `
            <button class="nav-btn login-btn" id="loginBtn">Login</button>
            <button class="nav-btn signup-btn" id="signupBtn">Sign Up</button>
          `;
          document.getElementById('loginBtn').onclick = () => {
            window.location.href = 'login.html';
          };
          document.getElementById('signupBtn').onclick = () => {
            window.location.href = 'signup.html';
          };
        }
      }
      renderNavbar();
      // Hamburger menu toggle
      navHamburger.addEventListener('click', function() {
        navLinks.classList.toggle('show');
        navHamburger.setAttribute('aria-expanded', navLinks.classList.contains('show'));
      });
      // Close nav on link click (mobile)
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('nav-link')) {
          navLinks.classList.remove('show');
          navHamburger.setAttribute('aria-expanded', 'false');
        }
      });
      // Keyboard accessibility for hamburger
      navHamburger.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navHamburger.click();
        }
      });

async function loadUpcomingTournaments() {
  const container = document.querySelector('.tournaments-card .scroll-list');
  if (!container) return;
  container.innerHTML = '<div>Loading upcoming tournaments...</div>';
  try {
    const res = await fetch(`${API_BASE}/tournaments/upcoming`);
    const data = await res.json();
    const tournaments = data.tournaments || [];

    if (tournaments.length === 0) {
      container.innerHTML = '<div>No upcoming tournaments at the moment. Check back soon!</div>';
      return;
    }

    container.innerHTML = tournaments.map(t => `
      <div class="tournament-card">
        <div class="tournament-title">${t.name}</div>
        <div class="tournament-meta">
          <span class="tournament-category">${t.category}</span> |
          <span class="tournament-date">Starts: ${new Date(t.start_date).toLocaleDateString()}</span>
        </div>
        <div class="tournament-prize">Prize: $${t.prize}</div>
        <span class="tournament-status ${t.status.toLowerCase()}">
          ${t.status.charAt(0).toUpperCase() + t.status.slice(1)}
        </span>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="error">Failed to load upcoming tournaments.</div>';
  }
}

// Load and render Recent Social Posts
async function loadRecentPosts() {
  const container = document.querySelector('.posts-card .scroll-list');
  if (!container) return;
  container.innerHTML = '<div>Loading...</div>';
  try {
    // Use the correct API for the home feed
    const res = await fetch(`${API_BASE}/posts?category=home`, { credentials: 'include' });
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = '<div>No recent posts.</div>';
      return;
    }
    container.innerHTML = posts.map(p => `
      <div class="post-card">
        <img src="${p.profile_picture || 'https://randomuser.me/api/portraits/lego/1.jpg'}" alt="User Avatar" class="post-avatar">
        <div class="post-content">
          <span class="post-username">${p.username}</span>
          <span class="post-type">${p.type || ''}</span>
          <p class="post-preview">${p.preview || p.content || ''}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<div class="error">Failed to load posts.</div>';
  }
}

// Load and render Friend Requests (if section exists)
async function loadFriendRequests() {
  const container = document.querySelector('.friend-requests-card .scroll-list');
  if (!container) return;
  container.innerHTML = '<div>Loading...</div>';
  try {
    // Use the connections API to get incoming pending requests
    const res = await fetch(`${API_BASE}/connections/users`, { credentials: 'include' });
    const data = await res.json();
    const requests = data.incoming_pending || [];
    if (!Array.isArray(requests) || requests.length === 0) {
      container.innerHTML = '<div>No friend requests.</div>';
      return;
    }
    container.innerHTML = requests.map(r => `
      <div class="friend-request-card" data-connection-id="${r.id}">
        <span>${r.requester_username} sent you a friend request!</span>
        <div class="friend-request-actions">
          <button class="accept-request-btn">Accept</button>
          <button class="reject-request-btn">Reject</button>
        </div>
      </div>
    `).join('');

    // Attach event listeners to the buttons
    container.querySelectorAll('.accept-request-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const card = this.closest('.friend-request-card');
        const connectionId = card.getAttribute('data-connection-id');
        await handleFriendRequestAction(connectionId, 'accepted');
      });
    });
    container.querySelectorAll('.reject-request-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const card = this.closest('.friend-request-card');
        const connectionId = card.getAttribute('data-connection-id');
        await handleFriendRequestAction(connectionId, 'blocked');
      });
    });
  } catch (err) {
    container.innerHTML = '<div class="error">Failed to load friend requests.</div>';
  }
}

// Helper to handle accept/reject actions
async function handleFriendRequestAction(connectionId, status) {
  try {
    await fetch(`${API_BASE}/connections/${connectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    // Reload the friend requests list after action
    loadFriendRequests();
  } catch (err) {
    alert('Failed to update friend request.');
  }
}

// Call these after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadUpcomingTournaments();
  loadRecentPosts();
  loadFriendRequests();
});