const express = require('express');
const router = express.Router();
const songService = require('../services/song.service');
const db = require('../helpers/db');
const jwt = require('../helpers/jwt');
const User = db.User;

// routes
router.get('/search/:query', searchByQuery);
router.post('/add/', addToList);
router.post('/vote/', votingSong);

module.exports = router;

async function addToList(req, res) {
    const user = await jwt.isValid(req);
    if (user) {
        songService.add(req.body, user.username)
            .then(song => res.json(song))
            .catch(err => res.send(err));
    } else {
        res.send("Invalid TOKEN!!!");
    }
}

async function searchByQuery(req, res) {
    songService.search(req.params.query)
        .then(msg => res.set({'Content-Type': 'application/json; charset=utf-8'}).send(msg))
        .catch(err => res.send(err));
}

async function votingSong(req, res) {   // upvote-downvote:true-false
    const user = await jwt.isValid(req);
    if (user) {
        songService.vote(req.body, user.username)
            .then(msg => res.json(msg))
            .catch(err => res.send(err));
    } else {
        res.send("Invalid TOKEN!!!");
    }
}