const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    format: Float64Array,
    min: 0
  },
  image: {
    type: String,
    format: decodeURI
  },
  description: {
    type: String
  }
});

productSchema.set('toJSON', { virtuals: false, versionKey: false});

const Product = new mongoose.model('Product', productSchema);
module.exports = Product; 