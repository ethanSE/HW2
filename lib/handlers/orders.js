const _data = require('../data');
const tokens = require('./tokens');
const helpers = require("../helpers");
const menu = require('./menu');
const https = require('https');
const { StringDecoder } = require('string_decoder');

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
                    orderId: orderId,
                    email: email,
                    placed: false,
                    items: {},
                    totalPrice: 0
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
                return { statusCode: 200, payload: orderObj }
            } else {
                return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
            }
        } catch (e) {
            console.log(e);
            return e;
        }
    } else {
        return { statusCode: 400, payload: { "Error": "required fields are missing or invalid: email" } }
    }
}

// Required data: token, orderId
// Optional data: one or more of (itemId + quantity), stripe token
orders.put = async (data) => {
    //get orderId
    let orderId = data.payload.orderId;
    orderId = typeof (orderId) == 'string' && orderId.trim().length === 20 && orderId.trim();
    if (orderId) {
        try {
            //get order object
            let order = await _data.read('orders', orderId)
                .catch(() => { throw { statusCode: 400, payload: { "Error": "order does not exist" } } })
            if (!order.placed) {
                //get token from headers
                let token = typeof (data.headers.token) == 'string' && data.headers.token;
                //validate token
                let validated = await tokens.verifyToken(token, order.email);
                if (validated) {
                    //update order.items according to item ids and quantities passed in payload
                    //for each item in the menu - if the payload has an object with that key put that id and quantity into the order.items object
                    Object.keys(menu.menuObj).forEach((menuItem) => {
                        //if the payload has a key that is a key on the menu and a value that is a non-negative integer update to this value
                        if (data.payload.hasOwnProperty(menuItem) && typeof (data.payload[menuItem]) == 'number' && data.payload[menuItem] % 1 === 0 && data.payload[menuItem] >= 0) {
                            order.items[menuItem] = data.payload[menuItem];
                        }
                    })
                    //update orders total price after changing items
                    order.totalPrice = Object.keys(order.items).reduce((acc, curr) => { return acc + menu.menuObj[curr].price * order.items[curr] }, 0)

                    //if payment token is passed process payment
                    let stripeToken = data.payload.stripeToken;
                    stripeToken = typeof (stripeToken) == 'string' && stripeToken.trim();
                    if (stripeToken) {
                        if (order.totalPrice > 0) {
                            //create request to create a charge
                            let chargeId = await orders.createCharge(stripeToken, order.totalPrice, order.orderId)
                                .catch((e) => {
                                    throw { statusCode: e.statusCode, payload: { "Error processing charge": e } }
                                })

                            //update order with successful charge Id
                            order.chargeId = chargeId;
                            //update placed to true
                            order.placed = true;
                            //update order in filesystem
                            await _data.update('orders', order.orderId, order)
                                .catch(() => { throw { statusCode: 500, payload: { "Error": "Unable to update order object" } } })
                            // TODO - email user with confirmation


                            return { statusCode: 200, payload: order }
                        } else {
                            //cannot checkout with empty cart
                            //update order in filesystem
                            await _data.update('orders', order.orderId, order)
                                .catch(() => { throw { statusCode: 500, payload: { "Error": "Unable to update order object" } } })
                            return { statusCode: 400, payload: { "Error": "Saved changes to order but cannot process payment or place order with empty cart" } }
                        }
                    } else {
                        await _data.update('orders', order.orderId, order)
                            .catch(() => { throw { statusCode: 500, payload: { "Error": "Unable to update order object" } } })
                        return { statusCode: 200, payload: order }
                    }
                } else {
                    return { statusCode: 403, payload: { "Error": "Missing required token in header, or token is invalid." } }
                }
            } else {
                return { statusCode: 403, payload: { "Error": "the order has been submitted and cannot be altered" } }
            }
        } catch (e) {
            console.log(e);
            return e;
        }
    } else {
        return { statusCode: 400, payload: { "Error": "required fields are missing or invalid" } }
    }
}

//successful return chargeId
orders.createCharge = (stripeToken, amount, orderId) => {
    return new Promise((resolve, reject) => {
        const data = `amount=${amount}&currency=usd&payment_method_types[]=card`;

        const options = {
            hostname: 'api.stripe.com',
            port: 443,
            path: '/v1/payment_intents',
            method: 'POST',
            auth: stripeToken,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length,
                'Idempotency-Key': orderId
            }
        }

        let decoder = new StringDecoder('utf-8');
        let buffer = '';

        const req = https.request(options, res => {
            res.on('data', data => {
                buffer += decoder.write(data);
            })
            res.on('end', () => {
                buffer += decoder.end();
                let chargeResult = JSON.parse(buffer);
                chargeResult.statusCode = res.statusCode;

                //need to resolve or reject here depending on statuscode
                if (res.statusCode == 200) {
                    resolve(chargeResult.id)
                } else {
                    reject(chargeResult)
                }
            })
        })

        req.on('error', error => {
            reject(error)
        })

        req.write(data)
        req.end()
    })
}

module.exports = orders;