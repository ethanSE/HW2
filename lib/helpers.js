const crypto = require('crypto')
const path = require('path')
const config = require('./config')
const fs = require('fs/promises')
let helpers = {}


// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
    try {
        let obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};

// Create a SHA256 hash
helpers.hash = function (str) {
    if (typeof (str) == 'string' && str.length > 0) {
        let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

helpers.createRandomString = (strLength) => {
    strLength = typeof (strLength) === 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        //define all possible characters
        let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let finalString = '';
        for (i = 1; i <= strLength; i++) {
            finalString += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
        }
        return finalString;
    } else {
        return false;
    }
}

// Get the string content of a template, and use provided data for string interpolation
helpers.getTemplate = async (templateName, data) => {
    return new Promise(async (resolve, reject) => {
        templateName = typeof (templateName) == 'string' && templateName;
        data = typeof (data) == 'object' && data || {};
        if (templateName) {
            let templatesDir = path.join(__dirname, '/../templates/');
            try {
                let template = await fs.readFile(templatesDir + templateName + '.html', 'utf8')
                // Do interpolation on the string
                var finalString = helpers.interpolate(template, data);
                resolve(finalString);
            } catch (e) {
                console.log('No template could be found')
                reject();
            }
        } else {
            console.log('valid template name was not specified')
            reject();
        }
    })
};

// Take a given string and data object, and find/replace all the keys within it
helpers.interpolate = (template, data) => {
    template = typeof (template) == 'string' && template || '';
    data = typeof (data) == 'object' && data || {};

    // Add the templateGlobals to the data object, prepending their key name with "global."
    for (var keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.' + keyName] = config.templateGlobals[keyName]
        }
    }
    // For each key in the data object, insert its value into the template at the corresponding placeholder
    for (var key in data) {
        if (data.hasOwnProperty(key) && typeof (data[key] == 'string')) {
            var replace = data[key];
            var find = '{' + key + '}';
            template = template.replace(find, replace);
        }
    }
    return template;
};

helpers.addUniversalTemplates = async (str, data) => {
    return new Promise(async (resolve, reject) => {
        str = typeof (str) == 'string' && str.length > 0 ? str : '';
        data = typeof (data) == 'object' && data !== null ? data : {};

        try {
            // Get the header
            let headerString = await helpers.getTemplate('_header', data)
                .catch(() => { throw 'unable to get header template' })
            //get the footer
            let footerString = await helpers.getTemplate('_footer', data)
                .catch(() => { throw 'unable to get footer template' })
            resolve(headerString + str + footerString)
        } catch (e) {
            console.log(e)
            reject(e);
        }
    })
};

module.exports = helpers;