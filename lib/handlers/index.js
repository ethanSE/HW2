//dependencies
//api
const users = require('./api/users');
const tokens = require('./api/tokens');
const menu = require('./api/menu');
const orders = require('./api/orders');
//pages
const home = require('./pages/home.js');
const accountCreate = require('./pages/accountCreate.js');
//public
const public = require('./public');
const faviconHandler = require('./favicon');

let handlers = {
    //pages
    home: home,
    accountCreate: accountCreate,
    //api
    users: users.handlerFunction,
    tokens: tokens.handlerFunction,
    menu: menu.handlerFunction,
    orders: orders.handlerFunction,
    //public
    public: public,
    favicon: faviconHandler,
    //not found
    notFound: async () => {
        return ({ statusCode: 404 })
    }
}

module.exports = handlers;