const mongoose = require('mongoose');

module.exports =async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log('mongoDB is connecting...');        
    }
    catch(error){
        console.error(error);
        process.exit(1);
    }
}