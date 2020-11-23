const express = require('express');
const mongoose = require('mongoose');
const {mongoClient, MongoClient} = require('mongodb');
const app = express();
const config = require('config');
const request =require('request');
const cookieParser = require('cookie-parser');
const cors = require('cors');
app.set('view engine', 'ejs');

app.use(cors()).use(cookieParser()).use(express.json());


const MONGO_URI = config.get('MONGO_URI');
const client_id = config.get('CLIENT_ID');
const client_secret = config.get('CLIENT_SECRET');
const redirect_uri = config.get('REDIRECT_URI');

async function main(){
    const client = new MongoClient(MONGO_URI, {useUnifiedTopology: true, useNewUrlParser: true});
    const returnArray = [];
    try{
        await client.connect();

        let userCollection  = await client.db("SpotifyRefresh").collection("users").find()
        
        const userArr = await userCollection.toArray();

        userArr.forEach(async (user) => {
            let userAccessToken = user.access_token;
            let userRefreshToken = user.refresh_token;
            let userEmail = user.email;

            var refresh_token = userRefreshToken;
            var authOptions = {
              url: 'https://accounts.spotify.com/api/token',
              headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
              form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
              },
              json: true
            };
            let newAccessToken = await getNewToken(authOptions);
            console.log(newAccessToken);

            await client.db("SpotifyRefresh").collection("users").updateOne({email: userEmail}, {$set: {access_token: newAccessToken}});
            
        })
    }catch(err){
        console.log(err);
    }

    return returnArray;
}



async function getNewToken(authOptions){
    return new Promise((resolve, reject) =>{
        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
              var access_token = body.access_token;
              resolve(access_token);
            }
            else{
                reject('error in body');
            }
          });
    })
}

app.get('/', (req, res) => {
    res.render('pages/index');
});

app.get('/login', async (req, res) => {
    main().catch(console.error);
    res.redirect('/')
})

app.get('/test', async(req, res) => {
    
    res.redirect('/');
})

const port = process.env.PORT || 5001;

app.listen(port, () =>{
    console.log('connected to port ' + port);
})