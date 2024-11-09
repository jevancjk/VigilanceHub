document.addEventListener('DOMContentLoaded', function () {
    // forgot_password.html
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;

            try {
                const response = await axios.post('http://127.0.0.1:3000/forgot-password', { email });

                if (response.data.success) {
                    document.getElementById('emailSentMsg').textContent = response.data.message;
                    document.getElementById('emailSentMsg').style.visibility = 'visible';
                } else {
                    alert(response.data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to send password reset email. Please try again later.');
            }
        });
    }

    // reset_password.html
    const confirmResetBtn = document.getElementById('confirmResetBtn');
    const gotoLoginBtn = document.getElementById('gotoLoginBtn');
    const passwordStatus = document.getElementById('passwordStatus');

    if (confirmResetBtn && passwordStatus) {
        confirmResetBtn.addEventListener('click', async () => {
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            passwordStatus.style.visibility = "visible";
            passwordStatus.style.color = "red";

            if (!validatePassword(newPassword)) {
                passwordStatus.textContent = "Password does not meet requirements.";
                return;
            } else if (newPassword !== confirmNewPassword) {
                passwordStatus.textContent = 'Passwords do not match';
                passwordStatus.style.visibility = 'visible';
                return;
            }

            confirmResetBtn.style.display = 'none';
            gotoLoginBtn.style.visibility = 'visible';
            
            try {
                const token = window.location.href.split('token=').pop();
                const response = await axios.post(`http://127.0.0.1:3000/reset-password/${token}`, { newPassword });

                if (response.data.success) {
                    passwordStatus.textContent = 'You have successfully reset your password! Please log in.';
                    passwordStatus.style.color = '#3BE825';
                }
            } catch (error) {
                if (error.response && error.response.status === 400 && error.response.data.message === 'Reset link expired.') {
                    passwordStatus.textContent = "Sorry, the link has expired! Please go back to Login Page to get a new reset link.";
                } else {
                    passwordStatus.textContent = 'Failed to reset password. Please try again later.';
                }
            }
        });

        gotoLoginBtn.addEventListener('click', () => {
            window.location.href = '../public/html/login.html';
        });
    }

    function validatePassword(pw) {
        // the regex value checks for at least 1 lowercase, 1 uppercase, 1 digit, 1 special character and min. 8 characters
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
        return regex.test(pw);
    }
});
