const responseUtils = require('./utils/responseUtils');
const http = require('http');
const { acceptsJson, isJson, parseBodyJson, getCredentials } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
const { getCurrentUser } = require('./auth/auth');
const User = require('./models/user') ;
const { getAllUsers, registerUser, deleteUser, viewUser, updateUser } = require('./controllers/users');
const { getAllProducts, addNewProduct, getProduct, updateProduct, deleteProduct } = require('./controllers/products');
const { getAllOrdersByAdmin, getOrderByAdmin, addNewOrder, getAllOrdersByCustomer, getOrderByCustomer } = require('./controllers/orders');
/**
 * Known API routes and their allowed methods
 *
 * Used to check allowed methods and also to send correct header value
 * in response to an OPTIONS request by sendOptions() (Access-Control-Allow-Methods)
 */
const allowedMethods = {
  '/api/register': ['POST'],
  '/api/users': ['GET'],
  '/api/products': ['GET', 'POST'],
  '/api/orders': ['GET', 'POST']
};

/**
 * Send response to client options request.
 *
 * @param {string} filePath pathname of the request URL
 * @param {http.ServerResponse} response response to option api
 * @returns {undefined} notFound
 */
const sendOptions = (filePath, response) => {
  if (filePath in allowedMethods) {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': allowedMethods[filePath].join(','),
      'Access-Control-Allow-Headers': 'Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Accept'
    });
    return response.end();
  }

  return responseUtils.notFound(response);
};

/**
 * Does the url have an ID component as its last part? (e.g. /api/users/dsf7844e)
 *
 * @param {string} url filePath
 * @param {string} prefix the api (users, products, orders)
 * @returns {boolean} true if correct form
 */
const matchIdRoute = (url, prefix) => {
  const idPattern = '[0-9a-z]{8,24}';
  const regex = new RegExp(`^(/api)?/${prefix}/${idPattern}$`);
  return regex.test(url);
};

/**
 * Does the URL match /api/users/{id}
 *
 * @param {string} url filePath
 * @returns {boolean} true if api users and have idpattern
 */
const matchUserId = url => {
  return matchIdRoute(url, 'users');
};

const matchProductId = url => {
  return matchIdRoute(url, 'products');
};

const matchOrderId = url => {
  return matchIdRoute(url, 'orders');
};

const handleRequest = async function(request, response) {
  const { url, method, headers } = request;
  const filePath = new URL(url, `http://${headers.host}`).pathname;

  // serve static files from public/ and return immediately
  if (method.toUpperCase() === 'GET' && !filePath.startsWith('/api')) {
    const fileName = filePath === '/' || filePath === '' ? 'index.html' : filePath;
    return renderPublic(fileName, response);
  }
  if (matchUserId(filePath)) {
    // TODO: 8.6 Implement view, update and delete a single user by ID (GET, PUT, DELETE)
    // You can use parseBodyJson(request) from utils/requestUtils.js to parse request body
    // If the HTTP method of a request is OPTIONS you can use 
    // sendOptions(filePath, response) function from this module
    // If there is no currently logged in user, you can use 
    // basicAuthChallenge(response) from /utils/responseUtils.js to ask for credentials
    //  If the current user's role is not admin you can use 
    // forbidden(response) from /utils/responseUtils.js to send a reply
    // Useful methods here include:
    // - getUserById(userId) from /utils/users.js
    // - notFound(response) from  /utils/responseUtils.js 
    // - sendJson(response,  payload)  from  /utils/responseUtils.js can be used to send the requested data in JSON format
    const credentials = getCredentials(request);
    if (credentials !== null){
      const id = filePath.split('/')[3];
      const authorizedUser = await getCurrentUser(request);
      
      if (authorizedUser === null){
          responseUtils.basicAuthChallenge(response);
      }
      
      else if (authorizedUser.role !== 'admin'){
          response.writeHead(403, {'WWW-Authenticate' : 'Basic'});
          response.end();
      }
      else{
        if (!acceptsJson(request)){
          return responseUtils.contentTypeNotAcceptable(response);
        }
        if (method.toUpperCase() === "GET"){ 
          //const singleUser = await User.findOne({ _id: id }).exec();

          return viewUser(response, id, authorizedUser);
        }
        if (method.toUpperCase() === "DELETE"){
          //const deletedUser = await User.findOneAndDelete({_id : id});
          //if (!deletedUser) return responseUtils.notFound(response);
          return deleteUser(response, id, authorizedUser);
        }
        if (method.toUpperCase() === "PUT"){
          const json = await parseBodyJson(request);
          /*if (!json.role){
            return responseUtils.badRequest(response, "Missing role");
          }
          if (json.role !== 'customer' && json.role !== 'admin'){
            return responseUtils.badRequest(response, "Unknown role");
          }
          
          const updatedUser = await User.findOneAndUpdate({_id: id}, {role: json.role}, { new: true });*/
          if(authorizedUser.role === 'admin'){
            return updateUser(response, id, authorizedUser, json);
          }
          
        }
      }
    }
    else{
      responseUtils.basicAuthChallenge(response);
    }
    // throw new Error('Not Implemented');
  }

  if(matchProductId(filePath)){
    /*const auth = request.headers.authorization;
    if (!auth || auth === ''){
      return responseUtils.basicAuthChallenge(response);
    }
    if (Buffer.from(auth.split(" ")[1], 'base64').toString('base64') !== auth.split(" ")[1]){
      return responseUtils.basicAuthChallenge(response);
    }
    const user = await getCurrentUser(request);
    if (user === null){
      return responseUtils.basicAuthChallenge(response);
    }*/

    const credentials = getCredentials(request);
    if(credentials === null){
      return responseUtils.basicAuthChallenge(response);
    }
    const productId = filePath.split('/')[3];
    const user = await getCurrentUser(request);

    if (user === null){
      return responseUtils.basicAuthChallenge(response);
    }
    if (!acceptsJson(request)){
      return responseUtils.contentTypeNotAcceptable(response);
    }    

    if(method.toUpperCase() === 'GET'){
      return getProduct(response, productId);
    }

    if(user.role !== 'admin'){
      return responseUtils.forbidden(response);
    }

    if(method.toUpperCase() === 'PUT'){
      const product = await parseBodyJson(request);
      
      return updateProduct(response, productId, product);  
    }

    if(method.toUpperCase() === 'DELETE'){
      //const product = await parseBodyJson(request);
      return deleteProduct(response, productId);
    }
  }

  if(matchOrderId(filePath) && method === 'GET'){
    /*const auth = request.headers.authorization;
    if(!auth || auth === ''){
      return responseUtils.basicAuthChallenge(response);
    }
    if (Buffer.from(auth.split(" ")[1], 'base64').toString('base64') !== auth.split(" ")[1]){
      return responseUtils.basicAuthChallenge(response);
    }
    const user = await getCurrentUser(request);
    if(user === null){
      return responseUtils.basicAuthChallenge(response);
    }*/

    const credentials = getCredentials(request);
    if(credentials === null){
      return responseUtils.basicAuthChallenge(response);
    }
    const orderId = filePath.split('/')[3];
    const user = await getCurrentUser(request);

    if (user === null){
      return responseUtils.basicAuthChallenge(response);
    }
    if (!acceptsJson(request)){
      return responseUtils.contentTypeNotAcceptable(response);
    }

    if(user.role === 'customer'){
      return getOrderByCustomer(response, user._id, orderId);
    }
    if(user.role === 'admin'){
      return getOrderByAdmin(response, orderId);
    }
  }

  // Default to 404 Not Found if unknown url
  if (!(filePath in allowedMethods)) return responseUtils.notFound(response);

  // See: http://restcookbook.com/HTTP%20Methods/options/
  if (method.toUpperCase() === 'OPTIONS') return sendOptions(filePath, response);

  // Check for allowable methods
  if (!allowedMethods[filePath].includes(method.toUpperCase())) {
    return responseUtils.methodNotAllowed(response);
  }

  // Require a correct accept header (require 'application/json' or '*/*')
  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }

  // GET all users
  if (filePath === '/api/users' && method.toUpperCase() === 'GET') {
    // TODO: 8.5 Add authentication (only allowed to users with role "admin")
    const auth = request.headers.authorization;
    
    if (!auth || auth === ''){
      return responseUtils.basicAuthChallenge(response);
    }
    if (Buffer.from(auth.split(" ")[1], 'base64').toString('base64') !== auth.split(" ")[1]){
      return responseUtils.basicAuthChallenge(response);
    }
    const user = await getCurrentUser(request);
    if (user === null){
      return responseUtils.basicAuthChallenge(response);
    }
    if (user.role === 'customer'){
      return responseUtils.forbidden(response);
    }
    return getAllUsers(response);
  }

  // register new user
  if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
    // Fail if not a JSON request, don't allow non-JSON Content-Type
    if (!request.headers.accept) {
      return responseUtils.contentTypeNotAcceptable(response);
    }

    // TODO: 8.4 Implement registration
    // You can use parseBodyJson(request) method from utils/requestUtils.js to parse request body.
    // Useful methods here include:
    // - validateUser(user) from /utils/users.js 
    // - emailInUse(user.email) from /utils/users.js
    // - badRequest(response, message) from /utils/responseUtils.js
    if (!isJson(request)){
      return responseUtils.badRequest(response);
    }
    const user = await parseBodyJson(request);
    /*const userInUse = await User.findOne({email: user.email}).exec();
    if (!user.email){
      return responseUtils.badRequest(response, 'Email is missing');
    }
    if (userInUse){
      return responseUtils.badRequest(response, 'User already in use');
    }
    if (!user.name){
      return responseUtils.badRequest(response, 'Name is missing');
    }
    if (!user.password){
      return responseUtils.badRequest(response, 'Password is missing');
    }
    // throw new Error('Not Implemented');
    else {
      user.role = 'customer';
      const newUser = new User(user);
      newUser.save();
      return responseUtils.createdResource(response, newUser);
    }*/

    return registerUser(response, user);
  }

  // Products api
  if (filePath === '/api/products' ){
    const auth = request.headers.authorization;
    if (!auth || auth === ''){
      return responseUtils.basicAuthChallenge(response);
    }
    if (Buffer.from(auth.split(" ")[1], 'base64').toString('base64') !== auth.split(" ")[1]){
      return responseUtils.basicAuthChallenge(response);
    }
    const user = await getCurrentUser(request);
    if (user === null){
      return responseUtils.basicAuthChallenge(response);
    }

    if(method.toUpperCase() === 'GET'){
      if (user.role === 'admin' || user.role === 'customer'){
        return getAllProducts(response);
      }
    }

    if(method.toUpperCase() === 'POST'){
      if(user.role !== 'admin' ){
        return responseUtils.forbidden(response);
      }
      if (!isJson(request)){
        return responseUtils.badRequest(response);
      }
      
      const newproduct = await parseBodyJson(request);
      return addNewProduct(response, newproduct);
    }
  }

  // orders api
  if (filePath === '/api/orders'){
    const auth = request.headers.authorization;
    if(!auth || auth === ''){
      return responseUtils.basicAuthChallenge(response);
    }
    if (Buffer.from(auth.split(" ")[1], 'base64').toString('base64') !== auth.split(" ")[1]){
      return responseUtils.basicAuthChallenge(response);
    }
    const user = await getCurrentUser(request);
    if(user === null){
      return responseUtils.basicAuthChallenge(response);
    }
    
    if(method.toUpperCase() === 'GET'){
      if(user.role === 'customer'){
        return getAllOrdersByCustomer(response, user._id);
      }
      else if(user.role === 'admin'){
        return getAllOrdersByAdmin(response);
      }
    }

    if(method.toUpperCase() === 'POST'){
      if(!isJson(request)){
        return responseUtils.badRequest(response);
      }
  
      const order = await parseBodyJson(request);
      if(user.role !== 'customer'){
        return responseUtils.forbidden(response);
      }
      
      return addNewOrder(response, order, user._id);
    }
  }
};

module.exports = { handleRequest };