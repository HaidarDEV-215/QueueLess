const { body } = require('express-validator');

const registerValidation = () => {
    return [
        body('firstName')
            .isString()
            .isLength({ min: 2, max: 20 })
            .withMessage('first name must be 2 to 20 characters')
            .notEmpty()
            .withMessage("first name cannot be empty")
        , body('lastName')
            .isString()
            .isLength({ min: 2, max: 20 })
            .withMessage('last name must be 2 to 20 characters')
            .notEmpty()
            .withMessage("last name cannot be empty")
        , body('email')
            .isString()
            .notEmpty()
            .withMessage("email cannot be empty")
            .isEmail()
            .withMessage("this email is not valid!")
        , body('phone')
            .isString()
            .notEmpty()
            .withMessage("phon number cannot be empty")
        , body("password")
            .isString()
            .isStrongPassword()
            .isLength({ min: 8, max: 16 })
            .withMessage('password length must be 8 to 16 character and must be strong')
            .notEmpty()
            .withMessage('password cannot bo empty')
    ]
}

const loginValidation = () => {
    return [
        body('email')
            .isString()
            .withMessage("email or password is not matched")
            .notEmpty()
            .withMessage("email or password is not matched")
            .isEmail()
            .withMessage("email or password is not matched")
        , body('password')
            .isString()
            .withMessage("email or password is not matched")
            .notEmpty()
            .withMessage("email or password is not matched")
    ]
}

const forgetPasswordValidator = () => {
    return [
        body('email')
            .isString()
            .notEmpty()
            .isEmail()
    ]
}

const confirmOTPValidation = () => {
    return [
        body('email')
            .isString()
            .notEmpty()
            .isEmail()
        ,body('code')
            .isString()
            .notEmpty()
    ]
}

const changePasswordValidator = () => {
    return [
        body("password")
            .isString()
            .isStrongPassword()
            .isLength({ min: 8, max: 16 })
            .withMessage('password length must be 8 to 16 character and must be strong')
            .notEmpty()
            .withMessage('password cannot bo empty')
    ]
}

module.exports = {
    registerValidation,
    loginValidation,
    forgetPasswordValidator,
    confirmOTPValidation,
    changePasswordValidator
}