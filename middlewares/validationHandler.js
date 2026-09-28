const { validationResult } = require('express-validator');
const AppError = require('../utils/appError.js');

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new AppError(errors.array(), 400, 'fail');
        return next(error);
    }
    next();
}