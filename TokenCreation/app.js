//express, nodemon, config, mongoose, request
const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const User = require('./models/User');
const app = express();



//connecting to MONGO DB
const MONGO_URI = config.get('MONGO_URI');

const mongooseSetup = async() => {
    try{
        await mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
        console.log('connected to database');
    }catch(err){
        console.log(err);
    }
}
mongooseSetup();

//loading main page
app.use(express.static(__dirname + '/public')).use(cors()).use(cookieParser()).use(express.json());


//setting up routers
const spotifyRouter = require('./routes/spotify');
app.use('/', spotifyRouter);

//starting server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})
