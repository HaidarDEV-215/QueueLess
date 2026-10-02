const User = require('../models/user.model.js');
const bcryptjs = require('bcryptjs');
const createJWT = require('../utils/createJWT.js');
const AppError = require('../utils/appError.js');

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
    const token = await createJWT({id:newUser._id, email, phone, role: newUser.role });
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
    const token = await createJWT({id:user._id, email, phone: user.phone, role: user.role });
    return token;
}

module.exports = { register , login }