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

router.route('/:queueId')
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

router.route('/activate/:queueId')
    .put(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueControllers.swapToNextTicket
    )
    .post(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueControllers.activateQueue
    )

module.exports = router;