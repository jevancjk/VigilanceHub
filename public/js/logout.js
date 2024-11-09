document.getElementById('logoutUser').addEventListener('click', function(event) {
    axios.post('http://127.0.0.1:3000/logout', {}, { withCredentials: true })
        .then(response => {
            if (response.data.success) {
                localStorage.removeItem('username');
                localStorage.removeItem('userID');
                localStorage.removeItem('score');
                setTimeout(() => {
                    window.location.href = "../../misc_html/logout.html";
                }, 1000);
            } else {
                console.error('Logout failed:', response.data.message);
            }
        })
        .catch(error => {
            console.error('Error during logout:', error);
        });
});
