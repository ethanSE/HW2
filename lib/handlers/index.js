//dependencies
const _data = require('../data');
const helpers = require('../helpers');

let handlers = {}

handlers.notFound = async (data) => {
    return ({ statusCode: 404 })
}

handlers.users = async (data) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        return await handlers._users[data.method](data)
    } else {
        return { statusCode: 400, payload: { 'Error': `method must be 'post', 'get', 'put', or 'delete'` } }
    }
};
handlers._users = {};

// Users - post
// create a user
// Required data: firstName, lastName, email, password, street address
// Optional data: none
handlers._users.post = async (data) => {
    console.log(data)
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
                console.log(hashedPassword)
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
                    console.log('attempting user create')
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
            let readResult = helpers.parseJsonToObject(await _data.read('users', email))
            // Remove the hashed password from the user user object before returning it to the requester
            delete readResult.hashedPassword;
            return { statusCode: 200, payload: readResult }
        } catch (e) {
            return { statusCode: 404 }
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
    console.log(firstName)
    let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim();
    let password = typeof (data.payload.password) == 'string' && data.payload.password.trim();
    let streetAddress = typeof (data.payload.streetAddress) === 'string' && data.payload.streetAddress.trim()

    // Error if email is invalid
    if (email) {
        // Error if nothing is sent to update
        if (firstName || lastName || password || streetAddress) {
            try {
                let userDataString = await _data.read('users', email).catch(() => { throw { statusCode: 400, payload: { 'Error': `specified user does not exist` } } })
                let userData = helpers.parseJsonToObject(userDataString);

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

module.exports = handlers;
