const Queue = require('../models/queueModel.js');

const createQueue = async(name,capacity,status,createdBy)=>{
    const newQueueData = {
        name,
        capacity,
        status,
        createdBy
    }
    const newQueue = new Queue(newQueueData);
    await newQueue.save();
    return newQueue;
}

const getAllQueues = async(limit = 10,skip = 0)=>{
    const queues = await Queue.find({},{"__v":false,"password":false}).limit(limit).skip(skip).pobulate('createdBy','_id firstName lastName email');
    return queues;
}

const getQueueById = async(queueId) =>{
    const queue = await Queue.findById(queueId,{"__v":false,"password":false}).pobulate('createdBy','_id firstName lastName email');
    return queue;
}

const getQueuetByCurrentTurn= async (currentTurn)=>{
    const queue = await Queue.find({currentTurn}).pobulate('createdBy','_id firstName lastName email');
    return queue;
}

const getQueuesByManagerId = async(createdBy,limit = 10, skip = 0)=>{
    const queues = await Queue.find({createdBy},{"__v":false,"password":false}).limit(limit).skip(skip).pobulate('createdBy','_id firstName lastName email');
    return queues;
}

const deleteQueueById = async (queueId)=>{
    const queueToDelete = await Queue.findByIdAndDelete(queueId);
    return queueToDelete;
}

const updateQueueById = async (queueId,data)=>{
    const updatedQueue = await Queue.findByIdAndUpdate(queueId,data,{runValidator:true,returnDocument:'after'});
    return updatedQueue;
}

module.exports = {
    createQueue,
    getAllQueues,
    getQueueById,
    getQueuetByCurrentTurn,
    getQueuesByManagerId,
    deleteQueueById,
    updateQueueById
}
