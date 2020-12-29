//dependencies
//api
const users = require('./api/users');
const tokens = require('./api/tokens');
const menu = require('./api/menu');
const orders = require('./api/orders');
const public = require('./public');
//pages
const home = require('./pages/home.js')

let handlers = {
    //pages
    home: home,
    //api
    users: users.handlerFunction,
    tokens: tokens.handlerFunction,
    menu: menu.handlerFunction,
    orders: orders.handlerFunction,
    //public
    public: public,
    //not found
    notFound: async () => {
        return ({ statusCode: 404 })
    }
}

module.exports = handlers;