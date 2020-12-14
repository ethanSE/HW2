//dependencies
const users = require('./users')
const tokens = require('./tokens');

let handlers = {
    users: users.handlerFunction,
    tokens: tokens.handlerFunction,
    notFound: async () => {
        return ({ statusCode: 404 })
    }
}

module.exports = handlers;