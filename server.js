require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

module.exports = { io };

const jwt = require('./app/helpers/jwt');
const errorHandler = require('./app/helpers/error-handler');
const playlistScheduler = require('./app/socket/playlistscheduler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
app.use(jwt.jwt());

// api routes
app.get('/api', (req, res) => {
    res.send({ message: 'Hello! Server is up and running' });
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
playlistScheduler.serverSchedule();
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 3000;
server.listen(port, function () {
    console.log('Server listening on port ' + port);
});

io.sockets.on('connection', async function (socket) {
    playlistScheduler.socketHandler(socket);
});

