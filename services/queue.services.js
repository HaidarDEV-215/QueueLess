const Queue = require('../models/queue.model.js');
const Ticket = require('../models/ticket.model.js');
const AppError = require('../utils/appError.js');

const getAllTicketsInQueue = async (queueId, limit = 10, page = 1) => {
    const skip = (page - 1) * limit;
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

const getUserTicketInQueue = async (userId, queueId, limit = 10, page = 1) => {
    const skip = (page - 1) * limit;
    const tickets = await Ticket.findOne({ owner: userId, queue: queueId }, { '__v': false }).limit(limit).skip(skip);
    if (!tickets) {
        throw new AppError('no tickets found', 404, 'fail');
    }
    return tickets;
}

const createTicket = async (currentUserId, queueId, status) => {
    const queue = await Queue.findOne({ _id: queueId, status: 'open' }, { '__v': false });
    if (!queue) {
        throw new AppError('cannot find queue or it has been closed!', 404, 'fail');
    }
    const ticketData = {
        owner: currentUserId,
        queue: queueId,
        prev: queue.lastTicket,
        status
    }
    const newTicket = new Ticket(ticketData);
    await newTicket.save();
    await Queue.findByIdAndUpdate(queueId, { lastTicket: newTicket._id });
    return newTicket;
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
    const ticket = await Ticket.findOne({ _id: ticketId, owner: userId, status: 'waiting' });
    if (!ticket) {
        throw new AppError('no tickets found', 404, 'fail');
    }
    const canceledTicket = await Ticket.findByIdAndUpdate(ticketId, { status: 'canceled' }, { returnDocument: 'after', runValidators: true });
    return canceledTicket;
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
    const queue = await Queue.findOne({ _id: queueId, createdBy: userId });
    if (!queue) {
        throw new AppError('no queue found!', 404, 'fail');
    }
    let firstTicket = await Ticket.findOne({ queue: queueId, prev: null });
    if (!firstTicket) {
        throw new AppError('no ticket found!', 404, 'fail');
    }
    while (firstTicket.status === 'canceled') {//skip canceled tickets
        firstTicket = await Ticket.findOne({ queue: queueId, prev: firstTicket._id });
        if (!nextTicketServing) {//if last ticket is canceled do not loop more and throw error
            throw new AppError('no more tickets queue is finished', 404, 'fail');
        }
    }
    const servingTicket = await Ticket.findByIdAndUpdate(firstTicket._id, { status: 'serving' }, { runValidators: true, returnDocument: 'after' });
    const activeQueue = await Queue.findByIdAndUpdate(queueId, { currentTurn: servingTicket._id }, { runValidators: true, returnDocument: 'after' });
    return activeQueue;
}

const swapToNextTicket = async (queueId, userId) => {
    const queue = await Queue.findOne({ _id: queueId, createdBy: userId });
    if (!queue) {
        throw new AppError('no queue found!', 404, 'fail');
    }
    const oldOne = await Ticket.findByIdAndUpdate(queue.currentTurn, { status: 'finished' }, { runValidators: true, returnDocument: 'after' });

    let nextTicketServing = await Ticket.findOne({ prev: queue.currentTurn });
    if (!nextTicketServing) {
        throw new AppError('no more tickets queue is finished', 404, 'fail');
    }
    while (nextTicketServing.status === 'canceled') {//skip canceled tickets
        nextTicketServing = await Ticket.findOne({ queue: queueId, prev: nextTicketServing._id });
        if (!nextTicketServing) {//if last ticket is canceled do not loop more and throw error
            throw new AppError('no more tickets queue is finished', 404, 'fail');
        }
    }
    const updatedTicket = await Ticket.findByIdAndUpdate(nextTicketServing._id, { status: 'serving' }, { runValidators: true, returnDocument: 'after' });
    const updatedQueue = await Queue.findByIdAndUpdate(queueId, { currentTurn: nextTicketServing._id }, { runValidators: true, returnDocument: 'after' });
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
    getUserTicketInQueue
};