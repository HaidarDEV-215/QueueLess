const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const validationHandler = require('../middlewares/validationHandler.js');
const usersProfilesServices = require('../services/usersProfiles.services.js');
const router = express.Router();

router.route('/')
        .get( //make it only admin access
            usersProfilesServices.getAllUsers   
        )

router.route('/me')
        .put(
            verifyToken.verifyAuth,
            usersProfilesServices.updateUser
        )
        .delete(
            //make admin can delete any account
            verifyToken.verifyAuth,
            usersProfilesServices.deleteUser
        )

module.exports = router;