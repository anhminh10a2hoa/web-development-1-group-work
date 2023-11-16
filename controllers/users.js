const responseUtils = require('../utils/responseUtils');
const http = require('http');
const User = require('../models/user');

/**
 * Get all users and send as JSON
 *
 * @param {http.ServerResponse} response - Response to the UI
 * @returns {object} - All users as JSON
 */
const getAllUsers = async (response) => {
  const allUsers = await User.find({});
  return responseUtils.sendJson(response, allUsers);
};

/**
 * Delete a user and send the deleted user as JSON
 *
 * @param {http.ServerResponse} response - Response from the route
 * @param {string} userId - User ID
 * @param {object} currentUser - Mongoose document object
 * @returns {object} - Deleted user as JSON
 */
const deleteUser = async (response, userId, currentUser) => {
  const deletedUser = await User.findOne({ _id: userId });

  // Check if the user to be deleted exists
  if (!deletedUser) {
    return responseUtils.notFound(response);
  }

  // Check if the user is trying to delete themselves
  if (deletedUser._id.toString() === currentUser._id.toString()) {
    return responseUtils.badRequest(response, 'You cannot delete yourself');
  }

  await User.deleteOne({ _id: userId });
  return responseUtils.sendJson(response, deletedUser);
};

/**
 * Update a user and send the updated user as JSON
 *
 * @param {http.ServerResponse} response - Response from the route
 * @param {string} userId - User ID
 * @param {object} currentUser - Mongoose document object
 * @param {object} userData - JSON data from the request body
 * @returns {object} - Updated user as JSON
 */
const updateUser = async (response, userId, currentUser, userData) => {
  // Check if the user is trying to update themselves
  if (userId === currentUser.id) {
    return responseUtils.badRequest(response, 'Updating own data is not allowed');
  }

  // Validate the role
  if (!userData.role || (userData.role !== 'admin' && userData.role !== 'customer')) {
    return responseUtils.badRequest(response, 'Role is missing or invalid');
  }

  const updatedUser = await User.findById(userId).exec();

  // Check if the user to be updated exists
  if (!updatedUser) {
    return responseUtils.notFound(response);
  }

  updatedUser.role = userData.role;
  await updatedUser.save();
  return responseUtils.sendJson(response, updatedUser);
};

/**
 * Get user data and send as JSON
 *
 * @param {http.ServerResponse} response - Response from the route
 * @param {string} userId - User ID
 * @param {object} currentUser - Mongoose document object
 * @returns {object} - User data as JSON
 */
const viewUser = async (response, userId, currentUser) => {
  const user = await User.findOne({ _id: userId });

  // Check if the user exists
  if (!user) {
    return responseUtils.notFound(response);
  }

  return responseUtils.sendJson(response, user);
};

/**
 * Register a new user and send the created user as JSON
 *
 * @param {http.ServerResponse} response - Response from the route
 * @param {object} userData - JSON data from the request body
 * @returns {object} - Created user as JSON
 */
const registerUser = async (response, userData) => {
  const emailPattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  const emailRegex = new RegExp(emailPattern);

  // Validate email format
  if (!emailRegex.test(userData.email)) {
    return responseUtils.badRequest(response, 'Email not valid');
  }

  const existingUser = await User.findOne({ email: userData.email }).exec();

  // Check if the email is already in use
  if (existingUser) {
    return responseUtils.badRequest(response, 'Email is already in use');
  }

  // Validate required fields
  if (!userData.name || !userData.email || !userData.password) {
    return responseUtils.badRequest(response, 'Name, email, and password are required');
  }

  // Validate password length
  if (userData.password.length < 10) {
    return responseUtils.badRequest(response, 'Password must be at least 10 characters');
  }

  // Set default role
  userData.role = 'customer';

  const newUser = new User(userData);
  await newUser.save().then(() => responseUtils.createdResource(response, newUser));
};

module.exports = { getAllUsers, registerUser, deleteUser, viewUser, updateUser };
