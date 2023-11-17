/**
 * TODO: 8.4 Register new user
 *       - Handle registration form submission
 *       - Prevent registration when password and passwordConfirmation do not match
 *       - Use createNotification() function from utils.js to show user messages of
 *       - error conditions and successful registration
 *       - Reset the form back to empty after successful registration
 *       - Use postOrPutJSON() function from utils.js to send your data back to server
 */
const submitButton = document.querySelector('#btnRegister');
const form = document.getElementById('register-form');
submitButton.addEventListener('click', async (event) => {
    event.preventDefault();

    let formData = new FormData(form);
    let password = formData.get('password');
    let passwordConfirmation = formData.get('passwordConfirmation');
    if (password !== passwordConfirmation){
        createNotification('Passwords do not match', 'notifications-container', false);
    }
    else {
        data = {};
        formData.forEach((value, key) => (data[key] = value));
        try {
            postOrPutJSON('/api/register', 'POST', data);
            createNotification('Registration successful', 'notifications-container', true);
        }
        catch (err) {
            console.error(err);
            createNotification('Registration fail', 'notifications-container', false);
        }
    }
    form.reset()
})


