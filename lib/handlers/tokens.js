//dependencies
const _data = require('../data');
const helpers = require('../helpers');

//tokens handler 
let tokens = {};

tokens.handlerFunction = async (data) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        return await tokens[data.method](data)
    } else {
        return { statusCode: 405, payload: { 'Error': `method must be 'post', 'get', 'put', or 'delete'` } }
    }
};

//tokens - post
//required data - email, password
tokens.post = async (data) => {
    let email = typeof (data.payload.email) == 'string' && data.payload.email.trim();
    let password = typeof (data.payload.password) == 'string' && data.payload.password.trim();

    try {
        if (email && password) {
            let userData = await _data.read('users', email).catch(() => { throw { statusCode: 400, payload: { 'Error': 'Could not find the specified user' } } })
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
tokens.get = async (data) => {
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
tokens.put = async (data) => {
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

// Required data: token, email
tokens.delete = async (data) => {
    // Check that tokenId is valid
    let tokenId = data.queryStringObject.tokenId;
    tokenId = typeof (tokenId) == 'string' && tokenId.trim().length === 20 && tokenId.trim();

    if (tokenId) {
        try {
            // check if token exists
            let token = await _data.read('tokens', tokenId)
                .catch(() => { throw { statusCode: 400, payload: { 'Error': 'Could not find the specified token' } } })
            //check that the token belongs to the supplied user
            let email = typeof (data.payload.email) == 'string' && data.payload.email.trim();

            if (token.email === email) {
                //delete token
                await _data.delete('tokens', tokenId)
                    .catch(() => { throw { statusCode: 500, payload: { 'Error': `could not delete the specified token` } } })
                return { statusCode: 200 }
            } else {
                return { statusCode: 400, payload: { "Error": "token does not match supplied user" } }
            }
        } catch (e) {
            console.log(e)
            return (e)
        }
    } else {
        return { statusCode: 400, payload: { 'Error': `missing required field: tokenId` } }
    }
};

// Verify if a given token id is currently valid for a given user
tokens.verifyToken = async (id, email) => {
    try {
        // Lookup the token
        let tokenData = await _data.read('tokens', id);
        // Check that the token is for the given user and has not expired
        return tokenData.email === email && tokenData.expires > Date.now();
    } catch (e) {
        return false;
    }
};

module.exports = tokens;