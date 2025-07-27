document.querySelector('.login-card').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            // Login successful, redirect to profile or dashboard
            alert('Login successful!');
            localStorage.setItem('currentUser', result.user.id);
            localStorage.setItem('username', result.user.username);
            localStorage.setItem('email', result.user.email);
            localStorage.setItem('isLoggedIn', 'true');

            window.location.href = 'profile.html';
        } else {
            // Show error message
            alert(result.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Network error. Please check your connection and try again.');
    }
});