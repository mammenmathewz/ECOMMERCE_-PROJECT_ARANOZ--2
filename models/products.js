const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true
    },
    productname: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
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
    createdon: {
        type: Date,
        required: true
    },
  
    images: [String]
});

module.exports = mongoose.model("product", productSchema);
