const AppError = require('../utils/appError.js');

const notFoundError = (req, res, next) => {
    const error = new AppError("this page is not found", 404, "fail");
    next(error);
}

const globalErrorHaindler = (error, req, res, next) => {
    res.status(error.statusCode || 500).json({ msg: error.message || 'server error', code: error.statusCode || 500, text: "fail" });
}

module.exports = { notFoundError, globalErrorHaindler };