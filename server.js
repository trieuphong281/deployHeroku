require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('./app/helpers/jwt');
const errorHandler = require('./app/helpers/error-handler');
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const cron = require('node-schedule');
const songService = require('./app/services/song.service');
const userService = require('./app/services/user.service');
const config = require('./app/configs/config.json');
let schuduleTime = [];
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
    schuduleTime[0] = new cron.RecurrenceRule();
    schuduleTime[0].hour = config.scheduledTime.hour;
    schuduleTime[0].minute = config.scheduledTime.minute;
    schuduleTime[0].second = config.scheduledTime.second;
    cron.scheduleJob(schuduleTime[0], async function setPlaylistSchedule() {
        playlist = (await songService.getPlaylist()).message;
        let remainingTime = 23400;
        for (let i = 1; i <= playlist.length; i++) {
            if (remainingTime - playlist[i - 1].duration <= 0)
                break;
            // const duration = playlist[i - 1].duration;
            const duration = 10;
            const hour = (duration / 3600 | 0);
            const minute = ((duration - 3600 * hour) / 60 | 0);
            const sec = duration - 3600 * hour - 60 * minute;
            schuduleTime[i] = new cron.RecurrenceRule();
            schuduleTime[i].hour = schuduleTime[i - 1].hour + hour;
            schuduleTime[i].minute = schuduleTime[i - 1].minute + minute;
            schuduleTime[i].second = schuduleTime[i - 1].second + sec;
            if (schuduleTime[i].second >= 60) {
                schuduleTime[i].second = schuduleTime[i].second % 60;
                schuduleTime[i].minute += 1;
            }
            if (schuduleTime[i].minute >= 60) {
                schuduleTime[i].minute = schuduleTime[i].minute % 60;
                schuduleTime[i].hour += 1;
            }
            playlist[i - 1].startAt = {
                hour: schuduleTime[i - 1].hour,
                minute: schuduleTime[i - 1].minute,
                second: schuduleTime[i - 1].second
            }
            remainingTime -= playlist[i - 1].duration;
        }
        schuduleTime[0].second += 5;
        currentSong = playlist[0];
        for (let i = 0; i < schuduleTime.length - 1; i++) {
            cron.scheduleJob(schuduleTime[i], function () {
                io.sockets.emit('play', playlist[i]);
                currentSong = playlist[i];
            });
        }
        cron.scheduleJob(schuduleTime[schuduleTime.length - 1], function () {
            io.sockets.emit('end', "Playlist has been completely played");
        });
    })
});

//socket io test routes
app.get('/socket-io', (req, res) => {
    res.sendFile('socket-test.html');
});

io.sockets.on('connection', async function (socket) {
    let now = new Date();
    if (now.getHours() >= schuduleTime[0].hour && now.getMinutes() >= schuduleTime[0].minute) {
        socket.emit('play', currentSong);
    }
    if (now.getHours() >= schuduleTime[schuduleTime.length - 1].hour && now.getMinutes() >= schuduleTime[schuduleTime.length - 1].minute) {
        socket.emit('end', "Playlist has been completely played");
    }
});