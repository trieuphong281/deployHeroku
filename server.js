require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const cron = require('node-schedule');

const jwt = require('./app/helpers/jwt');
const errorHandler = require('./app/helpers/error-handler');
const songService = require('./app/services/song.service');
const userService = require('./app/services/user.service');
const scheduledTime = require('./app/configs/config.json').scheduledTime;
const timeComparer = require('./app/helpers/timechecker');

let playlistSchedule = [];
let playlist;
let currentSong = undefined;

module.exports = { io };

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
app.use(jwt.jwt());

// api routes
app.get('/api', (req, res) => {
    res.send({ msg: 'Hello! Server is up and running' });
});
//socket io test routes
app.get('/socket-io', (req, res) => {
    res.sendFile('socket-test.html', { root: __dirname });
});

app.use('/api/users', require('./app/controllers/users.controller'));

app.use('/api/songs', require('./app/controllers/songs.controller'));

// catch all route
app.all('*', (req, res) => {
    res.status(404).send({ msg: 'Not Found' });
});


// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 3000;
server.listen(port, function () {
    console.log('Server listening on port ' + port);
    const resetSchedule = new cron.RecurrenceRule();
    resetSchedule.hour = 23;
    resetSchedule.minute = 59;
    resetSchedule.second = 59;
    // cron.scheduleJob(resetSchedule, function resetDatabase() {
    //     songService.resetSongCollection();
    //     userService.resetUserCollection();
    // });
    playlistSchedule[0] = new cron.RecurrenceRule();
    playlistSchedule[0].hour = scheduledTime.hour;
    playlistSchedule[0].minute = scheduledTime.minute;
    playlistSchedule[0].second = scheduledTime.second;
    cron.scheduleJob(playlistSchedule[0], async function setPlaylistSchedule() {
        playlistSchedule[0].minute += 1;
        playlistSchedule[0].second = 0;
        playlist = (await songService.getPlaylist()).message;
        let remainingTime = 23400;
        for (let i = 1; i <= playlist.length; i++) {
            if (remainingTime - playlist[i - 1].duration <= 0)
                break;
            // const duration = playlist[i - 1].duration;
            const duration = 15;
            const hour = (duration / 3600 | 0);
            const minute = ((duration - 3600 * hour) / 60 | 0);
            const sec = duration - 3600 * hour - 60 * minute;
            playlistSchedule[i] = new cron.RecurrenceRule();
            playlistSchedule[i].hour = playlistSchedule[i - 1].hour + hour;
            playlistSchedule[i].minute = playlistSchedule[i - 1].minute + minute;
            playlistSchedule[i].second = playlistSchedule[i - 1].second + sec;
            if (playlistSchedule[i].second >= 60) {
                playlistSchedule[i].second = playlistSchedule[i].second % 60;
                playlistSchedule[i].minute += 1;
            }
            if (playlistSchedule[i].minute >= 60) {
                playlistSchedule[i].minute = playlistSchedule[i].minute % 60;
                playlistSchedule[i].hour += 1;
            }
            playlist[i - 1].startAt = {
                hour: playlistSchedule[i - 1].hour,
                minute: playlistSchedule[i - 1].minute,
                second: playlistSchedule[i - 1].second
            }
            remainingTime -= playlist[i - 1].duration;
        }
        currentSong = playlist[0];
        for (let i = 0; i < playlistSchedule.length - 1; i++) {
            cron.scheduleJob(playlistSchedule[i], function () {
                io.sockets.emit('play', playlist[i]);
                currentSong = playlist[i];
            });
        }
        cron.scheduleJob(playlistSchedule[playlistSchedule.length - 1], function () {
            io.sockets.emit('end', "Playlist has been completely played");
            currentSong = "All over";
        });
    })
});

io.sockets.on('connection', async function (socket) {
    // handle users that enter the app after 17:30 pm
    if (timeComparer.isAfterASchedule(playlistSchedule[0].hour, playlistSchedule[0].minute, playlistSchedule[0].second)) {
        // handle users that enter the app after the playlist finished
        let endTime = playlistSchedule[playlistSchedule.length - 1];
        if (timeComparer.isAfterASchedule(endTime.hour, endTime.minute, endTime.second)) {
            socket.emit('end', "Finished playing videos !!!");
        } else {
            socket.emit('play', currentSong);
        }
    }

});

