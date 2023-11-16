const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema ({
  product: {
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
    description: {
      type: String
    }
  },
  quality: {
    type: Number,
    min: 1
  }
});


const orderSchema = new Schema({
  customerId: {
    type: String,
    required: true,
    format: mongoose.mongo.ObjectId
  },

  items: {
    type: [],
    required: true,
    minLength: 1,
    items: [orderItemSchema],
  },
});

orderSchema.set('toJson', { virtuals: false, versionKey: false});

const Order = new mongoose.model('Order', orderSchema);
module.exports = Order;