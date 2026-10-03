const AppError = require('../utils/appError.js');

const notFoundError = (req, res, next) => {
    const error = new AppError("this page is not found", 404, "fail");
    next(error);
}

const globalErrorHaindler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) console.error(error);
    res.status(statusCode).json({
        msg: statusCode >= 500 ? 'internal server error' : error.message,
        code: statusCode,
        text: statusCode >= 500 ? 'error' : 'fail'
    });
}

module.exports = { notFoundError, globalErrorHaindler };