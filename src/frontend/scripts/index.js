// --- Navbar Auth & Responsive Logic ---
      const navLinks = document.getElementById('navLinks');
      const navAuth = document.getElementById('navAuth');
      const navHamburger = document.getElementById('navHamburger');
      // Set your nav links here for logged-in state
      const NAV_LINKS = [
        { href: 'index.html', label: 'Home' },
        { href: 'tournaments.html', label: 'Tournaments' },
        { href: 'social.html', label: 'Social' },
        { href: 'profile.html', label: 'Profile' },
        { href: 'notifications.html', label: 'Notifications' }
      ];
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
              <span class="nav-username">Hi, ${user.username}</span>
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