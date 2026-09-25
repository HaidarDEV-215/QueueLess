const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        validate: [validator.isEmail(), 'email address is invalid']
    },
    phone: {
        type: String,
        required: true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        default:'normalUser',
        enum :['normalUser','admin','queueManager']
    }
},
    {
        timestamps: true
    }
)


module.exports = mongoose.model('User',userSchema);