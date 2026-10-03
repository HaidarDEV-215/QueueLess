const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    queue: {
        type: mongoose.Schema.ObjectId,
        ref: 'Queue',
        required: true
    },
    prev: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ticket',
    },
    status: {
        type: String,
        enum: ['waiting', 'serving', 'canceled', 'finished'],
        default: 'waiting'
    },
    isCheckedBySystem:{
        type:Boolean,
        default:false
    }
}, {
    timestamps: true
})

ticketSchema.index({ prev: 1,queue:1 }, {unique : true,sparse: true });

/**
 * {prev:1} : ترتيب تصاعدي
 */

/**
 * sparse: true: تجعل الفهرس يُطبق فقط على المستندات (Documents) 
 * التي تحتوى فعلياً على الحقل prev وتتجاهل المستندات التي يكون فيها الحقل غير موجود أو null.
 * 
 * 
 * إذا كان الحقل prev اختيارياً أو يُترك فارغاً للتذكرة الأولى، يجب إضافة الخيار sparse: true:
 */

module.exports = mongoose.model('Ticket', ticketSchema);