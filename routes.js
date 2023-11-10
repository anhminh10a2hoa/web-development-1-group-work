const responseUtils = require('./utils/responseUtils');
const { acceptsJson, isJson, parseBodyJson, getCredentials } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
// Import the User model from models/user.js
const { User } = require('./models/user');

/**
 * Known API routes and their allowed methods
 *
 * Used to check allowed methods and also to send the correct header value
 * in response to an OPTIONS request by sendOptions() (Access-Control-Allow-Methods)
 */
const allowedMethods = {
    '/api/register': ['POST'],
    '/api/users': ['GET'],
    '/api/products': ['GET'],
};

/**
 * Send a response to a client OPTIONS request.
 *
 * @param {string} filePath pathname of the request URL
 * @param {http.ServerResponse} response
 */
const sendOptions = (filePath, response) => {
    if (filePath in allowedMethods) {
        response.writeHead(204, {
            'Access-Control-Allow-Methods': allowedMethods[filePath].join(','),
            'Access-Control-Allow-Headers': 'Content-Type,Accept',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Expose-Headers': 'Content-Type,Accept',
        });
        return response.end();
    }

    return responseUtils.notFound(response);
};

// eslint-disable-next-line max-lines-per-function, complexity
const handleRequest = async (request, response) => {
    const { url, method, headers } = request;
    const filePath = new URL(url, `http://${headers.host}`).pathname;

    // Serve static files from public/ and return immediately
    if (method.toUpperCase() === 'GET' && !filePath.startsWith('/api')) {
        const fileName = filePath === '/' || filePath === '' ? 'index.html' : filePath;
        return renderPublic(fileName, response);
    }

    if (method.toUpperCase() === 'OPTIONS') return sendOptions(filePath, response);

    // Require a correct accept header (require 'application/json' or '*/*')
    if (!acceptsJson(request)) {
        return responseUtils.contentTypeNotAcceptable(response);
    }

    // Check for allowable methods
    if (!(filePath in allowedMethods) || !allowedMethods[filePath].includes(method.toUpperCase())) {
        return responseUtils.methodNotAllowed(response);
    }

    // Handle unknown routes with a 404 response
    if (!(filePath in allowedMethods)) {
        return responseUtils.notFound(response);
    }

    // GET all users
    if (filePath === '/api/users' && method.toUpperCase() === 'GET') {
        const userCredentials = getCredentials(request);
        if (!userCredentials) {
            return responseUtils.basicAuthChallenge(response);
        }

        const loggedInUser = await User.findOne({ email: userCredentials[0] });
        if (!loggedInUser || !(await loggedInUser.checkPassword(userCredentials[1]))) {
            return responseUtils.basicAuthChallenge(response);
        } else if (loggedInUser.role === 'customer') {
            return responseUtils.forbidden(response);
        }

        // Use the User model to get all users
        const users = await User.find();
        return responseUtils.sendJson(response, users);
    }

    // Register a new user
    if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
        // Fail if not a JSON request, don't allow non-JSON Content-Type
        if (!isJson(request)) {
            return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
        }

        // Parse the JSON body
        let newUser;
        try {
            newUser = await parseBodyJson(request);

            // Validate the new user
            if (!newUser || !(newUser.name && newUser.email && newUser.password)) {
                throw new Error('Invalid or missing user data');
            }

            // Set a default role if missing
            newUser.role = newUser.role || 'customer';
        } catch (error) {
            // Handle JSON parse error
            return responseUtils.badRequest(response, error.message || 'Invalid JSON in the request body');
        }

        // Create a new user using the User model
        const createdUser = new User(newUser);

        try {
            // Save the new user to the database
            await createdUser.save();
            
            // Respond with '201 Created' and the created user details
            responseUtils.createdResource(response, createdUser);

            // Set user role to "customer"
            createdUser.role = 'customer';
            await createdUser.save();
        } catch (error) {
            return responseUtils.serverError(response, 'Error creating user');
        }
    }

    // Find one user with an email "email@email.com"
    const emailUser = await User.findOne({ email: "email@email.com" }).exec();

    // Find a user by userId
    const userId = "put_user_id_here"; // Replace with an actual user ID
    const idUser = await User.findById(userId).exec();

    // Checking user's password by using the checkPassword() method that was implemented in 9.5
    const password = "$up3r$ecre+";
    const user = await User.findById(userId).exec();
    const isPasswordCorrect = await user.checkPassword(password);

    isPasswordCorrect ? console.log("password correct") : console.log("password NOT correct");

    // Update an existing user
    const existingUser = await User.findById(userId).exec();

    // Change user's name and save changes
    existingUser.name = "My New Name";
    await existingUser.save();

    // Delete an existing user
    await User.deleteOne({ _id: userId });

    if (filePath === '/api/products' && method.toUpperCase() === 'GET') {
        const userCredentials = getCredentials(request);
        if (!userCredentials) {
            return responseUtils.basicAuthChallenge(response);
        }

        const loggedInUser = await User.findOne({ email: userCredentials[0] });
        if (!loggedInUser || !(await loggedInUser.checkPassword(userCredentials[1]))) {
            return responseUtils.basicAuthChallenge(response);
        }

        // Use the appropriate logic to get all products (you might have your own implementation)
        const products = await getAllProducts();
        return responseUtils.sendJson(response, products);
    }

    // Default to 404 Not Found if unknown URL
    if (!(filePath in allowedMethods)) return responseUtils.notFound(response);

    // Check for allowable methods
    if (!allowedMethods[filePath].includes(method.toUpperCase())) {
        return responseUtils.methodNotAllowed(response);
    }
};

module.exports = { handleRequest };