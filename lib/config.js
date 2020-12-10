//create and export config variables
let environments = {
    staging: {
        'httpPort': 3000,
        'httpsPort': 3001,
        'envName': 'staging',
        'hashingSecret': 'verySecureSecret'
    },
    production: {
        'httpPort': 5000,
        'httpsPort': 5001,
        'envName': 'production',
        'hashingSecret': 'verySecureSecret'
    }
};

//choose which env to export depending on command line args, defaults to staging
module.exports = environments[process.env.NODE_ENV?.toLowerCase()] || environments.staging;