const Queue = require('../models/queue.model.js');
const Ticket =require('../models/ticket.model.js');
const AppError = require('../utils/appError.js');

const getAllTicketsInQueue= async (queueId,limit = 10, page = 1)=>{
    const skip = (page - 1) * limit;
    const tickets = await Ticket.find({queue:queueId},{'__v':false}).limit(limit).skip(skip);
    if(!tickets){
        throw new AppError('no tickets found or queue id is not exist',404,'fail');
    }
    return tickets;
}

const createTicket = async (currentUserId,queueId,status) =>{
    const queue = await Queue.findOne({_id:queueId,status:'open'},{'__v':false});
    if(!queue){
        throw new AppError('cannot find queue or it has been closed!',404,'fail');
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

const createQueue = async (name,createdBy,capacity,status)=>{
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

const updateQueue = async (queueId, userId, data)=>{
    const queue = await Queue.findOne({_id:queueId,createdBy:userId},{'__v':false});
    if(!queue){
        throw new AppError('no queue found!',404,'fail');
    }
    const validOptions = ['name','capacity','status'];
    const updates = {};
    for (const element of validOptions) {
        if(data[element]){
            updates[element] = data[element];
        }
    }
    const updatedQueue = await Queue.findByIdAndUpdate(queueId,updates,{returnDocument:'after',runValidators:true});
    return updatedQueue;
}

const cancelTicket = async (ticketId,userId)=>{//rather than delete
    const ticket = await Ticket.findOne({_id:ticketId,owner:userId,status:'waiting'});
    if(!ticket){
        throw new AppError('no tickets found',404,'fail');
    }
    const canceledTicket = await Ticket.findByIdAndUpdate(ticketId,{status:'canceled'},{returnDocument:'after',runValidators:true});
    return canceledTicket;
}

const toggleQueueStatus = async (queueId, userId)=>{
    const queue = await Queue.findOne({_id:queueId, createdBy: userId});
    if(!queue){
        throw new AppError('no queue found!',404,'fail');
    }
    let newStatus = 'open';
    if(queue.status === 'open'){
        newStatus = 'closed';
    }
    const updatedQueue = await Queue.findByIdAndUpdate(queueId,{status:newStatus},{runValidators:true, returnDocument:'after'});
    return updatedQueue;
}

/**
 * @todo activate queue
 * @method post
 * @description change the first ticket status in the queue to 'serving' if it wasn't canceled,
 * or skip to next one!
 * @params queueId
 */



/**
 * @todo swap to next ticket
 * @method post
 * @description swap to the ticket which have the same id of current ticket in 'prev' attribut
 * if it wasn't canceled or skip to next one!
 * @params queueId
 */

module.exports = {
    createTicket,
    createQueue,
    getAllTicketsInQueue,
    updateQueue,
    cancelTicket,
    toggleQueueStatus
};