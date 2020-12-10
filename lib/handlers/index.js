//dependencies
var _data = require('../data');
var helpers = require('../helpers');

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

module.exports = handlers;
