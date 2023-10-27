/**
 * Decode, parse and return user credentials (username and password)
 * from the Authorization header.
 *
 * @param {http.incomingMessage} request
 * @returns {Array|null} array [username, password] from Authorization header, or null if header is missing
 */
const getCredentials = request => {
  // TODO: 8.5 Parse user credentials from the "Authorization" request header
  // NOTE: The header is base64 encoded as required by the http standard.
  //       You need to first decode the header back to its original form ("email:password").
  //  See: https://attacomsian.com/blog/nodejs-base64-encode-decode
  //       https://stackabuse.com/encoding-and-decoding-base64-strings-in-node-js/
  const authHeader = request.headers.authorization;

  if (authHeader) {
    // The Authorization header format is "Basic base64String", so we need to extract the base64String part.
    const base64Credentials = authHeader.split(' ')[1];
    
    // Decode the base64 string to get the original "email:password" string
    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    
    // Split the decoded string into an array of username and password
    const [username, password] = decodedCredentials.split(':');
    
    return [username, password];
  } else {
    return null; // Header is missing
  }
};

/**
 * Does the client accept JSON responses?
 *
 * @param {http.incomingMessage} request
 * @returns {boolean}
 */
const acceptsJson = request => {
  //Check if the client accepts JSON as a response based on "Accept" request header
  // NOTE: "Accept" header format allows several comma separated values simultaneously
  // as in "text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8"
  // Do not rely on the header value containing only single content type!
  const acceptHeader = request.headers.accept || '';
  return acceptHeader.includes('application/json') || acceptHeader.includes('*/*');
};

/**
 * Is the client request content type JSON? Return true if it is.
 *
 * @param {http.incomingMessage} request
 * @returns {boolean}
 */
const isJson = request => {
  // Check whether request "Content-Type" is JSON or not
  const contentTypeHeader = request.headers['content-type'] || '';

  // Check if the Content-Type header includes 'application/json'
  return contentTypeHeader.includes('application/json');
};

/**
 * Asynchronously parse request body to JSON
 *
 * Remember that an async function always returns a Promise which
 * needs to be awaited or handled with then() as in:
 *
 *   const json = await parseBodyJson(request);
 *
 *   -- OR --
 *
 *   parseBodyJson(request).then(json => {
 *     // Do something with the json
 *   })
 *
 * @param {http.IncomingMessage} request
 * @returns {Promise<*>} Promise resolves to JSON content of the body
 */
const parseBodyJson = request => {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('error', err => reject(err));

    request.on('data', chunk => {
      body += chunk.toString();
    });

    request.on('end', () => {
      resolve(JSON.parse(body));
    });
  });
};

module.exports = { acceptsJson, getCredentials, isJson, parseBodyJson };