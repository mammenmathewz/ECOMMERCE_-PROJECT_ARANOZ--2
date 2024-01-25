const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' },
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
        defualt: Date.now(),
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
    grandTotal:{
      type:Number,
      default:0
  },
  is_delivered: {
    type: Boolean,
    default: false,
  },
  user_cancelled: {
    type: Boolean,
    default: false,
  },
  admin_cancelled: {
    type: Boolean,
    default: false,
  },
  return_reason: {
    type: String,
  },
  is_returned: {
    type: Boolean,
    default: false,
  },
  
  paymentType: {
    type: String,
  },
  paymentStatus: {
    type:String
},
orderStatus: {
  type:String
},
  });

  module.exports = mongoose.model('Order',orderSchema)