const express = require('express');
const validationHandler = require('../middlewares/validationHandler.js');
const authValidators = require('../validators/authValidators.js');
const authController = require('../controllers/auth.controllers.js');
const { verifyPasswordChange, verifyAccountConfirming } = require('../middlewares/verifyToken.js');
const rateLimit = require('../middlewares/rateLimits.js');

const router = express.Router();


router.route('/register')
    .post(
        rateLimit.loginLimiter,
        authValidators.registerValidation(),
        validationHandler,
        authController.register)

router.route('/confirmAccount')
    .put(
        rateLimit.confirmAccountLimiter,
        verifyAccountConfirming,
        authValidators.confirmAccountValidator(),
        validationHandler,
        authController.confirmAccount
    )

router.route('/login')
    .post(
        rateLimit.loginLimiter,
        authValidators.loginValidation(),
        validationHandler,
        authController.login
    )

router.route('/forgetPassword')
    .post(
        rateLimit.forgetPasswordLimiter,
        authValidators.forgetPasswordValidator(),
        validationHandler,
        authController.forgetPassword
    )

router.route('/confirmOtp')
    .post(
        rateLimit.confirmOTPLimiter,
        authValidators.confirmOTPValidation(),
        validationHandler,
        authController.confirmOTP
    )

router.route('/changePassword')
    .put(
        rateLimit.resetPasswordLimiter,
        verifyPasswordChange,
        authValidators.changePasswordValidator(),
        validationHandler,
        authController.changePassword
    )

module.exports = router;