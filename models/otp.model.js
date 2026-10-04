const mongoose = require('mongoose');
const validator = require('validator');

const otpSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true,
        validate: [validator.isEmail, 'invalid email']
    },
    code: {
        type: String, // because it should be incrypted with bcrypt
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    }
}, { timestamps: true }
);

otpSchema.index({ user: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Otp', otpSchema);