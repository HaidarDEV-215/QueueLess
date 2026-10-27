const Queue = require('../models/queue.model.js');
const Ticket = require('../models/ticket.model.js');
const User = require('../models/user.model.js');
const emailSender = require('../utils/sendEmail.js');
const mongoose = require('mongoose');
const AppError = require('../utils/appError.js');

// data-access helpers

const getNextWaitingTicket = async (filters) => {
    let waitingTicket = await Ticket.findOne({
        ...filters,
    });
    while (waitingTicket && waitingTicket.status === 'canceled') {//skip canceled tickets
        waitingTicket = await Ticket.findOne({
            queue: waitingTicket.queue,
            prev: waitingTicket._id,
        });
    }
    return waitingTicket;
}

const notifyTurnChange = async (currentServingTicket) => {
    const user = await User.findById(currentServingTicket.owner).select('firstName lastName email').lean();
    emailSender('your-turn', { userName: `${user.firstName} ${user.lastName}`, email: user.email });
    const willBeNextTicket = await getNextWaitingTicket({ prev: currentServingTicket._id });
    if (willBeNextTicket !== null) {
        const nextUser = await User.findById(willBeNextTicket.owner).select('firstName lastName email').lean();
        emailSender('next-turn', { userName: `${nextUser.firstName} ${nextUser.lastName}`, email: nextUser.email });
    }
}

