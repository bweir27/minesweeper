import User from './user.model';
import config from '../../config/environment';
import jwt from 'jsonwebtoken';

function handleEntityNotFound(res) {
    return function(entity) {
        if(!entity) {
            res.status(404).end();
            return null;
        }
        return entity;
    };
}

function respondWithResult(res, statusCode) {
    statusCode = statusCode || 200;
    return function(entity) {
        if(entity) {
            return res.status(statusCode).json(entity);
        }
        return null;
    };
}

function validationError(res, statusCode) {
    statusCode = statusCode || 422;
    return function(err) {
        return res.status(statusCode).json(err);
    };
}

function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function(err) {
        return res.status(statusCode).send(err);
    };
}


/**
 * Get list of users
 * restriction: 'admin'
 */
export function index(req, res) {
    return User.find({}, '-salt -password').exec()
        .then(users => {
            res.status(200).json(users);
        })
        .catch(handleError(res));
}

/**
 * Creates a new user
 */
export function create(req, res) {
    let newUser = new User(req.body);
    let newUserToken = null;
    newUser.provider = 'local';
    newUser.role = 'user';
    let token = newUser.emailVerification.token;
    return newUser.save()
        .then(function(user) {
            newUserToken = jwt.sign({ _id: user._id, role: newUser.role }, config.secrets.session, {
                expiresIn: 60 * 60 * 5
            });
        })
        .then(() => res.json({ token: newUserToken }))
        .catch(handleError(res, 400));
}

/**
 * Get a single user
 */
export function show(req, res, next) {
    var userId = req.params.id;

    return User.findById(userId).exec()
        .then(user => {
            if(!user) {
                return res.status(404).end();
            }
            res.json(user.profile);
        })
        .catch(err => next(err));
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
export function destroy(req, res) {
    return User.findByIdAndRemove(req.params.id).exec()
        .then(function() {
            res.status(204).end();
        })
        .catch(handleError(res));
}

export function update(req, res) {
    // Start by trying to find the user by its id
    let userToUpdate = null;
    //dont allow email update or role change unless it's an admin making change
    if(req.user.role !== 'admin') {
        Reflect.deleteProperty(req.body, 'role');
        Reflect.deleteProperty(req.body, 'email');
    }
    User.findById(req.params.id, '-salt -password')
        .exec()
        // Update user and address
        .then(function(existingUser) {
            // If user exists, update all fields of the object
            if(existingUser) {
                existingUser = Object.assign(existingUser, req.body); //merge all the fields a user is updating into our update object
                userToUpdate = existingUser;
                return existingUser.increment().save();
            } else {
                // User was not found
                return Promise.reject('user not found');
            }
        })
        .then(function(savedUser) {
            if(savedUser) {
                res.status(200);
                res.json(userToUpdate);
            } else {
                // User was not found
                res.status(404);
                res.json({message: 'Not Found'});
            }
        })
        // Error encountered during the save of the user or address
        .catch(function(err) {
            res.status(400);
            res.send(err);
        });
}

/**
 * Change a users password
 */
export function changePassword(req, res) {
    var userId = req.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);

    return User.findById(userId).exec()
        .then(user => {
            if(user.authenticate(oldPass)) {
                user.password = newPass;
                return user.save()
                    .then(() => {
                        res.status(204).end();
                    })
                    .catch(validationError(res));
            } else {
                return res.status(403).end();
            }
        });
}

/**
 * Get my info
 */
export function me(req, res, next) {
    var userId = req.user._id;
    return User.findOne({ _id: userId }, '-salt -password').exec()
        .then(user => { // don't ever give out the password or salt
            if(!user) {
                return res.status(404).end();
            }
            return res.json(user);
        })
        .catch(err => next(err));
}

/**
 * Authentication callback
 */
export function authCallback(req, res) {
    res.redirect('/');
}


export function verifyUserEmail(req, res) {
    let email = req.params.email;
    let token = req.params.token;
    return User.findOne({ email }, '-salt -password').exec()
        .then(user => {
            if(!user) return Promise.reject({message: 'user not found', statusCode: 404});
            return _checkVerificationToken(user, token);
        })
        .then(user => {
            user.emailVerification.isVerified = true;
            return user.save();
        })
        .then(user => res.status(200).json(user))
        .catch(err => {
            res.status(err.statusCode || 400).json({ error: err.message} || 'something went wrong');
        });
}



