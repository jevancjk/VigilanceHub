document.addEventListener("DOMContentLoaded", function() {
    const registrationForm = document.getElementById("registrationForm");
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const registerStatus = document.getElementById("registerStatus");

    registrationForm.addEventListener("submit", function(event) {
        event.preventDefault();

        registerStatus.style.visibility = "hidden";
        registerStatus.textContent = "";

        if (!validateUsername(username.value)) {
            registerStatus.textContent = "Username does not meet requirements.";
            registerStatus.style.visibility = "visible";
            registerStatus.style.color = "red";
        } else if (!validatePassword(password.value)) {
            registerStatus.textContent = "Password does not meet requirements.";
            registerStatus.style.visibility = "visible";
            registerStatus.style.color = "red";
        } else if (password.value !== confirmPassword.value) {
            registerStatus.textContent = "Passwords do not match!";
            registerStatus.style.visibility = "visible";
            registerStatus.style.color = "red";
        } else {
            const userData = {
                username: username.value,
                email: email.value,
                password: password.value
            };

            // axios POST request to server
            axios.post('http://127.0.0.1:3000/register', userData)
            .then(response => {
                if (response.data.success) {
                    username.value = '';
                    email.value = '';
                    password.value = '';
                    confirmPassword.value = '';

                    registerStatus.textContent = "Credentials accepted. An email has been sent with a link to confirm your registration. Please click the link within 10 minutes.";
                    registerStatus.style.color = "#3BE825";
                } else {
                    registerStatus.textContent = response.data.message;
                    registerStatus.style.color = "red";
                }
                registerStatus.style.visibility = "visible";
            })
            .catch(error => {
                console.error('Error:', error);
                registerStatus.textContent = "Failed to register due to server error.";
                registerStatus.style.color = "red";
                registerStatus.style.visibility = "visible";
            });
        }
    });
});
