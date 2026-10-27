require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoDBConnection = require('./config/mongoDB.js');
const rateLimit = require('./middlewares/rateLimits.js');


const app = express();
const port = process.env.PORT;

//middlewares
app.use(rateLimit.requestLimiter);
app.use(cors());
app.use(helmet());
app.use(express.json());


//routes
app.use('/api/auth',require('./routes/auth.routes.js'));
app.use('/api/queues',require('./routes/queues.routes.js'));
app.use('/api/accounts',require('./routes/users.routes.js'));
app.use('/api/admin',require('./routes/admin.routes.js'));
app.use('/api/manager',require('./routes/manager.routes.js'));


//error handlers
app.all(/.*/,require('./middlewares/errorHandlers.js').notFoundError);
app.use(require('./middlewares/errorHandlers.js').globalErrorHaindler);

const startServer = async()=>{
    try{
        await mongoDBConnection();
        app.listen(port,()=>{
            console.log(`listining on port ${port}`);
        });
    }catch(error){
        console.error('failed to start application:\n', error);
        process.exit(1);
    }
}

startServer();