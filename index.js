//dependenies
const server = require('./lib/server');
const cli = require('./lib/cli');
const helpers = require('./lib/helpers');

let app = {};

app.init = () => {
    //generate require files
    helpers.generateFiles();

    //start the server
    server.init();

    //start the CLI
    setTimeout(() => {
        cli.init();
    }, 50)
}

app.init();