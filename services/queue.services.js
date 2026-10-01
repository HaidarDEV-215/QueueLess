const Queue = require('../models/queue.model.js');
const Ticket =require('../models/ticket.model.js');
const AppError = require('../utils/appError.js');

const getAllTicketsInQueue= async (queueId,limit = 10, page = 1)=>{
    const skip = (page - 1) * limit;
    const tickets = await Ticket.find({queue:queueId},{'__v':false}).limit(limit).skip(skip);
    if(!ticket){
        throw new AppError('no tickets found or queue id is not exist',404,'fail');
    }
    return tickets;
}

const createTicket = async (currentUserId,queueId,status = 'waiting') =>{
    const queue = await Queue.findById(queueId,{'__v':false});
    if(!queue){
        throw new AppError('no queue found!',404,'fail');
    }
    const ticketData = {
        owner:currentUserId,
        queue:queueId,
        prev:queue.lastTicket,
        status
    }
    const newTicket = new Ticket(ticketData);
    await newTicket.save();
    await Queue.findByIdAndUpdate(queueId,{lastTicket:newTicket._id});
    return newTicket;
}

const createQueue = async (name,createdBy,capacity,status='available')=>{
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


module.exports = {createTicket,createQueue,getAllTicketsInQueue};