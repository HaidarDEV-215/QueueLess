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
    }
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Ticket',ticketSchema);