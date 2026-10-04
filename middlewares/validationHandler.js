const { validationResult } = require('express-validator');
const AppError = require('../utils/appError.js');

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) 
        return next();
    const details = errors.array({
        onlyFirstError:true //display only first error message
    }).map(error => ({
        message:error.msg,  //use map to choose which fields we want to display like message and path
        path:error.path     // you shouldn't display ore value of senstive data so we wont write value : error.value
    }))
    const validationError = new AppError('validation error',400,'fail',details);
    return next(validationError);
}