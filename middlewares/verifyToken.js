const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError.js')

const verifyAuth = (req, res, next) => {
    const authHeader = req.headers['authorization']
    try {
        if (!authHeader) {
            throw new AppError("Unauthorized! token is required", 401, 'fail');
        }
        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.SECURITY_CODE);
        if (decodedToken.purpose !== "authentication") {
            throw new AppError("Unauthorized! invalid token", 401, 'fail');
        }
        req.currentUser = decodedToken; // request object manibulation
        next();

    } catch (error) {
        return next(error);
    }
}

const verifyPasswordChange = (req, res, next) => {
    const authHeaders = req.headers['authorization'];
    try {
        if (!authHeaders) {
            throw new AppError('token is required', 401, 'fail');
        }
        const token = authHeaders.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.SECURITY_CODE);
        if (decodedToken.purpose !== "password changing") {
            throw new AppError('invaled token!', 401, 'fail');
        }
        req.temporaryUser = decodedToken
        next();
    } catch (error) {
        return next(error);
    }

}

const authorizeQueueManager = (req, res, next) => {
    try {
        if (req.currentUser.role !== 'queueManager') {
            throw new AppError('Forbidden! only manager access', 403, 'fail');
        }
        next();
    } catch (error) {
        return next(error);
    }
}

const authorizeAdmin = (req, res, next) => {
    try {
        if (req.currentUser.role !== 'admin') {
            throw new AppError('Forbidden! only admin access', 403, 'fail');
        }
        next();
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    verifyAuth,
    authorizeQueueManager,
    authorizeAdmin,
    verifyPasswordChange
}