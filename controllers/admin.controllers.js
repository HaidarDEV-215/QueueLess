const asyncWrapper = require('../middlewares/asyncWrapper.js');
const userServices = require('../services/usersProfiles.services.js');


const getAllUsers = asyncWrapper(async (req,res,next)=>{
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const users = await userServices.getAllUsers(limit,page);
    res.status(200).json({items:users.length,data:users});
});

const deleteUser = asyncWrapper(async (req,res,next)=>{
    const userId = req.body.userId;
    const deletedUser = await userServices.deleteUser(userId);
    res.status(200).json({message:'user deleted successfully',data:null});
});

module.exports = {
    getAllUsers,
    deleteUser
}