const mongoose = require('mongoose');

const queueSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    lastTicket: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ticket',
        default: null
    },
    currentTurn: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ticket',
        default: null

    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Queue', queueSchema);