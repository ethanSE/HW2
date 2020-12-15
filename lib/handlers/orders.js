const _data = require('../data');
const tokens = require('./tokens')
const helpers = require("../helpers");

let orders = {};

orders.handlerFunction = async (data) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        return await orders[data.method](data)
    } else {
        return { statusCode: 405, payload: { 'Error': `method must be 'post', 'get', 'put', or 'delete'` } }
    }
};

// Required data: orderId, token
// Optional data: none
orders.get = async (data) => {
    //get orderId
    let orderId = data.queryStringObject.orderId;
    orderId = typeof (orderId) == 'string' && orderId.trim().length === 20 && orderId.trim();
    if (orderId) {
        try {
            //get order object
            let order = await _data.read('orders', orderId).catch(() => { throw { statusCode: 400, payload: { "Error": "order does not exist" } } })
            //get token from headers
            let token = typeof (data.headers?.token) == 'string' && data.headers.token;
            //validate token
            let validated = await tokens.verifyToken(token, order.email);
            if (validated) {
                return { statusCode: 200, payload: order }
            } else {
                return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
            }
        } catch (e) {
            console.log(e)
            return e
        }
    } else {
        return { statusCode: 400, payload: { "Error": "required fields are missing or invalid" } }
    }
}

// Required data: email, token
// Optional data: none
orders.post = async (data) => {
    let email = data.payload.email;
    email = typeof (email) == 'string' && email.trim();
    if (email) {
        //validate token
        try {
            //get token from headers
            let token = typeof (data.headers?.token) == 'string' && data.headers.token;
            //validate token
            let validated = await tokens.verifyToken(token, email);
            if (validated) {
                //create order
                let orderId = helpers.createRandomString(20);
                let orderObj = {
                    email: email,
                    placed: false,
                    items: {}
                }
                await _data.create('orders', orderId, orderObj).catch(() => {
                    throw { statusCode: 500, payload: { "Error": "Failed to create new order" } }
                })
                //link order to user
                //get user object
                let userData = await _data.read('users', email).catch(() => {
                    throw { statusCode: 500, payload: { "Error": "Failed to read user" } }
                })

                //add new order id to user object
                userData.orders = userData.orders.concat(orderId)

                //write to user
                await _data.update('users', email, userData).catch(() => {
                    throw { statusCode: 500, payload: { "Error": "Failed to write to user" } }
                })
                return { statusCode: 200 }
            } else {
                return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
            }
        } catch (e) {
            console.log(e)
            return (e)
        }
    } else {
        return { statusCode: 400, payload: { "Error": "required fields are missing or invalid" } }
    }
}

module.exports = orders;