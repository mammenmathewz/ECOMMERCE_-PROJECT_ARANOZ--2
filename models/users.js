const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
    },
    address1:{
        type: String,
        required: true
    },
    address2:{
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pin: {
        type: Number,
        required: true
    },
    
});
const transactionSchema = new mongoose.Schema({
    orderId:{
      type:String
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  });
  

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
    block: {
        type: Boolean,
        required: true,
        default: false
    },
    wallet:{
        type:Number,
        default:0
    
    },
    address: [addressSchema],
    transactions: [transactionSchema],
});

userSchema.index({ 'address.first_name': 'text', 'address.last_name': 'text', email: 'text', phone: 'text' });

module.exports = {
    User: mongoose.model("User", userSchema),
    Address: addressSchema
};

