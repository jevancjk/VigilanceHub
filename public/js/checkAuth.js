document.addEventListener('DOMContentLoaded', () => {
    axios.get('http://127.0.0.1:3000/checkAuth', { withCredentials: true })
        .then(response => {
            console.log('Response data:', response.data);
            console.log('Response status:', response.status);
            if (response.status === 200 && response.data.authenticated) {
                console.log('User is authenticated');
            } else {
                throw new Error('Unauthorized');
            }
        })
        .catch(error => {
            console.error('Error checking authentication:', error);
            window.location.href = '/misc_html/401.html';
        });
    });
