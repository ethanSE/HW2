const tokens = require('./tokens')

let menu = {};

menu.handlerFunction = async (data) => {
    if (data.method === 'get') {
        return await menu.get(data);
    } else {
        return { statusCode: 405, payload: { 'Error': `method must be 'get'` } }
    }
}

// allows user to get menu items
// Required data: token, email
// Optional data: none
menu.get = async (data) => {
    //get email
    let email = typeof (data.payload.email) == 'string' && data.payload.email.trim();
    if (email) {
        //get token from headers
        let token = typeof (data.headers?.token) == 'string' && data.headers?.token;
        //validate token
        let validated = await tokens.verifyToken(token, email);
        if (validated) {
            return { statusCode: 200, payload: menu.menuObj }
        } else {
            return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
        }
    } else {
        return { statusCode: 400, payload: { "Error": "missing required field: email" } }
    }
}

menu.menuObj = {
    item0: { name: 'Pineapple pizza', price: 14 },
    item1: { name: 'Pineapple pizza w/ extra pineapple', price: 16 },
    item2: { name: 'Pineapple pizza w/ anchovies', price: 17 }
}

module.exports = menu;