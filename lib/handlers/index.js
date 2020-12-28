//dependencies
const users = require('./api/users');
const tokens = require('./api/tokens');
const menu = require('./api/menu');
const orders = require('./api/orders');

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