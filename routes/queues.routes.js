const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const queueControllers = require('../controllers/queue.controllers.js');
const queueValidator = require('../validators/queueValidators.js');
const validationHandler = require('../middlewares/validationHandler.js');

const router = express.Router();


router.route('/')
    .post(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueValidator.createQueueValidator(),
        validationHandler,
        queueControllers.createQueue
    );

router.route('/tickets')
    .post(
        verifyToken.verifyAuth,
        queueControllers.createTicket
    );

router.route('/tickets/:queueId')
    .get(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueControllers.getAllTicketsInQueue
    );

module.exports = router;