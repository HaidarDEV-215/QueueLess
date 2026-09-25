require('dotenv').config();
const express = require("express");
const mongoConnection = require('./config/mongoConnection.js');

mongoConnection();
const app = express();
const port = process.env.PORT;





app.listen(port,()=>{
    console.log(`listen on port ${port}`);    
})