const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    first_name:{
        type:String,
        required:true
    },
    last_name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    created:{
        type:Date,
        required:true,
        default:Date.now
    },
    block:{
        type:Boolean,
        required:true,
        default: false
    },

    address:{
        address1:{
            type:String,
            required:true
        },
        address2:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        district:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        },
    },

})
userSchema.index({ first_name: 'text', last_name:"text", email: 'text', phone: 'text', });


module.exports=mongoose.model("user",userSchema)