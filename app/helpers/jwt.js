const expressJwt = require('express-jwt');
const config = require('../configs/config.json');
const userService = require('../services/user.service');
const db = require('../helpers/db');
const User = db.User;

module.exports = {
    jwt,
    isValid
};

function jwt() {
    const secret = config.secret;
    return expressJwt({ secret, isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            '/api/users/authenticate',
            '/api/users/register',
            '/api',
            '/api/songs/get/list',
            '/api/songs/remove',            
            /^\/api\/songs\/get\/.*/,
            /^\/api\/songs\/search\/.*/,
        ]
    });
}

async function isRevoked(req, payload, done) {
    const user = await userService.getById(payload.sub);
    // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }
    done();
};

async function isValid(req) {
    try {
    var token = req.headers.authorization.split('Bearer ')[1];
        const user = await User.findOne({ token });
        if (user.token) {
            return user;
        }
    } catch {
        return null;
    }
}