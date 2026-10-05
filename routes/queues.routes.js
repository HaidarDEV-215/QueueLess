const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const queueControllers = require('../controllers/queue.controllers.js');
const rateLimit = require('../middlewares/rateLimits.js');
const router = express.Router();


router.route('/tickets')
    .post(
        rateLimit.postRequestLimiter,
        verifyToken.verifyAuth,
        queueControllers.createTicket
    )
    .put(
        verifyToken.verifyAuth,
        queueControllers.cancelTicket
    )
    .get(
        verifyToken.verifyAuth,
        queueControllers.getUserTickets
    );

router.route('/tickets/:queueId')
    .get(
        verifyToken.verifyAuth,
        queueControllers.getUserTicketInQueue
    );
    



module.exports = router;