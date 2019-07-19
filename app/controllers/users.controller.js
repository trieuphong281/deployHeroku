const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const { check, validationResult } = require('express-validator');
const jwt = require('../helpers/jwt');

// routes
router.post('/authenticate', authenticate);
router.post('/logout', logout);
router.post('/register', validate('register'), register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/update', validate('update'), update);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}
// processing
function logout(req, res, next) {
    userService.logout(req.body)
        .then(msg => res.send(msg))
        .catch(err => next(err));
}
// processing
function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.send("User successfully created !!!"))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

async function update(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    try {
        const user = await jwt.isValid(req);
        await userService.update(req.body, user.id);
        res.status(200).json("User successfully updated !!!");
    } catch (error) {
        res.status(400).json({ message: error })
    }
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.send("User successfully deleted !!!"))
        .catch(err => next(err));
}
function validate(method) {
    switch (method) {
        case 'register': {
            return [
                check('username', 'Input username minimum length is 8 characters').exists().isLength({ min: 8 }),
                check('email', 'Invalid email').exists().isEmail(),
                check('password', 'Input password minimum length is 8 characters').exists().isLength({ min: 8 })
            ]
        }
        case 'update': {
            return [
                check('username', 'Input username minimum length is 8 characters').isLength({ min: 8 }),
                check('email', 'Invalid email').isEmail(),
                check('password', 'Input password minimum length is 8 characters').isLength({ min: 8 })
            ]
        }
    }
}