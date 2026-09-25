const Ticket = require('../models/ticketModel.js');

const createTicket = async(owner,queue,prev)=>{
    const ticketData = {
        owner,
        queue,
        prev   
    };
    const newTicket = new Ticket(ticketData);
    await newTicket.save();
    return newTicket;
}

const getAllTeckets = async(limit = 10,skip = 0)=>{
    const tickets = await Ticket.find({},{"__v":false,"password":false}).limit(limit).skip(skip).pobulate('owner','_id firstName lastName email');
    return tickets;
}

const getTicketById = async(ticketId) =>{
    const ticket = await Ticket.findById(ticketId,{"__v":false,"password":false}).pobulate('owner','_id firstName lastName email');
    return ticket;
}

const getTicketByOwnerAndQueueId = async (owner,queue)=>{
    const ticket = await Ticket.findOne({$and:[{owner},{queue}]}).pobulate('owner','_id firstName lastName email');
    return ticket;
}

const getTicketsByOwnerId = async(owner,limit = 10, skip = 0)=>{
    const tickets = await Ticket.find({owner},{"__v":false,"password":false}).limit(limit).skip(skip).pobulate('owner','_id firstName lastName email');
    return tickets;
}

const getTicketsByQueueId = async(queue,limit = 10, skip = 0)=>{
    const tickets = await Ticket.find({queue},{"__v":false,"password":false}).limit(limit).skip(skip).pobulate('owner','_id firstName lastName email');
    return tickets;
}

const deleteTicketById = async (ticketId)=>{
    const ticketToDelete = await Ticket.findByIdAndDelete(ticketId);
    return ticketToDelete;
}

const updateTicketById = async (ticketId,data)=>{
    const updatedTicket = await Ticket.findByIdAndUpdate(ticketId,data,{runValidator:true,returnDocument:'after'});
    return updatedTicket;
}

/**
 * @todo get leatest ticket in a queue by Queue ID
 */

module.exports = {
    createTicket,
    getAllTeckets,
    getTicketById,
    getTicketByOwnerAndQueueId,
    getTicketsByOwnerId,
    getTicketsByQueueId,
    deleteTicketById,
    updateTicketById
}
