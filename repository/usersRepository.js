const User = require('../models/userModel.js');

const createUser = async (firstName, lastName, email, phone, hashedPassword) => {
    const newUserData = {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword
    };
    const newUser = new User(newUserData);
    await newUser.save();
    return newUser;
}

const getAllUsers = async(limit = 10,skip = 0)=>{
    const users = await User.find({},{"__v":false,"password":false}).limit(limit).skip(skip);
    return users;
}
const getUserById = async(userId) =>{
    const user = await User.findById(userId,{"__v":false,"password":false});
    return user;
}

const getUserByEmail = async(email)=>{
    const user = await User.findOne({email},{"__v":false,"password":false});
    return true;
}

const deleteUserById = async (userId)=>{
    const userToDelete = await User.findByIdAndDelete(userId,{"__v":false,"password":false});
    return userToDelete;
}

const updateUserById = async (userId,data)=>{
    const updatedUser = await User.findByIdAndUpdate(userId,data,{runValidator:true,returnDocument:'after'});
    return updatedUser;
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    getUserByEmail,
    deleteUserById,
    updateUserById
}
