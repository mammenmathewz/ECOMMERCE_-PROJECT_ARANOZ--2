const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
  user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
  },
  items: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product'
     },
    quantity: { 
      type: Number, 
      default: 1
    },
    date: {
      type: Date,
      default: Date.now,
    },  
  }],
  total: { 
      type: Number, 
      default: 0
    },
  discount:{
    type:Number,
    default:0
  },
  discountAppliedAt: Date,
  grandTotal:{
    type:Number,
    default:0
  },
  couponCode:{
    type:String,
    default:null
  },
  walletAmount:{
    type:Number,
    default:0
  }
 
});

module.exports = mongoose.model('Cart',cartSchema);
