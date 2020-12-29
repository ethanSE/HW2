const helpers = require('../helpers')

module.exports = async (data) => {
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Get the filename being requested
        let trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
        if (trimmedAssetName.length > 0) {
            try {
                // Read in the asset's data
                let data = await helpers.getStaticAsset(trimmedAssetName)

                // Determine the content type (default to plain text)
                let contentType = 'plain';

                if (trimmedAssetName.includes('.css')) {
                    contentType = 'css';
                }

                if (trimmedAssetName.includes('.png')) {
                    contentType = 'png';
                }

                if (trimmedAssetName.includes('.jpg')) {
                    contentType = 'jpg';
                }

                if (trimmedAssetName.includes('.ico')) {
                    contentType = 'favicon';
                }

                // Callback the data
                return { statusCode: 200, payload: data, contentType: contentType }

            } catch (e) {
                return { statusCode: 404 }
            }
        } else {
            return { statusCode: 404 }
        }
    } else {
        return { statusCode: 405, payload: { "Error": "Method must be GET" } }
    }
};
