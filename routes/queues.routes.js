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
    )
    .put(
        verifyToken.verifyAuth,
        queueControllers.cancelTicket
    );

router.route('/manager/:queueId')
    .get(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueControllers.getAllTicketsInQueue
    )
    .put(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueValidator.updateQueueValidator(),
        validationHandler,
        queueControllers.updateQueue
    )
    .patch(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueControllers.toggleQueueStatus
    )

module.exports = router;