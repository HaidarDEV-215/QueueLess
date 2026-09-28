const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError.js')

const verifyToken = (req, res, next) => {
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



module.exports = {
    verifyToken
}