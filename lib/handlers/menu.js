const tokens = require('./tokens')

let menu = {};

// allows user to get menu items
// Required data: token, email
// Optional data: none
menu.handlerFunction = async (data) => {
    if (data.method === 'get') {
        return await menu.get(data);
    } else {
        return { statusCode: 405, payload: { 'Error': `method must be 'get'` } }
    }
}

menu.get = async (data) => {
    //get email
    let email = typeof (data.payload.email) == 'string' && data.payload.email.trim();
    if (email) {
        //get token from headers
        let token = typeof (data.headers?.token) == 'string' && data.headers?.token;
        //validate token
        let validated = await tokens.verifyToken(token, email);
        if (validated) {
            return { statusCode: 200, payload: menuObj }
        } else {
            return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
        }
    } else {
        return { statusCode: 400, payload: { "Error": "missing required field: email" } }
    }
}

menuObj = {
    '0': 'Pineapple pizza',
    '1': 'Pineapple pizza w/ extra pineapple',
    '2': 'Pineapple pizza w/ anhcovies'
}

module.exports = menu;