require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoDBConnection = require('./config/mongoDB.js');
const service = require('./services/queue.services.js');
const app = express();
const port = process.env.PORT;
mongoDBConnection();

//middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

//service.createQueue('botato','6abacbd3c9e33e4d9bdbc57c',10,'available');
//service.createTicket('6abaa2960aa56408e0e62621','6abe44afb6a9a6d80e0d0b6f');

//routes
app.use('/api/auth',require('./routes/auth.routes.js'));
app.use('/api/queues',require('./routes/queues.routes.js'));

app.all(/.*/,require('./middlewares/errorHandlers.js').notFoundError);
app.use(require('./middlewares/errorHandlers.js').globalErrorHaindler);

app.listen(port,()=>{
    console.log(`listening on port ${port}`);    
})