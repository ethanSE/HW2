const readline = require('readline');

const events = require('events');
class _events extends events { };
var e = new _events();
const _data = require('./data')

cli = {};

// Input handlers
e.on('man', () => {
    cli.responders.help();
});
e.on('help', () => {
    cli.responders.help();
});
e.on('exit', () => {
    cli.responders.exit()
})
e.on('menu', () => {
    cli.responders.menu()
})
e.on('list orders', (str) => {
    cli.responders.listOrders(str)
})
e.on('get order info', (str) => {
    cli.responders.getOrder(str)
})

cli.processInput = (str) => {
    // Input processor
    str = typeof (str) == 'string' && str.trim();
    // Only process the input if the user actually wrote something, otherwise ignore it
    if (str) {
        // Codify the unique strings that identify the different unique questions allowed be the asked
        var uniqueInputs = [
            'man',
            'help',
            'exit',
            'menu',
            'list orders',
            'get order info',
        ];

        // Go through the possible inputs, emit event when a match is found
        let matchFound = uniqueInputs.some((input) => {
            if (str.toLowerCase().includes(input)) {
                // Emit event matching the unique input, and include the full string given
                e.emit(input, str);
                return true;
            }
        });

        // If no match is found, tell the user to try again
        if (!matchFound) {
            console.log("Sorry, try again. enter 'man' or 'help' for list of available commands");
        }
    }
}

cli.responders = {}

cli.responders.help = () => {
    // Codify the commands and their explanations
    var commands = {
        'exit': 'Kill the CLI (and the rest of the application)',
        'man': 'Show this help page',
        'help': 'Alias of the "man" command',
        'menu': 'prints the menu to the console',
        'list orders --recent': 'Show a list of all the active orders in the system, including their state. Optional --recent flag shows only orders placed in the last 24 hours',
        'get order info --{orderId}': 'Show details of a specified order',
    };

    // Show a header for the help page that is as wide as the screen
    cli.printFunctions.printHeader('help')

    // Show each command, followed by its explanation, in white and yellow respectively
    const leftOffset = 6;
    const commandNameColumnWidth = 40;
    Object.keys(commands).forEach((key) => {
        let commandNameColumn = `\x1b[33m${' '.repeat(leftOffset)}${key}${' '.repeat(commandNameColumnWidth - leftOffset - key.length)}`;
        let commandDescriptionColumn = `\x1b[0m${commands[key]}\n`
        console.log(commandNameColumn + commandDescriptionColumn);
    })
    // End with another horizontal line
    cli.printFunctions.horizontalLine();
}

cli.responders.exit = () => {
    process.exit(0)
}

cli.responders.menu = async () => {
    cli.printFunctions.printHeader('menu')
    try {
        let menu = await _data.read('menu', 'menu')
        console.dir(menu)
    } catch {
        console.error('Error loading menu')
    }
}

cli.responders.listOrders = async (str) => {
    const oneDay = 1000 * 60 * 60 * 24;
    let recentFlag = str.includes('--recent');
    cli.printFunctions.printHeader(`list orders`)

    try {
        //get orderIds
        let orders = await _data.list('orders')
        let resultDisplayed = false;
        let ordersReadAndLogged = await Promise.allSettled(orders.map((orderId) => {
            return new Promise(async (resolve) => {
                let orderData = await _data.read('orders', orderId)
                let orderIsPlacedAndRecent = orderData.placed && orderData.placedTime > Date.now() - oneDay;
                if (!recentFlag || orderIsPlacedAndRecent) {
                    resultDisplayed = true;
                    console.log(`ID: ${orderData.orderId}, Email: ${orderData.email}, Placed: ${orderData.placed}`)
                    resolve({ logged: true });
                }
                resolve({ logged: false })
            })
        }));

        if (!ordersReadAndLogged.some((order) => order.value.logged)) {
            console.log('no results')
        }
    } catch (e) {
        console.log(e)
    }
}

cli.responders.getOrder = async (str) => {
    cli.printFunctions.printHeader('get order')
    // get orderId
    let orderId = str.match(/(?<=--)[A-Za-z0-9]{20}/)[0]

    if (orderId) {
        //get info
        try {
            let orderData = await _data.read('orders', orderId);
            console.dir(orderData)
        } catch (e) {
            console.log('error reading order', e)
        }
    } else {
        console.log('must provide orderId with --orderId flag')
    }
}

cli.printFunctions = {
    // Create a horizontal line across the screen
    horizontalLine: () => {
        console.log('-'.repeat(process.stdout.columns))
    },
    // Create a vertical space
    verticalSpace: (lines) => {
        lines = typeof (lines) == 'number' && lines || 1;
        for (i = 0; i < lines; i++) {
            console.log('');
        }
    },
    // Create centered text on the screen
    centered: (str) => {
        str = typeof (str) == 'string' && str.trim().length > 0 ? str.trim() : '';
        // Get the available screen size
        var width = process.stdout.columns;
        // Calculate the left padding there should be
        var leftPadding = Math.floor((width - str.length) / 2);
        // print it
        console.log(' '.repeat(leftPadding) + str);
    },
    printHeader: function (str) {
        this.horizontalLine();
        this.centered(str);
        this.horizontalLine();
        this.verticalSpace(2);
    }
}

cli.init = () => {
    // Send to console, in dark blue
    console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');

    // Start the interface
    let _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    // Create an initial prompt
    _interface.prompt();

    // Handle each line of input separately
    _interface.on('line', (str) => {

        // Send to the input processor
        cli.processInput(str);

        // Re-initialize the prompt afterwards
        _interface.prompt();
    });

    // If the user stops the CLI, kill the associated process
    _interface.on('close', () => {
        process.exit(0);
    });
}

module.exports = cli;