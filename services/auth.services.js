const User = require('../models/user.model.js');
const Otp = require('../models/otp.model.js');
const bcryptjs = require('bcryptjs');
const createJWT = require('../utils/createJWT.js');
const AppError = require('../utils/appError.js');
const crypto = require('crypto');
const emailService = require('../utils/emailService.js');
const emailTemplates = require('../utils/emailsTemplates.js');

const register = async (firstName, lastName, password, email, phone) => {
    const user = await User.findOne({ email });
    if (user) {
        throw new AppError("user with this email is already exist", 400, "fail");
    }
    const data = {
        firstName,
        lastName,
        email,
        password: await bcryptjs.hash(password, 10),
        phone,
        role: "normalUser"
    }
    const newUser = new User(data);
    const token = await createJWT({ id: newUser._id, email, phone, role: newUser.role, purpose: 'authentication' });
    await newUser.save();
    return token;
}

const login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError("email or password is not matched", 400, "fail");
    }
    const isCorrectPassword = await bcryptjs.compare(password, user.password);
    if (!isCorrectPassword) {
        throw new AppError("email or password is not matched", 400, "fail");
    }
    const token = await createJWT({ id: user._id, email, phone: user.phone, role: user.role, purpose: 'authentication' });
    return token;
}

const forgetPassword = async (email) => {
    const existUser = await User.findOne({ email });
    if (!existUser) {
        throw new AppError("an error accured!", 400, "fail");
    }
    await Otp.deleteMany({ email: existUser.email });
    const otpCode = await crypto.randomInt(100000, 999999);
    const sendingEmail = await emailService(email, 'account verification', emailTemplates.emailVerificationTemplate(otpCode))
        .catch((error) => {
            console.error(error);
        });
    if (!sendingEmail) {
        throw new AppError('cannot send email', 500, 'error');
    }
    const incodedOtp = await bcryptjs.hash(otpCode.toString(), 5);

    await Otp.create({
        user: existUser._id,
        email: email,
        code: incodedOtp,
        expiresAt: Date.now() + 1000 * 60 * 5 //expire in five minutes
    });
    return;
}

const confirmOTP = async (otp, email) => {
    const existOtp = await Otp.findOneAndDelete({ email });

    if (!existOtp) {
        throw new AppError('an error auucred', 400, 'error');
    }
    const matchedOtp = await bcryptjs.compare(otp, existOtp.code);
    if (!matchedOtp) {
        throw new AppError('an error auucred', 400, 'error');
    }
    const token = await createJWT({ email: email, purpose: 'password changing' }, '10min');
    return token;
}

const changePassword = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('user not found!', 404, 'fail');
    }
    const hashedPassword = await bcryptjs.hash(password, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    return;
}

module.exports = { register, login, forgetPassword, confirmOTP, changePassword }