const mongoose = require('mongoose');

const queueSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    capacity:{
        type:Number,
        default:10
    },
    status:{
        type:String,
        default:'available',
        enum:['available','closed']
    },
    createdBy:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    currentTurn:{
        type:mongoose.Schema.ObjectId,
        ref:'Ticket'
    }
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Queue',queueSchema);