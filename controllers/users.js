const responseUtils = require('../utils/responseUtils');
const http = require('http');
const User = require('../models/user');

/**
 * Send all users as JSON
 *
 * @param {http.ServerResponse} response - Response object to send all users
 * @returns {object} - All users
 */
const getAllUsers = async response => {
  const allUsers = await User.find({});
  return responseUtils.sendJson(response, allUsers);
};

/**
 * Delete user and send deleted user as JSON
 *
 * @param {http.ServerResponse} response - Response object from the route
 * @param {string} userId - User ID
 * @param {object} currentUser - Mongoose document object for the current user
 * @returns {object} - Deleted user
 */
const deleteUser = async(response, userId, currentUser) => {
  const deletedUser = await User.findOne({ _id: userId });
  if (!deletedUser) {
    return responseUtils.notFound(response);
  }
  if (deletedUser._id.toString() === currentUser._id.toString()) {
    return responseUtils.badRequest(response, 'You cannot delete yourself');
  }
  await User.deleteOne({ _id: userId });
  return responseUtils.sendJson(response, deletedUser);
};

/**
 * Update user and send updated user as JSON
 *
 * @param {http.ServerResponse} response - Response object from the route
 * @param {string} userId - User ID
 * @param {object} currentUser - Mongoose document object for the current user
 * @param {object} userData - JSON data from the request body
 * @returns {object} - Updated user
 */
const updateUser = async(response, userId, currentUser, userData) => {
  if (userId === currentUser.id) {
    return responseUtils.badRequest(response, 'Updating own data is not allowed');
  }
  if (!userData.role){
    return responseUtils.badRequest(response, 'Role is missing');
  }
  if (userData.role !== 'admin' && userData.role !== 'customer'){
    return responseUtils.badRequest(response, 'Role is invalid');
  }
  const updatedUser = await User.findById(userId).exec();
  if (!updatedUser) {
    return responseUtils.notFound(response);
  }
  updatedUser.role = userData.role;
  await updatedUser.save();
  return responseUtils.sendJson(response, updatedUser);
};

/**
 * Send user data as JSON
 *
 * @param {http.ServerResponse} response - Response object from the route
 * @param {string} userId - User ID
 * @returns {object} - User data
 */
const viewUser = async(response, userId) => {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    return responseUtils.notFound(response);
  }
  return responseUtils.sendJson(response, user);
};

/**
 * Register new user and send created user back as JSON
 *
 * @param {http.ServerResponse} response - Response object from the route
 * @param {object} userData - JSON data from the request body
 * @returns {object} - Created user
 */
const registerUser = async(response, userData) => {
  const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  const regex = new RegExp(pattern);
  if (!regex.test(userData.email)){
    return responseUtils.badRequest(response, "Email not valid");
  }
  const foundUser = await User.findOne({ email: userData.email }).exec();
  if (foundUser){
    return responseUtils.badRequest(response, "Email is already in use");
  }
  if (!userData.name || !userData.email || !userData.password) {
    return responseUtils.badRequest(response, 'Name, email and password are required');
  }
  if (userData.password.length < 10){
    return responseUtils.badRequest(response, 'Password must be at least 10 characters');
  }
  
  userData.role = 'customer';
  const newUser = await new User(userData);
  await newUser.save().then(() => responseUtils.createdResource(response, newUser));
};

module.exports = { getAllUsers, registerUser, deleteUser, viewUser, updateUser };
