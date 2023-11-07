const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SALT_ROUNDS = 10;

const SCHEMA_DEFAULTS = {
  name: {
    minLength: 1,
    maxLength: 50,
  },
  email: {
    match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
  },
  password: {
    minLength: 10,
  },
  role: {
    values: ['admin', 'customer'],
    defaultValue: 'customer',
  },
};

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: SCHEMA_DEFAULTS.name.minLength,
    maxlength: SCHEMA_DEFAULTS.name.maxLength,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: SCHEMA_DEFAULTS.email.match,
  },
  password: {
    type: String,
    required: true,
    minlength: SCHEMA_DEFAULTS.password.minLength,
    set: (password) => {
      if (!password) return password;
      if (password.length < SCHEMA_DEFAULTS.password.minLength) return password;
      return bcrypt.hashSync(password, SALT_ROUNDS);
    },
  },
  role: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    enum: SCHEMA_DEFAULTS.role.values,
    default: SCHEMA_DEFAULTS.role.defaultValue,
  },
});

userSchema.methods.checkPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.set('toJSON', { virtuals: false, versionKey: false });

const User = mongoose.model('User', userSchema);

module.exports = User;
