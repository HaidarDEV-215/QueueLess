const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const adminControllers = require('../controllers/admin.controllers.js');

const router = express.Router();

router.route('/')
    .get(
        verifyToken.verifyAuth,
        verifyToken.authorizeAdmin,
        adminControllers.getAllUsers
    )
    .delete(
        verifyToken.verifyAuth,
        verifyToken.authorizeAdmin,
        adminControllers.deleteUser
    )

router.route('/permissions')
    .put(
        verifyToken.verifyAuth,
        verifyToken.authorizeAdmin,
        adminControllers.changeUserRole
    )



module.exports = router;