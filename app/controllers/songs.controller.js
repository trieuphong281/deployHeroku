const express = require('express');
const router = express.Router();
const songService = require('../services/song.service');
const db = require('../helpers/db');
const jwt = require('../helpers/jwt');
const User = db.User;

// routes
router.get('/search/:query', searchByQuery);
router.get('/get/list', getPlayList);
router.get('/get/:id', getSongById);
router.post('/add/', addToList);
router.post('/vote/', votingSong);
router.post('/remove', removeSongFinished);



module.exports = router;

async function addToList(req, res) {
    const user = await jwt.isValid(req);
    if (user) {
        songService.addSongToList(req.body, user.username)
            .then(song => res.status(song.status).json(song.message))
            .catch(err => res.status(400).send(err));
    } else {
        res.status(401).json({ message: "Invalid TOKEN!!!" });
    }
}

async function searchByQuery(req, res) {
    songService.searchSongs(req.params.query)
        .then(msg => res.status(msg.status).json(msg.message))
        .catch(err => res.status(400).send(err));
}
async function getSongById(req, res) {
    if (await jwt.isValid(req)) {
        songService.getSong(req.params.id)
            .then(msg => res.status(msg.status).json(msg.message))
            .catch(err => next(err));
    } else {
        res.status(401).json({ message: "Invalid TOKEN!!!" });
    }
}
async function votingSong(req, res) {   // upvote-downvote:true-false
    const user = await jwt.isValid(req);
    if (user) {
        songService.voteASong(req.body, user.username)
            .then(msg => res.status(msg.status).json(msg.message))
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

async function removeSongFinished(req, res) {
    songService.removeFinishedSong(req.body)
        .then(msg => res.status(msg.status).json(msg.message))
        .catch(err => res.status(400).send(err));
}
