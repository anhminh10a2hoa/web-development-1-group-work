const mongoose = require('mongoose');

/**
 * Get database connect URL.
 *
 * Returns the MongoDB connection URL from DBURL environment variable,
 * or if the environment variable is not defined, return the default URL
 * mongodb://localhost:27017/WebShopDb
 *
 * @returns {string} connection URL
 */
const getDbUrl = () => {
  // TODO: 9.4 Implement this
  // Read the MongoDB connection URL from the environment variable
  const dbUrl = process.env.DBURL;

  // If DBURL is not defined, return the default URL
  if (!dbUrl) {
    return 'mongodb://localhost:27017/WebShopDb';
  }

  return dbUrl;
};

/**
 * Connect to database function.
 */
function connectDB() {
  // Do nothing if already connected
  if (!mongoose.connection || mongoose.connection.readyState === 0) {
    mongoose
      .connect(getDbUrl(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
        autoIndex: true,
        family: 4
      })
      .then(() => {
        mongoose.connection.on('error', err => {
          console.error(err);
        });

        mongoose.connection.on('reconnectFailed', handleCriticalError);
      })
      .catch(handleCriticalError);
  }
}

/**
 * Handle critical error function.
 * 
 * @param {*} err error
 */
function handleCriticalError(err) {
  console.error(err);
  throw err;
}

/**
 * Disconnect from database function.
 */
function disconnectDB() {
  mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB, getDbUrl };