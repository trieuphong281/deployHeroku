const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    videoId: {
        type: String,
        trim : true, 
        required: true 
    },
    title: { 
        type: String, 
        trim : true, 
        required: true
    },
    channelTitle: { 
        type: String, 
        required: true
    },
    addedUser: {
        type: String,
        required: true,
    },
    upvote: { 
        type: Number,
        default: 0
    },
    downvote: { 
        type: Number,
        default: 0
    },
    thumbnails: {
        type: String,
        trim : true
    },
    dateAdd: { 
        type: Date,
        default: Date.now,
    }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Song', schema);