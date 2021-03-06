﻿const express = require('express');
const router = express.Router();
const songService = require('../services/song.service');
const jwt = require('../helpers/jwt');
const server = require('../../server');
const isDisable = require('../helpers/timechecker').isAfterScheduledTime;
// routes
router.get('/search/:searchingText', isDisable, searchByQuery);
router.get('/playlist', getPlayList);
router.post('/add/', isDisable, addToList);
router.post('/vote/', isDisable, votingSong);

module.exports = router;

async function addToList(req, res) {
    const user = await jwt.isValid(req);
    if (user) {
        songService.addSongToList(req.body, user.username)
            .then(msg => {
                if (msg === 'Sucessfully Added')
                    server.io.sockets.emit('playlist', "Song's been voted!");
                res.status(200).json({ message: msg });
            })
            .catch(err => res.status(400).json({ message: err }));
    } else {
        res.status(401).json({ message: "Invalid TOKEN!!!" });
    }

}

async function searchByQuery(req, res) {
    songService.searchSongs(req.params.searchingText, req.query.page)
        .then(msg => res.status(200).json({ message: msg }))
        .catch(err => res.status(400).json({ message: err }));
}

async function votingSong(req, res) {   // upvote-downvote:true-false
    const user = await jwt.isValid(req);
    if (user) {
        songService.voteASong(req.body, user.username)
            .then(msg => {
                if (msg === 'Successfully voted')
                    server.io.sockets.emit('playlist', "Song's been voted!");
                res.status(200).json({ message: msg });
            })
            .catch(err => res.status(400).send({ message: err }));
    } else {
        res.status(401).json({ message: "Invalid TOKEN!!!" });
    }
}

async function getPlayList(req, res) {
    songService.getPlaylist()
        .then(msg => res.status(200).json({ message: msg }))
        .catch(err => res.status(400).json({ message: err }));
}


