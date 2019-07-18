const express = require('express');
const router = express.Router();
const songService = require('../services/song.service');
const db = require('../helpers/db');
const jwt = require('../helpers/jwt');
const server = require('../../server');
// routes
router.get('/search/:query', searchByQuery);
router.get('/playlist', getPlayList);
router.get('/get/:id', getSongById);
router.post('/add/', addToList);
router.post('/vote/', votingSong);

module.exports = router;

async function addToList(req, res) {
    if (songService.isAfterScheduleTime()) {
        return res.status(400).json("Out of scheduled Time");
    }
    const user = await jwt.isValid(req);
    if (user) {
        songService.addSongToList(req.body, user.username)
            .then(msg => {
                if (msg.message === 'Sucessfully Added')
                    server.io.sockets.emit('voted', "Song's been voted!");
                res.status(msg.status).json(msg.message);
            })
            .catch(err => res.status(400).send(err));
    } else {
        res.status(401).json({ message: "Invalid TOKEN!!!" });
    }
}

async function searchByQuery(req, res) {
    if (songService.isAfterScheduleTime()) {
        return res.status(400).json("Out of scheduled Time");
    }
    songService.searchSongs(req.params.query, req.query.page)
        .then(msg => res.status(msg.status).json(msg.message))
        .catch(err => res.status(400).send(err));
}
async function getSongById(req, res) {
    songService.getSong(req.params.id)
        .then(msg => res.status(msg.status).json(msg.message))
        .catch(err => next(err));
}
async function votingSong(req, res) {   // upvote-downvote:true-false
    if (songService.isAfterScheduleTime()) {
        return res.status(400).json("Out of scheduled Time");
    }
    const user = await jwt.isValid(req);
    if (user) {
        songService.voteASong(req.body, user.username)
            .then(msg => {
                if (msg.message === 'Successfully voted')
                    server.io.sockets.emit('added', "Song's been voted!");
                res.status(msg.status).json(msg.message);
            })
            .catch(err => res.status(400).send(err));
    } else {
        res.status(401).json({ message: "Invalid TOKEN!!!" });
    }
}

async function getPlayList(req, res) {
    songService.getPlaylist()
        .then(msg => res.status(msg.status).json(msg.message))
        .catch(err => res.status(400).send(err));
}


