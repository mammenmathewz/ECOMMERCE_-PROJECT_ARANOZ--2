const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    }, 
    productname: {
        type: String,
        required: true
    },
    description: {
        type: String,
  
    },
    category: {
        type: String,
        required: true
    },
    regularprice: {
        type: Number,
        required: true
    },
    saleprice: {
        type: Number,
        required: true 
    },
    number: {
        type: Number,
        
    },
    createdon: {
        type: Date,
        required: true
    },
  
    images: [String],
    
    deleted:{
        type: Boolean,
        default:false
    }
});

productSchema.index({ productname: 'text', brand: 'text' });


module.exports = mongoose.model("Product", productSchema);
