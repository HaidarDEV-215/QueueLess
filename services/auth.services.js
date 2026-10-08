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
    const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: await bcryptjs.hash(password, 10),
        phone,
        role: "normalUser",
        isConfirmed: false
    });
    await Otp.deleteMany({ email: newUser.email });
    const otpCode = await crypto.randomInt(100000, 999999);
    const sendingEmail = await emailService(
        email, 
        'account verification', 
        emailTemplates.emailVerificationTemplate(`${firstName} ${lastName}`,otpCode))
        .catch((error) => {
            console.error(error);
        });
    if (!sendingEmail) {
        throw new AppError('cannot send email', 500, 'error');
    }
    const incodedOtp = await bcryptjs.hash(otpCode.toString(),5);
    const newOtp = await Otp.create({
        user: newUser._id,
        email: email,
        code: incodedOtp,
        expiresAt: Date.now() + 1000 * 60 * 10
    })
    const token = await createJWT({
        id: newUser._id,
        email,
        phone,
        role: newUser.role,
        purpose: 'confirm_account',
        isConfirmed: newUser.isConfirmed }
        , "10min");
    return token;
}

const confirmAccount = async (email, id, code) => {
    const thisUser = await User.findOne({ _id: id, email });
    if (!thisUser) {
        throw new AppError("user is not found", 404, "fail");
    }
    const existOtp = await Otp.findOne({ email, user: thisUser._id })
    if (!existOtp) {
        throw new AppError("an error accured!", 400, "fail");
    }
    const matchedOtp = await bcryptjs.compare(code, existOtp.code);
    if (!matchedOtp) {
        throw new AppError("an error accured!", 400, "fail");
    }
    await Otp.deleteMany({ email, user: thisUser._id });
    const updatedUserConfirmation = await User.findOneAndUpdate(
        {
            _id: id,
            email,
            isConfirmed: false// to avoid execute this request more than one time
        }, {
        $set: { isConfirmed: true },
        $unset: { pendingExpiresAt: "" }
    }, {
        returnDocument: 'after'
    });
    if (!updatedUserConfirmation) {
        throw new AppError("account already confirmed!", 400, "fail");
    }
    const token = await createJWT({
        id: updatedUserConfirmation._id,
        email,
        phone: updatedUserConfirmation.phone,
        role: updatedUserConfirmation.role,
        purpose: 'authentication',
        isConfirmed: updatedUserConfirmation.isConfirmed
    });
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
    const token = await createJWT({
        id: user._id,
        email,
        phone: user.phone,
        role: user.role,
        purpose: 'authentication',
        isConfirmed: user.isConfirmed
    });
    return token;
}

const forgetPassword = async (email) => {
    const existUser = await User.findOne({ email });
    if (!existUser) {
        throw new AppError("an error accured!", 400, "fail");
    }
    await Otp.deleteMany({ email: existUser.email });
    const otpCode = await crypto.randomInt(100000, 999999);
    const sendingEmail = await emailService(
        email,
        'account verification', 
        emailTemplates.emailVerificationTemplate(`${firstName} ${lastName}`,otpCode))
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
    const existOtp = await Otp.findOne({ email });

    if (!existOtp) {
        throw new AppError('an error auucred', 400, 'error');
    }
    const matchedOtp = await bcryptjs.compare(otp, existOtp.code);
    if (!matchedOtp) {
        throw new AppError('an error auucred', 400, 'error');
    }
    await Otp.deleteMany({ email, });
    const token = await createJWT({ email: email, purpose: 'password_changing' }, '10min');
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

module.exports = { register, confirmAccount, login, forgetPassword, confirmOTP, changePassword }