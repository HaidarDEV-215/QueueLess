require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoDBConnection = require('./config/mongoDB.js');

const app = express();
const port = process.env.PORT;
mongoDBConnection();

//middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

//routes
app.use('/api/auth',require('./routes/auth.routes.js'));


app.all(/.*/,require('./middlewares/errorHandlers.js').notFoundError);
app.use(require('./middlewares/errorHandlers.js').globalErrorHaindler);

app.listen(port,()=>{
    console.log(`listening on port ${port}`);    
})