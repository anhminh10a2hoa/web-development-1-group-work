/**
 * TODO: 8.4 Register new user
 *       - Handle registration form submission
 *       - Prevent registration when password and passwordConfirmation do not match
 *       - Use createNotification() function from utils.js to show user messages of
 *       - error conditions and successful registration
 *       - Reset the form back to empty after successful registration
 *       - Use postOrPutJSON() function from utils.js to send your data back to server
 */

// Import necessary functions from utils.js
import { createNotification, postOrPutJSON } from './utils';

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
    createNotification('error', 'Password and Password Confirmation do not match');
    return;
  }

  const user = { name, email, password };

  try {
    // Send user data to the server for registration
    const response = await postOrPutJSON('/api/register', 'POST', user);

    if (response.status === 201) {
      // Registration successful, clear the form
      form.reset();
      createNotification('success', 'Registration successful');
    } else if (response.status === 400) {
      const data = await response.json();
      createNotification('error', data.error);
    } else {
      createNotification('error', 'An error occurred during registration');
    }
  } catch (error) {
    createNotification('error', 'An error occurred during registration');
  }
};

// Attach the handleRegistration function to the form submit event
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', handleRegistration);
}
