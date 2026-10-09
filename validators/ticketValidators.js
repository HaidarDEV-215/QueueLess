const { body } = require('express-validator');

const ticketValidator = ()=>{
    return [
        body('status')
            .isString()
            .optional()
            .isIn(['waiting', 'serving', 'canceled', 'finished']),
        body('queueId')
            .isString()
            .notEmpty()
    ]
}

module.exports = {
    ticketValidator
}