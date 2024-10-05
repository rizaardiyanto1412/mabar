const handleLogin = async (credentials) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Token saved to localStorage');
        // Redirect to dashboard or update state
      } else {
        console.error('No token received from server');
      }
    } else {
      // Handle login error
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};