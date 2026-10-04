const express = require('express');
const validationHandler = require('../middlewares/validationHandler.js');
const authValidators = require('../validators/authValidators.js');
const authController = require('../controllers/auth.controllers.js');
const { verifyPasswordChange, verifyAccountConfirming } = require('../middlewares/verifyToken.js');

const router = express.Router();


router.route('/register')
    .post(
        authValidators.registerValidation(),
        validationHandler,
        authController.register)

router.route('/confirmAccount')
    .put(
        verifyAccountConfirming,
        authValidators.confirmAccountValidator(),
        validationHandler,
        authController.confirmAccount
    )

router.route('/login')
    .post(
        authValidators.loginValidation(),
        validationHandler,
        authController.login
    )

router.route('/forgetPassword')
    .post(
        authValidators.forgetPasswordValidator(),
        validationHandler,
        authController.forgetPassword
    )

router.route('/confirmOtp')
    .post(
        authValidators.confirmOTPValidation(),
        validationHandler,
        authController.confirmOTP
    )

router.route('/changePassword')
    .put(
        verifyPasswordChange,
        authValidators.changePasswordValidator(),
        validationHandler,
        authController.changePassword
    )

module.exports = router;