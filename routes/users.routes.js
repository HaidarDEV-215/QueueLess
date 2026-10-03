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
        //make admin can delete any account
        verifyToken.verifyAuth,
        usersProfilesControllers.deleteUser
    )

module.exports = router;