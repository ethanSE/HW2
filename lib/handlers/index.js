//dependencies
const users = require('./users');
const tokens = require('./tokens');
const menu = require('./menu');
const orders = require('./orders');

let handlers = {
    users: users.handlerFunction,
    tokens: tokens.handlerFunction,
    menu: menu.handlerFunction,
    orders: orders.handlerFunction,
    notFound: async () => {
        return ({ statusCode: 404 })
    }
}

module.exports = handlers;