const helpers = require('../helpers')

module.exports = async (data) => {
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Read in the favicon's data
        try {
            let favicon = await helpers.getStaticAsset('favicon.ico')
            return { statusCode: 200, payload: favicon, contentType: 'favicon' }
        } catch (e) {
            console.log(e)
            return { statusCode: 500 }
        }
    } else {
        return { statusCode: 405, payload: { "Error": "Method must be GET" } }
    }
};