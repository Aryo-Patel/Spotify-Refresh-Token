const router = require('express').Router();
const config = require('config');
const querystring = require('querystring');
const request = require('request');
const cors = require('cors');
const cookieParser = require('cookie-parser');

//Recieving client info
const client_id = config.get('CLIENT_ID');
const client_secret = config.get('CLIENT_SECRET');
const redirect_uri = config.get('REDIRECT_URI');

//Getting the model we are working with
const User = require('../models/User');
//spotify native functions that are necessary to run the code
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
  
var stateKey = 'spotify_auth_state';



router.get('/login', function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);
  
    // your application requests authorization
    var scope = 'user-read-private user-read-email user-read-recently-played user-read-currently-playing';
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
});
router.get('/callback', function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter
  
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;
  
    if (state === null || state !== storedState) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      res.clearCookie(stateKey);
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
      };
      
      //my code goes inside this function
      request.post(authOptions, async function(error, response, body) {
        if (!error && response.statusCode === 200) {
  
          var access_token = body.access_token,
              refresh_token = body.refresh_token;
          

          
          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };
          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            //console.log(body);
            
          });
          

          /*
          ~~~~~~~~~MY CODE BEGINS~~~~~~~~~~~~~~~
          */

          //Grab user info
          let userInfo;
          try{
            userInfo = await fetchUserData(options);
          }catch(err){
            console.log(err)
          }

          console.log(userInfo);
          //Save User to the Database
          try{
            let user;

            user = await User.findOne({email: userInfo.email});
            
            if(!user){

              //instantiate new user fields
              let newUser = new User({
                name: userInfo.display_name,
                email: userInfo.email,
                uri: userInfo.uri,
                access_token: access_token,
                refresh_token: refresh_token
              });

              await newUser.save();
            }
          }catch(err){
            console.log(err);
          }
          /*
          ~~~~~~~~~MY CODE ENDS~~~~~~~~~~~~~~~~~
          */



          // we can also pass the token to the browser to make requests from there
          res.redirect('/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token
            }));
        } else {
          res.redirect('/#' +
            querystring.stringify({
              error: 'invalid_token'
            }));
        }
      });
    }
});
  
router.get('/refresh_token', function(req, res) {
  
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({
          'access_token': access_token
        });
      }
    });
});

async function fetchUserData(options) {
  return new Promise((resolve, reject) => {
      request.get(options, function (error, response, body) {
          resolve(body);
      })
  });
}

module.exports = router;