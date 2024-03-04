const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
   
    code: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
  
    },
    min_amount: {
        type: Number,
    },
    max_discount: {
        type: Number,
    },
    startDate:{
        type:Date,
        
       },
    expiry_date: {
        type: Date,
    },
    display_home:{
        type:Boolean,
        default:false
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
    ],

    is_deleted: { type: Boolean, default: false }

});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon

