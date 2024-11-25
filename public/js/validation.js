function validateUsername(name) {
    // username must be 5-20 characters long and contain no spaces or special characters
    const regex = /^[a-zA-Z0-9_]{5,20}$/;
    return regex.test(name);
}

function validatePassword(pw) {
    // checks for at least 1 lowercase, 1 uppercase, 1 digit, 1 special character and min. 8 characters
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(pw);
}