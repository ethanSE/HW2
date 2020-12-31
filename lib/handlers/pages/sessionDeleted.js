const helpers = require('../../helpers')

module.exports = async (data) => {
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Prepare data for interpolation
        var templateData = {
            'head.title': 'You have been logged out',
            'head.description': 'Log in again to view  / edit your orders',
            'body.class': 'sessionDeleted'
        };

        try {
            //get template and add template data
            let filledTemplate = await helpers.getTemplate('sessionDeleted', templateData)
                .catch((e) => {
                    console.log(e)
                    throw { statusCode: 500, payload: { Error: "error getting HTML template / interpolating" } }
                })
            // Add the universal header and footer
            let filledTemplatePlusUniversalTemplates = await helpers.addUniversalTemplates(filledTemplate, templateData)
                .catch((e) => {
                    console.log(e)
                    throw { statusCode: 500, payload: { Error: "error adding universal templates" } }
                })
            //return generated html
            return { statusCode: 200, payload: filledTemplatePlusUniversalTemplates, contentType: 'text/html' };
        } catch (e) {
            console.log(e)
            return e;
        }
    } else {
        return { statusCode: 405, payload: { Error: "method must be GET" } }
    }
};