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
    minLength: SCHEMA_DEFAULTS.password.minLength,
    set: p => {
      if (p.length < 10 || !p) {
        return p;
      }
      return bcrypt.hashSync(p, SALT_ROUNDS);
    }
  },
  role: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    default: SCHEMA_DEFAULTS.role.defaultValue,
    validate: (val) => {
      return val === 'customer' || val === 'admin';
    }
  },
});

userSchema.methods.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.set('toJSON', { virtuals: false, versionKey: false });

const User = mongoose.model('User', userSchema);

module.exports = User;