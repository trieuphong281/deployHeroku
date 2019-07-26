const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const { check, validationResult } = require('express-validator');
const jwt = require('../helpers/jwt');

// routes
router.post('/authenticate', authenticate);
router.post('/logout', logout);
router.post('/register', validate('register'), register);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/update', validate('update'), update);
router.put('/changepassword', validate('changepassword'), changepassword);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res) {
    userService.authenticate(req.body)
        .then(user => user ? res.json({ message: user }) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => res.status(400).json({ message: err }));
}
// processing
function logout(req, res) {
    userService.logout(req.body)
        .then(msg => res.status(200).json({ message: msg }))
        .catch(err => res.status(400).json({ message: err }));
}
// processing
function register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: errors.array() });
    }
    userService.create(req.body)
        .then(() => res.status(201).json({ message: "User successfully created !!!" }))
        .catch(err => res.status(400).json({ message: err }));
}
function getCurrent(req, res) {
    userService.getById(req.user.sub)
        .then(user => user ? res.status(200).json({ message: user }) : res.status(404).json({ message: "Current user not found" }))
        .catch(err => res.status(400).json({ message: err }));
}

function getById(req, res) {
    userService.getById(req.params.id)
        .then(user => user ? res.status(200).json({ message: user }) : res.status(404).json({ message: "User not found" }))
        .catch(err => res.status(400).json({ message: err }));
}

async function update(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: errors.array() });
    }
    try {
        const user = await jwt.isValid(req);
        await userService.update(req.body, user.id);
        res.status(200).json({ message: "User successfully updated !!!" });
    } catch (error) {
        res.status(400).json({ message: error });
    }
}
async function changepassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: errors.array() });
    }
    try {
        const user = await jwt.isValid(req);
        await userService.changepassword(req.body, user.id);
        res.status(200).json({ message: "User successfully updated !!!" });
    } catch (error) {
        res.status(400).json({ message: error })
    }
}
function _delete(req, res) {
    userService.delete(req.params.id)
        .then(() => res.send({ message: "User successfully deleted !!!" }))
        .catch(err => res.status(400).json({ message: err }));
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
                check('username', 'Input username minimum length is 8 characters').optional().isLength({ min: 8 }),
                check('email', 'Invalid email').optional().isEmail(),
            ]
        }
        case 'changepassword': {
            return [
                check('oldPassword', 'Input password minimum length is 8 characters').exists().isLength({ min: 8 }),
                check('newPassword', 'Input password minimum length is 8 characters').exists().isLength({ min: 8 })
            ]
        }
    }
}