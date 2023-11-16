const { getCredentials } = require('../utils/requestUtils');
const User = require('../models/user');
const getCurrentUser = async request => {
  const credentials = getCredentials(request);
  if(!credentials){
    return null;
  }
  try{
    const currentUser = await User.findOne({ email: credentials[0] }).exec();
    const passwordCheck = await currentUser.checkPassword(credentials[1]);
    return passwordCheck ? currentUser : null;
  }
  catch(error){
    return null;
  }
};

module.exports = { getCurrentUser };