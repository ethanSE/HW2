const _data = require('../data');
const helpers = require('../helpers');
const tokens = require('./tokens')

let users = {};

users.handlerFunction = async (data) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        return await users[data.method](data)
    } else {
        return { statusCode: 405, payload: { 'Error': `method must be 'post', 'get', 'put', or 'delete'` } }
    }
};

// Users - post
// create a user
// Required data: firstName, lastName, email, password, street address
// Optional data: none
users.post = async (data) => {
    let { firstName, lastName, email, password, streetAddress } = data.payload;

    firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim();
    lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim();
    email = typeof (data.payload.email) == 'string' && data.payload.email.trim();
    password = typeof (data.payload.password) == 'string' && data.payload.password.trim();
    streetAddress = typeof (data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim();

    //if all are valid check to make sure user does not already exist
    if (firstName && lastName && email && password && streetAddress) {
        try {
            await _data.read('users', email)
            //successful read means user already exists - should return error to user
            return ({ statusCode: 400, payload: { 'Error': 'A user with that email already exists' } });
        } catch (e) {
            console.log(e)
            try {
                //hash the password
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    //create the user object
                    let userObject = {
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        hashedPassword: hashedPassword,
                        streetAddress: streetAddress,
                        orders: []
                    }
                    //store the user
                    _data.create('users', email, userObject);
                    return ({ statusCode: 200 })
                } else {
                    return ({ statusCode: 500, payload: { 'Error': `Could not hash user's password` } })
                }
            } catch (e) {
                console.log(e)
                return ({ statusCode: 200, payload: { 'Error': 'could not create the new user' } });
            }
        }
    } else {
        return { statusCode: 400, payload: { 'Error': `missing required fields` } }
    }
}

// Required data: email, token
// Optional data: none
users.get = async (data) => {
    // Check email is valid
    let email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim();
    if (email) {
        try {
            //get token from headers
            let token = typeof (data.headers?.token) == 'string' && data.headers?.token;
            //validate token
            let validated = await tokens.verifyToken(token, email);
            if (validated) {
                let readResult = await _data.read('users', email);
                // Remove the hashed password from the user user object before returning it to the requester
                delete readResult.hashedPassword;
                return { statusCode: 200, payload: readResult }
            } else {
                return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
            }
        } catch (e) {
            console.log(e)
            return { statusCode: 404, payload: { 'Error': 'User not found' } }
        }
    } else {
        return { statusCode: 400, payload: { 'Error': `missing required fields` } }
    }
};

// Required data: email, token
// Optional data: firstName, lastName, password, streetAddress (at least one must be specified)
users.put = async (data) => {
    // Check for required field
    let email = typeof (data.payload.email) == 'string' ? data.payload.email.trim() : false;
    // Check for optional fields
    let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim();
    let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim();
    let password = typeof (data.payload.password) == 'string' && data.payload.password.trim();
    let streetAddress = typeof (data.payload.streetAddress) === 'string' && data.payload.streetAddress.trim()

    // Error if email is invalid
    if (email) {
        // Error if nothing is sent to update
        if (firstName || lastName || password || streetAddress) {
            try {
                //get token from headers
                let token = typeof (data.headers?.token) == 'string' && data.headers?.token;
                //validate token
                let validated = await tokens.verifyToken(token, email);
                if (validated) {
                    let userData = await _data.read('users', email).catch(() => { throw { statusCode: 400, payload: { 'Error': `specified user does not exist` } } })
                    //update fields if provided
                    if (firstName) {
                        userData.firstName = firstName;
                    }
                    if (lastName) {
                        userData.lastName = lastName;
                    }
                    if (password) {
                        userData.hashedPassword = helpers.hash(password)
                    }
                    if (streetAddress) {
                        userData.streetAddress = streetAddress
                    }
                    //update the user
                    await _data.update('users', email, userData).catch(() => { throw { statusCode: 500, payload: { 'Error': `could not update the user` } } })
                    return ({ statusCode: 200 })
                } else {
                    return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
                }
            } catch (e) {
                console.log(e)
                return (e)
            }
        } else {
            return { statusCode: 400, payload: { 'Error': `missing required fields. Must provide one or more of firstName, lastName, password, or streetAddress` } }
        }
    } else {
        return { statusCode: 400, payload: { 'Error': `missing required field: email` } }
    }
};

// Required data: email, token
// Optional data: none
// @TODO Cleanup (delete) any other data files associated with the user
users.delete = async (data) => {
    // Check that email is valid
    let email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim();
    if (email) {
        try {
            //get token from headers
            let token = typeof (data.headers?.token) == 'string' && data.headers?.token;
            //validate token
            let validated = await tokens.verifyToken(token, email);
            if (validated) {
                // check if user exists
                await _data.read('users', email).catch(() => { throw { statusCode: 400, payload: { 'Error': 'Could not find the specified user' } } })
                //delete user
                await _data.delete('users', email).catch(() => { throw { statusCode: 500, payload: { 'Error': `could not delete the specified user` } } })
                return { statusCode: 200 }
            } else {
                return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
            }
        } catch (e) {
            console.log(e)
            return (e)
        }
    } else {
        return { statusCode: 400, payload: { 'Error': `missing required field: email` } }
    }
};

module.exports = users;