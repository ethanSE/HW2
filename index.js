//dependenies
const http = require('http');
const https = require('https');
const { StringDecoder } = require('string_decoder');
const url = require('url');
const fs = require('fs');
const config = require('./lib/config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

//instantiate http server
let httpServer = http.createServer((req, res) => unifiedServer(req, res));

//start the http server
httpServer.listen(config.httpPort, () => {
    console.log(`the server is listening on port:  ${config.httpPort} in ${config.envName} mode`)
})

//instatiate https server
let httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
};

let httpsServer = https.createServer(httpsServerOptions, (req, res) => unifiedServer(req, res))

//start the https server
httpsServer.listen(config.httpsPort, () => {
    console.log(`the server is listening on port:  ${config.httpsPort} in ${config.envName} mode`)
})

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
            let { statusCode = 200, payload = {} } = await chosenHandler(data)
            //return the response
            res.setHeader('contentType', 'application/json')
            res.writeHead(statusCode);
            res.end(JSON.stringify(payload));
        } catch (e) {
            console.log(e)
            res.writeHead(500);
            res.end();
        }
    });
}

//define a request route
let router = {
    'aaa': handlers.aaa,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'menu': handlers.menu,
    'orders': handlers.orders
};