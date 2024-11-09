document.addEventListener("DOMContentLoaded", function () {
    const checkPassword = document.getElementById('checkPassword');
    const currentPasswordInput = document.getElementById('currentPassword');
    const enterCurrentPasswordBtn = document.getElementById('enterCurrentPassword');
    const editableFields = document.getElementById('editableFields');
    const passwordError = document.getElementById('passwordError');
    const avatarContainer = document.querySelectorAll('.choose-avatar img, .default-icon');
    const chooseAvatarInput = document.getElementById('chooseAvatar');
    
    editableFields.style.display = 'none';

    // Fetch the user's current profile details on load (including avatar)
    axios.get('http://127.0.0.1:3000/profile', { withCredentials: true })
        .then(response => {
            const avatar = response.data.avatar || 'default.png';
            chooseAvatarInput.value = avatar;

            avatarContainer.forEach(img => {
                if (img.dataset.avatar === avatar) {
                    img.classList.add('selected');
                }
            });
        })
        .catch(error => {
            console.error("Error fetching profile:", error);
        });

    // Avatar selection logic
    avatarContainer.forEach(img => {
        img.addEventListener('click', function () {
            // If the clicked avatar is already selected, unselect it
            if (img.classList.contains('selected')) {
                img.classList.remove('selected');
                chooseAvatarInput.value = ''; // Clear input
            } else {
                // Remove 'selected' class from all avatars first
                avatarContainer.forEach(item => item.classList.remove('selected'));
                
                // Add 'selected' class to the clicked avatar
                img.classList.add('selected');
                chooseAvatarInput.value = img.dataset.avatar; // Set the input value to the selected avatar path
            }
        });
    });

    enterCurrentPasswordBtn.addEventListener('click', function () {
        const currentPassword = currentPasswordInput.value;

        // Send the old password to the server for validation
        axios.post('http://127.0.0.1:3000/check-password', { currentPassword }, { withCredentials: true })
            .then(response => {
                // If the password is correct, show the remaining fields
                if (response.data.success) {
                    editableFields.style.display = "block";
                    checkPassword.style.display = "none";
                } else {
                    passwordError.textContent = "Incorrect password";
                }
            })
            .catch(error => {
                console.error("Error verifying current password:", error);
                passwordError.textContent = "Incorrect password";
            });
    });

    // Edit profile submission logic
    const editProfileForm = document.getElementById('editProfileForm');
    editProfileForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const currentPassword = currentPasswordInput.value;
        const username = localStorage.getItem('username');
        const newUsername = document.getElementById('newUsername').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        const chooseAvatar = chooseAvatarInput.value;

        if (newPassword && newPassword !== confirmNewPassword) {
            alert("New passwords do not match.");
            return;
        }

        const formData = {
            username,
            newUsername: newUsername || null,
            currentPassword: currentPassword || null,
            newPassword: newPassword || null,
            avatar: chooseAvatar
        };

        axios.post('http://127.0.0.1:3000/edit-profile', formData, { withCredentials: true })
            .then(response => {
                alert('Profile updated successfully. To ensure your particulars are updated, please logout and re-login with your new credentials (if any).');
                // update avatar in profile.html
                const profilePic = document.querySelector('.profile-pic');
                if (profilePic){
                    profilePic.style.backgroundImage = `url(${chooseAvatar})`;  // Set the new avatar path
                    profilePic.style.backgroundSize = 'cover'; 
                    profilePic.style.backgroundPosition = 'center';
                }
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                alert('Error updating profile. Please try again.');
            });
    });
    const deleteAccLink = document.getElementById('deleteAccLink');
        deleteAccLink.addEventListener('click', function () {
            const confirmation = confirm("Are you sure you want to delete your account?\nThis action cannot be undone!");
    
            if (confirmation) {
                axios.post('http://127.0.0.1:3000/delete-account', {}, { withCredentials: true })
                    .then(response => {
                        if (response.data.success) {
                            alert('Your account has been deleted successfully.\nWe are sad to see you go :(');
                            // window.location.href = '/public/html/index_home.html';
                            window.location.href = '/public/index.html';
                        } else {
                            alert('Error deleting account. Please try again.');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting account:', error);
                        alert('Error deleting account. Please try again.');
                    });
            }
        });
});
