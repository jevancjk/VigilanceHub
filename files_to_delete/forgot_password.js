document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
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
