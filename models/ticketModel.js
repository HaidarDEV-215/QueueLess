const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema({
    status:{
        type:String,
        default:'available',
        enum:['available','closed']
    },
    owner:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    queue:{
        type:mongoose.Schema.ObjectId,
        ref:'Queue',
        required:true
    },
    prev:{
        type:mongoose.Schema.ObjectId,
        ref:'Ticket',
        default:null
    }
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Ticket',ticketSchema);