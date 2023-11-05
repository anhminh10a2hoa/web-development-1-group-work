// Function to handle registration form submission
const handleRegistration = async (event) => {
  event.preventDefault();

  const form = event.target;
  const name = form.querySelector('#name').value;
  const email = form.querySelector('#email').value;
  const password = form.querySelector('#password').value;
  const passwordConfirmation = form.querySelector('#passwordConfirmation').value;

  // Check if password and password confirmation match
  if (password !== passwordConfirmation) {
    createNotification('Password and Password Confirmation do not match', 'notifications-container');
    return;
  }

  const user = { name, email, password };

  try {
    // Send user data to the server for registration
    const response = await postOrPutJSON('/api/register', 'POST', user);

    if (response.status === 201) {
      // Registration successful, clear the form
      form.reset();
      createNotification('Registration successful', 'notifications-container');
    } else if (response.status === 400) {
      const data = await response.json();
      createNotification(data.error);
    } else {
      createNotification('An error occurred during registration', 'notifications-container');
    }
  } catch (error) {
    createNotification('An error occurred during registration', 'notifications-container');
  }
};

// Attach the handleRegistration function to the form submit event
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', handleRegistration);
}
