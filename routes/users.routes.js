const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const userValidationSchema = require('../validators/userUpdateValidators.js');
const validationHandler = require('../middlewares/validationHandler.js');
const usersProfilesControllers = require('../controllers/usersProfile.controllers.js');
const router = express.Router();


router.route('/me')
    .put(
        verifyToken.verifyAuth,
        userValidationSchema.updateUserData(),
        validationHandler,
        usersProfilesControllers.updateUser
    )
    .delete(
        verifyToken.verifyAuth,
        usersProfilesControllers.deleteUser
    )
    .get(
        verifyToken.verifyAuth,
        usersProfilesControllers.getMyAccountData
    )

module.exports = router;