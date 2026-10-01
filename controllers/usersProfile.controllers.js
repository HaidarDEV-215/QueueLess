const userServices = require('../services/usersProfiles.services.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');

const getAllUsers = asyncWrapper(async (req,res,next)=>{
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const users = await userServices.getAllUsers(limit,page);
    res.status(200).json({items:users.length,data:users});
});

const deleteUser = asyncWrapper(async (req,res,next)=>{
    const userId = req.currentUser.id;
    const deletedUser = await userServices.deleteUser(userId);
    res.status(200).json({message:'user deleted successfully',data:null});
});

const updateUser= asyncWrapper(async (req,res,next)=>{
    const data = req.body;
    const userId = req.currentUser.id;
    const updatedUser = await userServices.updateUser(userId,data);
    res.status(200).json({message:"user updated successfully",data:updatedUser});
});

module.exports = {
    getAllUsers,
    deleteUser,
    updateUser
}