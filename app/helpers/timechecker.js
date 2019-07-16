const config = require('../configs/config.json');
// const moment = require('moment');
module.exports = {
    isAfter
};

// function isAfterScheduleTime() {
//     const requestTime = moment();
//     const scheduleTime = moment('9:40', 'hh:mm');
//     return requestTime.isAfter(scheduleTime);
// }

function isAfter() {
    const requestTime = new Date();
    return (requestTime.getHours() >= config.scheduledTime.hour && requestTime.getMinutes() >= config.scheduledTime.minute);
}