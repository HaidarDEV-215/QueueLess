const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError.js')

const verifyAuth = (req, res, next) => {
    const authHeader = req.headers['authorization']
    try {
        if (!authHeader) {
            throw new AppError("token is required", 401, 'fail');
        }
        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.SECURITY_CODE);
        req.currentUser = decodedToken; // request object manibulation
        next();
        
    } catch (error) {
        return next(error);
    }
}

const authorizeQueueManager = (req,res,next)=>{
    try{
        if(req.currentUser.role !== 'queueManager'){
            throw new AppError('Unauthorized! only manager access',403,'fail');
        }
        next();
    }catch(error){
        return next(error);
    }
}

const authorizeAdmin = (req,res,next)=>{
    try{
        if(req.currentUser.role !== 'admin'){
            throw new AppError('Unauthorized! only admin access',403,'fail');
        }
        next();
    }catch(error){
        return next(error);
    }
}



module.exports = {
    verifyAuth,
    authorizeQueueManager,
    authorizeAdmin
}