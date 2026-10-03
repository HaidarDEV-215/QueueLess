const { body } = require('express-validator');

const updateUserData = () => {
    return [
        body('firstName')
            .isString()
            .optional()
            .isLength({ min: 2, max: 20 })
            .withMessage('first name must be 2 to 20 characters')
        , body('lastName')
            .isString()
            .optional()
            .isLength({ min: 2, max: 20 })
            .withMessage('last name must be 2 to 20 characters')
        , body('phone')
            .optional()
            .isString()
    ]
}

module.exports = {
    updateUserData
}