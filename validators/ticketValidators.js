const { body } = require('express-validator');

const ticketValidator = ()=>{
    return [
        body('queueId')
            .isString()
            .notEmpty()
    ]
}

module.exports = {
    ticketValidator
}