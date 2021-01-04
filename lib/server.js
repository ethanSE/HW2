const http = require('http');
const https = require('https');
const { StringDecoder } = require('string_decoder');
const url = require('url');
const fs = require('fs');
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');

//instantiate http server
let httpServer = http.createServer((req, res) => unifiedServer(req, res));

//instatiate https server
let httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
};

let httpsServer = https.createServer(httpsServerOptions, (req, res) => unifiedServer(req, res))

//create unified server, function to run over http or https
let unifiedServer = (req, res) => {
    // get the url and parse it
    let parsedUrl = url.parse(req.url, true)
    // get the path from the url
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');
    //Get the query string as an object
    let queryStringObject = parsedUrl.query;
    // get the HTTP method
    let method = req.method.toLowerCase();
    // get the headers as an object
    let headers = req.headers;
    //get the payload, if any
    let decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', async () => {
        buffer += decoder.end()
        //choose the handler this request should go to. if one is not found use the not found handler
        let chosenHandler = router.hasOwnProperty(trimmedPath) && router[trimmedPath] || handlers.notFound;

        // If the request is within the public directory use to the public handler instead
        chosenHandler = trimmedPath.includes('public/') ? handlers.public : chosenHandler;

        //construct the data object to send to the handeler
        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        }

        //route the request to the handler specified in the router
        try {
            const { statusCode = 200, payload = '', contentType = 'application/json' } = await chosenHandler(data)
            //return the response
            res.setHeader('Content-Type', contentType);
            res.writeHead(statusCode);
            res.end(contentType === 'application/json' ? JSON.stringify(typeof (payload) == 'object' ? payload : {}) : payload);
        } catch (e) {
            console.log(e)
            res.writeHead(500);
            res.end();
        }
    });
}

//define a request route
let router = {
    // pages
    '': handlers.home,
    'account/create': handlers.accountCreate,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'orders/all': handlers.ordersList,
    'orders/edit': handlers.ordersEdit,
    // api
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/menu': handlers.menu,
    'api/orders': handlers.orders,
    //public
    'public': handlers.public,
    'favicon.ico': handlers.favicon,
};

let server = {};

server.init = () => {
    //start the http server
    httpServer.listen(config.httpPort, () => {
        console.log(`the server is listening on port:  ${config.httpPort} in ${config.envName} mode`)
    })

    //start the https server
    httpsServer.listen(config.httpsPort, () => {
        console.log(`the server is listening on port:  ${config.httpsPort} in ${config.envName} mode`)
    })
}

module.exports = server;