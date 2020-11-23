const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    last_update: {
        type: Date,
        default: Date.now()
    },
    email: {
        type: String,
        required: true
    },
    uri: {
        type: String,
        required: true
    },
    played_tracks: [{
        uri: {
            type: String
        },
        time_stamp: {
            type: Date
        }
    }],
    access_token: {
        type: String,
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    }
})

const User = new mongoose.model("Users", userSchema);

module.exports = User;