// real services
const getAllTicketsInQueue = async (queueId, currentUserId, limit = 10, page = 1) => {
    const skip = (page - 1) * limit;
    const queue = await Queue.findOne({ _id: queueId, createdBy: currentUserId });
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

const createTicket = async (id, queueId) => {
    const existTicket = await Ticket.findOne({ owner: id, queue: queueId, status: "waiting" });
    if (existTicket) {
        throw new AppError("you already have a pending ticket in this queue", 400, 'fail');
    }
    const session = await mongoose.startSession();
    try {
        const result = await session.withTransaction(async () => {
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
            ).session(session);// end of atomic query
            if (!queueUpdateAndReturnOld) {
                throw new AppError('cannot find queue or it\'s maybe closed or full!', 400, 'fail');
            }
            const newTicket = await Ticket.create(
                [
                    {
                        _id: ticketId,  // when you generate an id manually then mongoDB will not generate one.
                        owner: id,
                        queue: queueId,
                        prev: queueUpdateAndReturnOld.lastTicket,
                        status: 'waiting'
                    }
                ],
                { session }
            );
            return newTicket;
        });
        return result;
    } finally {
        await session.endSession();
    }
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

const deleteQueueWithRelatedTickets = async (queueId, userId)=>{
    const session = await mongoose.startSession();
    try {
        const result = await session.withTransaction(async ()=>{
            const deletedQueue = await Queue.findOneAndDelete(
            {
                _id: queueId,
                createdBy: userId
            }).session(session);
        if (!deletedQueue) {
            throw new AppError("queue not found", 404, 'fail');
        }
        //delete related tickets when queue deleted
        await Ticket.deleteMany({ queue: queueId },{session});
        return deletedQueue;
        });
        return result;
    } finally {
        await session.endSession();
    }
}

const cancelTicket = async (ticketId, userId) => {//rather than delete
    const session = await mongoose.startSession();
    try {
        const result = await session.withTransaction(async () => {
            const ticket = await Ticket.findOneAndUpdate({// atomic operation
                _id: ticketId,
                owner: userId,
                status: 'waiting'
            }, {
                $set: { status: 'canceled' }// cancel ticket when it found 
                //to avoid execute this operation two times or more for the same ticket befor update it
            }).session(session);
            if (!ticket) {
                throw new AppError('no tickets found or it was canceled', 400, 'fail');
            }
            const queue = await Queue.findByIdAndUpdate(
                ticket.queue,
                {
                    $inc: { currentLength: -1 }
                }).session(session);
            if (!queue) {
                throw new AppError('no queue found!', 404, 'fail');
            }
            return ticket;
        });
        return result;
    } finally {
        await session.endSession();
    }
}

const setQueueStatus = async (queueId, userId, newStatus) => {
    const oldStatus = newStatus=='open'? 'closed':'open';
    const updatedQueue = await Queue.findOneAndUpdate(
        {
            _id:queueId,
            createdBy:userId,
            status:oldStatus
        }, {
            status: newStatus
        }, { runValidators: true, returnDocument: 'after' }
    );
    if(!updatedQueue){
        throw new AppError(`queue is not found or it's ${newStatus}`, 404, 'fail');
    }
    return updatedQueue;
}

const activateQueue = async (queueId, userId) => {
    const session = await mongoose.startSession();
    try {
        const result = await session.withTransaction(async()=>{
             const queue = await Queue.findOne(
            { _id: queueId, createdBy: userId, currentTurn: null }
        );
        if (!queue) {
            throw new AppError('queue not found or already activated', 400, 'fail');
        }
        const firstTicket = await getNextWaitingTicket({ queue: queueId, prev: null });
        if (!firstTicket) {
            throw new AppError('no tickets found', 404, 'fail');
        }
        const currentServingTicket = await Ticket.findOneAndUpdate(
            { _id: firstTicket._id, status: 'waiting' },
            { status: 'serving' }, 
            { runValidators: true, returnDocument: 'after' }).session(session);
        if (!currentServingTicket) {
            throw new AppError('ticket status changed, try again', 409, 'fail');
        }
        const activeQueue = await Queue.findOneAndUpdate( //atomic operation
            {
                _id: queueId,
                createdBy: userId,
                currentTurn: null
            },
            {
                $set: { currentTurn: firstTicket._id }, //to update current turn onr time only
                $inc: { currentLength: -1 }
            },
            {
                returnDocument: 'after'
            }
        ).session(session);
        if (!activeQueue) {
            throw new AppError('queue not found or already activated', 400, 'fail');
        }
        return {activeQueue,currentServingTicket}
        });
        notifyTurnChange(result.currentServingTicket).catch((error) => {
            console.error(error.message);
        });
        return result.activeQueue;
    } finally {
        await session.endSession();
    }
}

const swapToNextTicket = async (queueId, userId) => {
    const session = await mongoose.startSession();
    try {
        const result = await session.withTransaction(async ()=>{
            const queue = await Queue.findOne({ _id: queueId, createdBy: userId });
        if (!queue) {
            throw new AppError('no queue found!', 404, 'fail');
        }
        if (!queue.currentTurn) {
            throw new AppError('queue is not activated yet!', 400, 'fail');
        }
        await Ticket.findOneAndUpdate({
            _id: queue.currentTurn,
            status: 'serving',
        }, {
            $set: { status: 'finished' },
        },
            { returnDocument: 'after' }
        ).session(session);
        const nextTicketServing = await getNextWaitingTicket({ prev: queue.currentTurn, queue: queueId });
        if (!nextTicketServing) {
            throw new AppError('no more tickets queue is finished', 404, 'fail');
        }
        const currentServingTicket = await Ticket.findOneAndUpdate(
            {
                _id: nextTicketServing._id,
                status: 'waiting'
            },
            {
                status: 'serving'
            }, {
            runValidators: true,
            returnDocument: 'after'
        }).session(session);
        if (!currentServingTicket) {
            throw new AppError('ticket status changed, try again', 409, 'fail')
        }
        const updatedQueue = await Queue.findByIdAndUpdate(
            queueId,
            {
                currentTurn: nextTicketServing._id,
                $inc: { currentLength: -1 }
            }, {
            runValidators: true,
            returnDocument: 'after'
        }
        ).session(session);
        await session.commitTransaction();
        return {updatedQueue,currentServingTicket};
        });
        notifyTurnChange(result.currentServingTicket).catch((error) => {
            console.error(error.message);
        });
        return result.updatedQueue;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    createTicket,
    createQueue,
    getAllTicketsInQueue,
    updateQueue,
    cancelTicket,
    setQueueStatus,
    activateQueue,
    swapToNextTicket,
    getUserTickets,
    getUserTicketInQueue,
    getTicketCurrentPosition,
    deleteQueueWithRelatedTickets
};