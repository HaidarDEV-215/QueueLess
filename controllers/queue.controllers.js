const queueServices = require('../services/queue.services.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');

const getUserTickets = asyncWrapper(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const userId = req.currentUser.id;
    const tickets = await queueServices.getUserTickets(userId, limit, page);
    res.status(200).json({ items: tickets.length, data: tickets });
});

// const getActiveTickets = asyncWrapper(async (req, res, next) => {
//     const limit = parseInt(req.query.limit) || 10;
//     const page = parseInt(req.query.page) || 1;
//     const userId = req.currentUser.id;
//     const tickets = await queueServices.getUserTickets(userId, limit, page);
//     res.status(200).json({ items: tickets.length, data: tickets });
// });

const getUserTicketInQueue = asyncWrapper(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const userId = req.currentUser.id;
    const queueId = req.params.queueId;
    const tickets = await queueServices.getUserTicketInQueue(userId, queueId, limit, page);
    res.status(200).json({ items: tickets.length, data: tickets });
});

const getAllTicketsInQueue = asyncWrapper(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const tickets = await queueServices.getAllTicketsInQueue(req.params.queueId, limit, page);
    res.status(200).json({ items: tickets.length, data: tickets });
});

const createTicket = asyncWrapper(async (req, res, next) => {
    const status = req?.body?.status ?? "waiting";
    const newTicket = await queueServices.createTicket(req.currentUser.id, req.body.queueId, status);
    res.status(201).json({ message: 'ticket created successfully', data: newTicket });
});

const createQueue = asyncWrapper(async (req, res, next) => {
    const status = req?.body?.status ?? 'open';
    const capacity = req?.body?.capacity ?? 100;
    const newQueue = await queueServices.createQueue(req.body.name, req.currentUser.id, capacity, status);
    res.status(201).json({ message: 'queue created successfully', data: newQueue });
});

const cancelTicket = asyncWrapper(async (req, res, next) => {
    const ticketId = req.body.ticketId;
    const userId = req.currentUser.id;
    const canceledTicket = await queueServices.cancelTicket(ticketId, userId);
    res.status(200).json({ message: 'ticket canceled', data: canceledTicket });
});

const updateQueue = asyncWrapper(async (req, res, next) => {
    const data = req.body;
    const queueId = req.params.queueId;
    const userId = req.currentUser.id;
    const updatedTicket = await queueServices.updateQueue(queueId, userId, data);
    res.status(200).json({ message: 'ticket updated', data: updatedTicket });
});

const toggleQueueStatus = asyncWrapper(async (req, res, next) => {
    const queueId = req.params.queueId;
    const userId = req.currentUser.id;
    const queue = await queueServices.toggleQueueStatus(queueId, userId);
    res.status(200).json({ message: `done.. queue is ${queue.status}`, data: queue });
});

const activateQueue = asyncWrapper(async (req, res, next) => {
    const queueId = req.params.queueId;
    const userId = req.currentUser.id;
    const activeQueue = await queueServices.activateQueue(queueId, userId);
    res.status(200).json({ message: 'queue has been activated', data: activeQueue });
});

const swapToNextTicket = asyncWrapper(async (req, res, next) => {
    const queueId = req.params.queueId;
    const userId = req.currentUser.id;
    const newQueueStatus = await queueServices.swapToNextTicket(queueId, userId);
    res.status(200).json({ message: 'swapped to next ticket', data: newQueueStatus });
});

module.exports = {
    getAllTicketsInQueue,
    createTicket,
    createQueue,
    cancelTicket,
    updateQueue,
    toggleQueueStatus,
    activateQueue,
    swapToNextTicket,
    getUserTickets,
    getUserTicketInQueue
}