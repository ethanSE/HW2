/*
 * Library for storing and editing data
 *
 */

// Dependencies
const fs = require('fs');
var path = require('path');

// Container for module (to be exported)
var lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = async (dir, file, data) => {
    try {
        //open the file for writing
        let fileDescriptor = await fs.promises.open(`${lib.baseDir}${dir}/${file}.json`, 'wx')
            .catch(() => { throw 'Could not create new file, it may already exist' })
        //stringify data
        var stringData = JSON.stringify(data);
        //write to file
        await fs.promises.writeFile(`${lib.baseDir}${dir}/${file}.json`, stringData)
            .catch(() => { throw 'Error writing to new file' })
        //close file
        fileDescriptor.close()
    } catch (e) {
        throw (e)
    }
}

// Read data from a file
lib.read = async (dir, file) => {
    return fs.promises.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8')
};

// Update data in a file
lib.update = async (dir, file, data) => {
    const path = `${lib.baseDir}${dir}/${file}.json`;
    try {
        //open the file for writing
        let fileDescriptor = await fs.promises.open(path, 'r+')
            .catch(() => { throw 'Error opening file, it may not exist yet' })
        //convert data to string
        let stringData = JSON.stringify(data);

        //truncate file
        await fs.promises.truncate(path)
            .catch(() => { throw 'Error truncating file' })

        //write to file and close it
        await fs.promises.writeFile(fileDescriptor, stringData)
            .catch(() => { throw 'Error writing to existing file' })

        fileDescriptor.close()
    } catch (e) {
        throw (e)
    }
}

lib.delete = async (dir, file) => {
    // Unlink the file from the filesystem
    try {
        await fs.promises.unlink(`${lib.baseDir}${dir}/${file}.json`, 'r+')
    } catch {
        throw 'Error unlinking file. it may not have been deleted'
    }
}

// Export the module
module.exports = lib;