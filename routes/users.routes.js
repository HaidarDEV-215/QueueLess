const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const validationHandler = require('../middlewares/validationHandler.js');
const usersProfilesControllers = require('../controllers/usersProfile.controllers.js');
const router = express.Router();

router.route('/')
        .get( //make it only admin access
            usersProfilesControllers.getAllUsers   
        )

router.route('/me')
        .put(
            verifyToken.verifyAuth,
            usersProfilesControllers.updateUser
        )
        .delete(
            //make admin can delete any account
            verifyToken.verifyAuth,
            usersProfilesControllers.deleteUser
        )

module.exports = router;