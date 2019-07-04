const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        trim: true,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: true
    },
    vote: {
        type: Number,
        default: 5
    },
    songAdd: {
        type: Number,
        default: 1
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    token: {
        default : null,
        type: String,
    }

});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', schema);