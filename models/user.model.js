const mongoose = require("mongoose");
const validator = require('validator');

const userModel = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate: [validator.isEmail, "this email is not valid!"]
    },
    role: {
        type:String,
        enum: ['normalUser', 'queueManager', 'admin'],
        default: 'normalUser'
    },
    password: {
        type: String,
        require: true
    },
    phone: {
        type: String,
        require: true
    }
}, {
    timestamps: true
})

userModel.index({ email: 1, phone: 1 }, { unique: true });


module.exports = mongoose.model('User', userModel);