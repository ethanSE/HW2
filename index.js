//dependenies
const server = require('./lib/server');
const cli = require('./lib/cli')

let app = {};

app.init = () => {
    //start the server
    server.init();

    //start the CLI
    setTimeout(() => {
        cli.init();
    }, 50)
}

app.init();