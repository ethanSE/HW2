//dependencies
var _data = require('../data');
// var helpers = require('./helpers');

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

module.exports = handlers;
