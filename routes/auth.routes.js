const express = require('express');
const validationHandler = require('../middlewares/validationHandler.js');
const authValidators = require('../validators/authValidators.js');

const router = express.Router();

const authController = require('../controllers/auth.controllers.js');

router.route('/register')
                .post(
                    authValidators.registerValidation(),
                    validationHandler,
                    authController.register)

router.route('/login')
                .post(
                    authValidators.loginValidation(),
                    validationHandler,
                    authController.login
                )



module.exports = router;