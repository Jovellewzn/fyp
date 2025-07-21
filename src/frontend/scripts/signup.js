document.querySelector('.signup-card').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Basic client-side validation
      if (!username || !email || !password || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
      }
      
      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
      
      if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE}/users/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password, confirmPassword })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // Signup successful, redirect to login
          alert('Account created successfully! Please log in.');
          window.location.href = 'login.html';
        } else {
          // Show error message
          alert(result.error || 'Signup failed. Please try again.');
        }
      } catch (error) {
        console.error('Signup error:', error);
        alert('Network error. Please check your connection and try again.');
      }
    });