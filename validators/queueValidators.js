const { body } = require('express-validator');

const createQueueValidator = () => {
    return [
        body('name')
            .isString()
            .notEmpty()
            .withMessage('queue name cannot be empty')
            .isLength({ min: 2, max: 25 })
            .withMessage('queue name must be 2 to 25 character')
        , body('capacity')
            .isNumeric()
            .withMessage('capacity must be numeric')
            .notEmpty()
            .withMessage('capacity cannot be empty')
        ,body('status')
            .isString()
            .isIn(['open', 'closed'])
            .withMessage('status must be open or closed')
            .optional()
    ]
}

const updateQueueValidator=()=>{
    return[
        body('name')
            .isString()
            .optional()
            .isLength({ min: 2, max: 25 })
            .withMessage('queue name must be 2 to 25 character')
        ,body('capacity')
            .isNumeric()
            .withMessage('capacity must be numeric')
            .optional()
        ,body('status')
            .isString()
            .isIn(['open', 'closed'])
            .withMessage('status must be open or closed')
            .optional()
    ]
}

module.exports = {
    createQueueValidator,
    updateQueueValidator
}