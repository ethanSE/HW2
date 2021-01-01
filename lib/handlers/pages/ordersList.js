const helpers = require('../../helpers')
module.exports = async (data) => {
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Prepare data for interpolation
        var templateData = {
            'head.title': 'Dashboard',
            'body.class': 'ordersList'
        };
        // Read in a template as a string
        try {
            let filledTemplate = await helpers.getTemplate('ordersList', templateData)
            let filledTemplatePlusUniversalTemplates = await helpers.addUniversalTemplates(filledTemplate, templateData)
            return { statusCode: 200, payload: filledTemplatePlusUniversalTemplates, contentType: "text/html" }
        } catch (e) {
            console.log(e)
            return { statusCode: 500 };
        }
    } else {
        return { statusCode: 405, payload: { "Error": "Method must be GET" } };
    };
}