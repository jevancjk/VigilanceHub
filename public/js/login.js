document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const credential = document.getElementById("credential");
    const password = document.getElementById("password");
    const loginStatus = document.getElementById("loginStatus");

    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        loginStatus.style.visibility = "hidden";
        loginStatus.textContent = "";

        const userData = {
            credential: credential.value,
            password: password.value
        };

        // axios POST request to server
        axios.post('http://127.0.0.1:3000/login', userData, { withCredentials: true })
            .then(response => {
                if (response.data.success) {

                    localStorage.setItem('username', response.data.username);
                    localStorage.setItem('userID', response.data.userID);
                    
                    loginStatus.textContent = "Login success";
                    loginStatus.style.color = "#3BE825";
                    setTimeout(() => {
                        window.location.href = "/auth_pages/index_userLogin.html";
                    }, 1000);
                } else {
                    // Display specific message depending on either incorrect username/password or unconfirmed email
                    loginStatus.textContent = response.data.message;
                    loginStatus.style.color = "red";
                }
                loginStatus.style.visibility = "visible";
            })
            .catch(error => {
                console.error('Error:', error);
                loginStatus.textContent = "Failed to login due to server error.";
                loginStatus.style.color = "red";
                loginStatus.style.visibility = "visible";
            });
    });
});
