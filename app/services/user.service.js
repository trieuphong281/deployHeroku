const config = require('../configs/config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../helpers/db');
const User = db.User;

module.exports = {
    authenticate,
    logout,
    getById,
    create,
    update,
    delete: _delete,
    resetUserCollection,
    changepassword
};

async function authenticate({ username, password }) {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const { hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id }, config.secret, { expiresIn: '1d' });
        userWithoutHash.token = token;
        user.token = token;
        await user.save()
        return {
            ...userWithoutHash,
        };
    }
}
// processing
async function logout({ username }) {
    // Log user out of the application
    try {
        const user = await User.findOne({ username });
        user.token = null;
        await user.save();
        return "Successfully Logout";
    } catch (error) {
        throw error;
    }
}
// processing
async function getById(id) {
    return await User.findById(id).select('-hash');
}

async function create(userParam) {
    // validate
    if (await User.findOne({ username: userParam.username })) {
        throw `Username is already taken`;
    }
    if (await User.findOne({ email: userParam.email })) {
        throw `Email is already taken`;
    }
    const checkString = JSON.stringify({
        username: userParam.username,
        password: userParam.password
    });
    if (/\s/.test(checkString)) {
        throw 'Input contains space';
    }
    const user = new User(userParam);

    // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save user
    await user.save();
}

async function update(userParam, id) {
    const user = await User.findById(id);
    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username ' + userParam.username + ' is already taken';
    }
    if (user.email !== userParam.email && await User.findOne({ email: userParam.email })) {
        throw 'Email ' + userParam.email + ' is already taken';
    }
    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }
    // copy userParam properties to user
    Object.assign(user, userParam);
    await user.save();
}
async function changepassword(userParam, id) {
    const user = await User.findById(id);
    // validate
    if (!user) throw 'User not found';
    if (!bcrypt.compareSync(userParam.oldPassword, user.hash))
        throw 'Old password is incorrect';
    user.hash = bcrypt.hashSync(userParam.newPassword, 10);
    await user.save();
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
}
async function resetUserCollection() {
    await User.find({}, function (err, users) {
        if (err) throw err;
        users.forEach(function (user) {
            user.vote = 5;
            user.songAdd = 1;
            user.save();
        })
    });
}