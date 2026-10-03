const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const queueControllers = require('../controllers/queue.controllers.js');
const queueValidator = require('../validators/queueValidators.js');
const validationHandler = require('../middlewares/validationHandler.js');

const router = express.Router();


router.route('/tickets')
    .post(
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