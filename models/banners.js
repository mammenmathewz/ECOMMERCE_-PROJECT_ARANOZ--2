const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    mainDescription: {
        type: String,
        required: true
    },
    description:{
        type:String,
    },
    image:{
        type:String,
    }
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner

