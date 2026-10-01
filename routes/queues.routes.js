const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const queueControllers = require('../controllers/queue.controllers.js');

const router =express.Router();


router.route('/')
            .post(
                verifyToken.verifyAuth,
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
                queueControllers.getAllTicketsInQueue
            );

module.exports = router;