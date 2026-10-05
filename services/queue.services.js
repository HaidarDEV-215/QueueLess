const Queue = require('../models/queue.model.js');
const Ticket = require('../models/ticket.model.js');
const mongoose = require('mongoose');
const AppError = require('../utils/appError.js');

const getAllTicketsInQueue = async (queueId,currentUserId ,limit = 10, page = 1) => {
    const skip = (page - 1) * limit;
    const queue = await Queue.findOne({_id:queueId,createdBy:currentUserId});
    if (!queue) {
        throw new AppError('no queue found!', 404, 'fail');
    }
    const tickets = await Ticket.find({ queue: queueId }, { '__v': false }).limit(limit).skip(skip);
    if (!tickets) {
        throw new AppError('no tickets found or queue id is not exist', 404, 'fail');
    }
    return tickets;
}

const getUserTickets = async (userId, limit = 10, page = 1) => {
    const skip = (page - 1) * limit;
    const tickets = await Ticket.find({ owner: userId }, { '__v': false }).limit(limit).skip(skip);
    if (!tickets) {
        throw new AppError('no tickets found', 404, 'fail');
    }
    return tickets;
}

const getUserTicketInQueue = async (userId, queueId) => {
    const tickets = await Ticket.findOne({ owner: userId, queue: queueId }, { '__v': false });
    if (!tickets) {
        throw new AppError('no tickets found', 404, 'fail');
    }
    return tickets;
}

const createTicket = async (currentUserId, queueId, status) => {
    const existTicket = await ticket.findOne({owner:currentUserId,queue:queueId,status:"waiting"});
    if(existTicket){
        throw new AppError("you already have a pending ticket in this queue",400,'fail');
    }
    const ticketId = new mongoose.Types.ObjectId();// early id generation
    const queueUpdateAndReturnOld = await Queue.findOneAndUpdate( // make whole operations in one (atomisity)
        { // search filters
            _id: queueId,
            status: 'open',
            $expr: { $lt: ['$currentLength', '$capacity'] }// check condition while search
        },
        { // updates
            $set: { lastTicket: ticketId },  // update to the new ticketId by using atomic operator $set
            $inc: { currentLength: 1 }       // add 1 to the queue length by using atomic operator $inc
        }
    );// end of atomic query
    if (!queueUpdateAndReturnOld) {
        throw new AppError('cannot find queue or it\'s maybe closed or full!', 400, 'fail');
    }
    const newTicket = await Ticket.create({
        _id: ticketId,  // when you generate an id manually then mongoDB will not generate one.
        owner: currentUserId,
        queue: queueId,
        prev: queueUpdateAndReturnOld.lastTicket,
        status
    });
    return newTicket;
}

const getTicketCurrentPosition = async (currentUserId, queueId) => {
    const queue = await Queue.findOne({ _id: queueId });
    if (!queue) throw new AppError('queue is not found', 404, 'fail');

    const ticket = await Ticket.findOne({ owner: currentUserId, queue: queueId, status: 'waiting' });
    if (!ticket) throw new AppError('you don\'t have a ticket in this queue or it was finished or canceled', 400, 'fail');

    let ticketIndex = 0;
    let ticketPointer = queue.currentTurn === null
        ? await Ticket.findOne({ prev: null, queue: queueId })
        : await Ticket.findOne({ _id: queue.currentTurn, queue: queueId });

    if (!ticketPointer) throw new AppError('could not determine ticket position', 500, 'fail');

    while (!ticketPointer._id.equals(ticket._id)) {
        ticketPointer = await Ticket.findOne({ prev: ticketPointer._id, queue: queueId });
        if (!ticketPointer) throw new AppError('could not determine ticket position', 500, 'fail');
        if (ticketPointer.status !== 'canceled') ticketIndex += 1;
    }

    return { positionIndex: ticketIndex, ticket };
}

const createQueue = async (name, createdBy, capacity, status) => {
    const queueData = {
        name,
        createdBy,
        capacity,
        status
    }
    const newQueue = new Queue(queueData);
    await newQueue.save();
    return newQueue;
}

const updateQueue = async (queueId, userId, data) => {
    const queue = await Queue.findOne({ _id: queueId, createdBy: userId }, { '__v': false });
    if (!queue) {
        throw new AppError('no queue found!', 404, 'fail');
    }
    const validOptions = ['name', 'capacity', 'status'];
    const updates = {};
    for (const element of validOptions) {
        if (data[element]) {
            updates[element] = data[element];
        }
    }
    const updatedQueue = await Queue.findByIdAndUpdate(queueId, updates, { returnDocument: 'after', runValidators: true });
    return updatedQueue;
}

