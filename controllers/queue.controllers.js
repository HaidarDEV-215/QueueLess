const queueServices = require('../services/queue.services.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');


const getAllTicketsInQueue = asyncWrapper(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const tickets = await queueServices.getAllTicketsInQueue(req.params.queueId, limit, page);
    res.status(200).json({ items: tickets.length, data: tickets });
});

const createTicket = asyncWrapper(async (req, res, next) => {
    const status = req?.body?.status ?? '';
    const newTicket = await queueServices.createTicket(req.currentUser.id, req.body.queueId, status);
    res.status(201).json({ message: 'ticket created successfully', data: newTicket });
});

const createQueue = asyncWrapper(async (req, res, next) => {
    const status = req?.body?.status ?? '';
    const capacity = req?.body?.capacity ?? 100;
    const newQueue = await queueServices.createQueue(req.body.name, req.currentUser.id, capacity, status);
    res.status(201).json({ message: 'queue created successfully', data: newQueue });
});



module.exports = {getAllTicketsInQueue,createTicket,createQueue}