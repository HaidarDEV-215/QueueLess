const mongoose = require('mongoose');

module.exports = async ()=>{
    try {
        await mongoose.connect(process.env.mongoDB_URI);
        console.log("mongoDB is connecting...");
    } catch (error) {
        console.error('error database connection!',error);
    }
}