const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
   
    code: {
        type: String,
        required: true
    },
    discount_type: {
        type: String,
        required: true,
        enum: ['amount', 'percentage']  // 'amount' for Minimum Discount Amount, 'percentage' for Percentage of Offer
    },
    discount_value: {
        type: Number,
        default:0
    },
    min_amount: {
        type: Number,
        default:0
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

module.exports = Coupon;