//dependencies
const _data = require('../data');
const helpers = require('../helpers');

let handlers = {}

handlers.notFound = async () => {
    return ({ statusCode: 404 })
}

handlers.users = async (data) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        return await handlers._users[data.method](data)
    } else {
        return { statusCode: 405, payload: { 'Error': `method must be 'post', 'get', 'put', or 'delete'` } }
    }
};

handlers._users = {};

// Users - post
// create a user
// Required data: firstName, lastName, email, password, street address
// Optional data: none
handlers._users.post = async (data) => {
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
                        streetAddress: streetAddress
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

// Required data: email
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
handlers._users.get = async (data) => {
    // Check email is valid
    let email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim();
    if (email) {
        try {
            let readResult = await _data.read('users', email);
            // Remove the hashed password from the user user object before returning it to the requester
            delete readResult.hashedPassword;
            return { statusCode: 200, payload: readResult }
        } catch (e) {
            return { statusCode: 404, payload: { 'Error': 'User not found' } }
        }
    } else {
        return { statusCode: 400, payload: { 'Error': `missing required fields` } }
    }
};

// Required data: email
// Optional data: firstName, lastName, password, streetAddress (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = async (data) => {
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

// Required data: email
// @TODO Only let an authenticated user delete their object. Dont let them delete other users.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = async (data) => {
    // Check that email is valid
    let email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim();
    if (email) {
        try {
            // check if user exists
            await _data.read('users', email).catch(() => { throw { statusCode: 400, payload: { 'Error': 'Could not find the specified user' } } })
            //delete user
            await _data.delete('users', email).catch(() => { throw { statusCode: 500, payload: { 'Error': `could not delete the specified user` } } })
            return { statusCode: 200 }
        } catch (e) {
            console.log(e)
            return (e)
        }
    } else {
        return { statusCode: 400, payload: { 'Error': `missing required field: email` } }
    }
};


//tokens handler 
handlers.tokens = async (data) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        return await handlers._tokens[data.method](data)
    } else {
        return { statusCode: 405, payload: { 'Error': `method must be 'post', 'get', 'put', or 'delete'` } }
    }
};

handlers._tokens = {};

//tokens - post
//required data - email, password
handlers._tokens.post = async (data) => {
    email = typeof (data.payload.email) == 'string' && data.payload.email.trim();
    password = typeof (data.payload.password) == 'string' && data.payload.password.trim();

    try {
        if (email && password) {
            let userData = await _data.read('users', email).catch(() => { throw { statusCode: 400, payload: { 'Error': 'Could not find the specified user' } } })
            console.log('userData', userData)
            let hashedPassword = helpers.hash(password)
            if (hashedPassword === userData.hashedPassword) {
                //if valid create a new token with a random id
                let tokenId = helpers.createRandomString(20);
                let expires = Date.now() + 1000 * 60 * 60;
                let tokenObject = {
                    'email': email,
                    'tokenId': tokenId,
                    'expires': expires
                }
                //create the token
                await _data.create('tokens', tokenId, tokenObject).catch(() => { throw { statusCode: 500, payload: { 'Error': 'Could not create the new token' } } })
                //return the token to the user
                return { statusCode: 200, payload: { 'tokenObject': tokenObject } }
            } else {
                return { statusCode: 400, payload: { 'Error': 'Password did not match' } }
            }
        } else {
            return { statusCode: 400, payload: { 'Error': 'Missing required field(s)' } }
        }
    } catch (e) {
        return (e)
    }
}

//tokens - get
//required data: id
//optional data: none
handlers._tokens.get = async (data) => {
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 && data.queryStringObject.id.trim();
    if (id) {
        let result;
        await _data.read('tokens', id)
            .then((tokenData) => result = { statusCode: 200, payload: tokenData })
            .catch(() => result = { statusCode: 404 })
        return result;
    } else {
        return { statusCode: 400, payload: { 'Error': 'Missing required field' } }
    }
}

//tokens - put
//allows user to extend current token
//required data - id, extend
//optional data - none
handlers._tokens.put = async (data) => {
    let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length === 20 && data.payload.id.trim();
    let extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if (id && extend) {
        //get the token data
        try {
            let tokenData = await _data.read('tokens', id).catch(() => { throw { statusCode: 400, payload: { "Error": "The specified token does not exist" } } });
            if (tokenData.expires > Date.now()) {
                //set expiration date to one hour from now
                tokenData.expires = Date.now() + 60 * 60 * 1000;
                await _data.update('tokens', id, tokenData).catch(() => { throw { statusCode: 500, payload: { "Error": "Could not update the token's expiration date" } } });
                return { statusCode: 200 }
            } else {
                return { statusCode: 400, payload: { "Error": "The token has already expired" } }
            }
        } catch (e) {
            return e
        }
    } else {
        return { statusCode: 400, payload: { "Error": "Required fields are missing or invalid" } }
    }
}

module.exports = handlers;