const cancelTicket = async (ticketId, userId) => {//rather than delete
    const ticket = await Ticket.findOneAndUpdate({// atomic operation
        _id: ticketId,
        owner: userId,
        status: 'waiting'
    }, {
        $set: { status: 'canceled' }// cancel ticket when it found 
        //to avoid execute this operation two times or more for the same ticket befor update it
    });
    if (!ticket) {
        throw new AppError('no tickets found or it was canceled', 400, 'fail');
    }
    const queue = await Queue.findByIdAndUpdate(ticket.queue, { $inc: { currentLength: -1 } });
    if (!queue) {
        throw new AppError('no queue found!', 404, 'fail');
    }
    return ticket;
}

const toggleQueueStatus = async (queueId, userId) => {
    const queue = await Queue.findOne({ _id: queueId, createdBy: userId });
    if (!queue) {
        throw new AppError('no queue found!', 404, 'fail');
    }
    let newStatus = 'open';
    if (queue.status === 'open') {
        newStatus = 'closed';
    }
    const updatedQueue = await Queue.findByIdAndUpdate(queueId, { status: newStatus }, { runValidators: true, returnDocument: 'after' });
    return updatedQueue;
}

const activateQueue = async (queueId, userId) => {
    let firstTicket = await Ticket.findOneAndUpdate({// atomic operation
        queue: queueId,
        prev: null,
        isCheckedBySystem: false  // to avoid execute this operation more than to times to avoid crashes
    }, {
        $set: { isCheckedBySystem: true }
    });
    if (!firstTicket) {
        throw new AppError('cannot active this queue it may be was activated or it\'s empty', 400, 'fail');
    }
    while (firstTicket.status === 'canceled') {//skip canceled tickets
        firstTicket = await Ticket.findOneAndUpdate({// atomic operation
            queue: queueId,
            prev: firstTicket._id,
            isCheckedBySystem: false  // to avoid execute this operation more than to times to avoid crashes
        }, {
            $set: { isCheckedBySystem: true }
        });
        if (!firstTicket) {//if last ticket is canceled do not lop more and throw error
            throw new AppError('no more tickets queue is finished', 404, 'fail');
        }
    }
    const activeQueue = await Queue.findOneAndUpdate( //atomic operation
        {
            _id: queueId,
            createdBy: userId,
            currentTurn: null
        },
        {
            $set: { currentTurn: firstTicket._id } //to update current turn onr time only
        },
        {
            returnDocument: 'after'
        }
    );
    if (!activeQueue) {
        await Ticket.findByIdAndUpdate(firstTicket._id, { isCheckedBySystem: false });
        throw new AppError('queue not found or already activated', 400, 'fail');
    }
    await Ticket.findByIdAndUpdate(firstTicket._id, { status: 'serving' }, { runValidators: true, returnDocument: 'after' });
    return activeQueue;
}

const swapToNextTicket = async (queueId, userId) => {
    const queue = await Queue.findOne({ _id: queueId, createdBy: userId });
    if (!queue) {
        throw new AppError('no queue found!', 404, 'fail');
    }
    await Ticket.findOneAndUpdate({
        _id: queue.currentTurn,
        status: 'serving',
    },
        {
            $set: { status: 'finished' },
        },
        { returnDocument: 'after' }
    );

    let nextTicketServing = await Ticket.findOneAndUpdate({
        prev: queue.currentTurn,
        isCheckedBySystem: false
    }, {
        $set: { isCheckedBySystem: true }
    });
    if (!nextTicketServing) {
        throw new AppError('no more tickets queue is finished', 404, 'fail');
    }
    while (nextTicketServing.status === 'canceled') {//skip canceled tickets
        nextTicketServing = await Ticket.findOneAndUpdate({
            prev: nextTicketServing._id,
            isCheckedBySystem: false
        }, {
            $set: { isCheckedBySystem: true }
        });
        if (!nextTicketServing) {//if last ticket is canceled do not loop more and throw error
            throw new AppError('no more tickets queue is finished', 404, 'fail');
        }
    }
    await Ticket.findByIdAndUpdate(nextTicketServing._id, { status: 'serving' }, { runValidators: true, returnDocument: 'after' });
    const updatedQueue = await Queue.findByIdAndUpdate(queueId, { currentTurn: nextTicketServing._id, $inc: { currentLength: -1 } }, { runValidators: true, returnDocument: 'after' });
    return updatedQueue;
}

module.exports = {
    createTicket,
    createQueue,
    getAllTicketsInQueue,
    updateQueue,
    cancelTicket,
    toggleQueueStatus,
    activateQueue,
    swapToNextTicket,
    getUserTickets,
    getUserTicketInQueue,
    getTicketCurrentPosition
};