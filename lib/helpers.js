const crypto = require('crypto')
const config = require('./config')
let helpers = {}


// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};

// Create a SHA256 hash
helpers.hash = function (str) {
    if (typeof (str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
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

module.exports = helpers;