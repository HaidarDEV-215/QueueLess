const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const queueControllers = require('../controllers/queue.controllers.js');
const queueValidator = require('../validators/queueValidators.js');
const validationHandler = require('../middlewares/validationHandler.js');
const rateLimit = require('../middlewares/rateLimits.js');

const router = express.Router();

router.route('/')
    .post(
        rateLimit.postRequestLimiter,
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
        queueValidator.queueStausValidator(),
        validationHandler,
        queueControllers.setQueueStatus
    )
    .delete(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueControllers.deleteQueueWithRelatedTickets
    )

router.route('/activate/:queueId')
    .put(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueControllers.activateQueue
    )

router.route('/swapToNext/:queueId')
    .put(
        verifyToken.verifyAuth,
        verifyToken.authorizeQueueManager,
        queueControllers.swapToNextTicket
    )
module.exports = router;