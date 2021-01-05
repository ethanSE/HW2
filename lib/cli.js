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
            'menu'
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
    try {
        let menu = await _data.read('menu', 'menu')
        console.log('\n')
        console.dir(menu)
        console.log('\n')
    } catch {
        console.error('Error loading menu')
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