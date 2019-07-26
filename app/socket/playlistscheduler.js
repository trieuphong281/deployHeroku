const server = require('../../server');
const cron = require('node-schedule');

let playlistSchedule = [];
let currentSong = undefined;
const songService = require('../services/song.service');
const userService = require('../services/user.service');
const scheduledTime = require('../configs/config.json').scheduledTime;
const timeComparer = require('../helpers/timechecker');
let playlist;
let endTime;

module.exports = {
    serverSchedule,
    socketHandler,
    pingHeroku
};

function serverSchedule() {
    resetDatabase();
    playthePlaylist();
}

async function resetDatabase() {
    const resetSchedule = new cron.RecurrenceRule();
    resetSchedule.hour = 23;
    resetSchedule.minute = 59;
    resetSchedule.second = 59;
    // cron.scheduleJob(resetSchedule, function resetDatabase() {
    //     await songService.resetSongCollection();
    //     await userService.resetUserCollection();
    // });
}
playlistSchedule[0] = new cron.RecurrenceRule();
playlistSchedule[0].hour = scheduledTime.hour;
playlistSchedule[0].minute = scheduledTime.minute;
playlistSchedule[0].second = scheduledTime.second;

function playthePlaylist() {
    cron.scheduleJob(playlistSchedule[0], async function setPlaylistSchedule() {
        playlistSchedule[0].minute += 1;
        playlistSchedule[0].second = 0;
        playlist = (await songService.getPlaylist()).message;
        let remainingTime = 23400;
        for (let i = 1; i <= playlist.length; i++) {
            if (remainingTime - playlist[i - 1].duration <= 0)
                break;
            const duration = playlist[i - 1].duration;
            // const duration = 10;
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
        endTime = playlistSchedule[playlistSchedule.length - 1];

        currentSong = playlist[0];
        for (let i = 0; i < playlistSchedule.length - 1; i++) {
            cron.scheduleJob(playlistSchedule[i], function () {
                server.io.sockets.emit('play', playlist[i]);
                currentSong = playlist[i];
            });
        }
        cron.scheduleJob(endTime, function () {
            server.io.sockets.emit('end', "Playlist has been completely played");
            currentSong = "All over";
        });
    })
}
function socketHandler(socket) {
    if (timeComparer.isAfterASchedule(playlistSchedule[0].hour, playlistSchedule[0].minute, playlistSchedule[0].second)) {
        if (timeComparer.isAfterASchedule(endTime.hour, endTime.minute, endTime.second)) {
            socket.emit('end', "Finished playing videos !!!");
        } else {
            socket.emit('play', currentSong);
        }
    }
}
function pingHeroku() {
    setInterval(function () {
        http.get("https://gorgeous-grand-teton-66654.herokuapp.com/api");
    }, 1740000);
}