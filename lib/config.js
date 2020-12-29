//create and export config variables
let environments = {
    staging: {
        'httpPort': 3000,
        'httpsPort': 3001,
        'envName': 'staging',
        'hashingSecret': 'verySecureSecret',
        'mailGunDomain': 'YOUR_DOMAIN_HERE',
        'mailGunApiKey': 'YOUR_API_KEY_HERE',
        'templateGlobals': {
            'appName': 'PizzaRestaurant',
            'companyName': 'FakeCompany, Inc.',
            'yearCreated': '2020',
            'baseUrl': 'http://localhost:3000/'
        }
    },
    production: {
        'httpPort': 5000,
        'httpsPort': 5001,
        'envName': 'production',
        'hashingSecret': 'verySecureSecret',
        'mailGunDomain': 'YOUR_DOMAIN_HERE',
        'mailGunApiKey': 'YOUR_API_KEY_HERE',
        'templateGlobals': {
            'appName': 'PizzaRestaurant',
            'companyName': 'FakeCompany, Inc.',
            'yearCreated': '2020',
            'baseUrl': 'http://localhost:5000/'
        }
    }
};

//choose which env to export depending on command line args, defaults to staging
module.exports = environments[process.env.NODE_ENV?.toLowerCase()] || environments.staging;