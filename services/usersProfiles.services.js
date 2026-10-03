const User = require('../models/user.model.js');
const AppError = require('../utils/appError.js');

const getAllUsers = async (limit = 10, page = 1) => {
    const skip = (page - 1) * limit;
    const users = await User.find({}, { '__v': false, 'password': false }).skip(skip).limit(limit);
    if (!users) {
        throw new AppError('no users found', 404, 'fail');
    }
    return users;
}

const updateUser = async (userId, data) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('no users found', 404, 'fail');
    }
    const validOptions = ['firstName', 'lastName', 'phone'];
    const updates = {};
    for (const element of validOptions) {
        if (data[element]) {            
            updates[element] = data[element];
        }
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { runValidators: true, returnDocument: 'after'});
    return updatedUser;
}

const changeUserRole = async (userId,newRole)=>{
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('no users found', 404, 'fail');
    }
    const updatedUser = await User.findByIdAndUpdate(userId,{role : newRole}, { runValidators: true, returnDocument: 'after'});
    return updatedUser;
}

const deleteUser = async (userId) => {
    const deletedUser = await User.findByIdAndDelete(userId, { 'password': false, '__v': false });
    if (!deletedUser) {
        throw new AppError('no users found', 404, 'fail');
    }
    return deletedUser;
}

module.exports = {
    getAllUsers,
    updateUser,
    deleteUser,
    changeUserRole
}