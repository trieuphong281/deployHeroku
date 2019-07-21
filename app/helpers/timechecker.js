const scheduledTime = require('../configs/config.json').scheduledTime;
const moment = require('moment');
const cron = require('node-schedule');
module.exports = {
    isAfterScheduledTime,
    isAfterASchedule
};

function isAfterScheduledTime() {
    return moment().isAfter(moment(`${scheduledTime.hour}:${scheduledTime.minute}:${scheduledTime.second}:`, 'hh:mm:ss'));
}

function isAfterASchedule(hour, minute, second) {
    return moment().isAfter(moment(`${hour}:${minute}:${second}:`, 'hh:mm:ss'));
}


// function isAfterScheduledTime() {
//     const now = new Date();
//     return ((now.getHours() === config.scheduledTime.hour ? (now.getMinutes() === config.scheduledTime.minute ? now.getSeconds() >= scheduledTime.second : now.getMinutes() > config.scheduledTime.minute) : now.getHours() > config.scheduledTime.hour));
// }

// function isAfterASchedule(hour, minute, second) {
//     const now = new Date();
//     return ((now.getHours() === hour ? (now.getMinutes() === minute ? now.getSeconds() >= second : now.getMinutes() > minute) : now.getHours() > hour));
// }