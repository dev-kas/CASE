const fs = require('fs');
const { homedir } = require('os');
const path = require('path');

module.exports = {};
module.exports.activate = async function (options, config) {
    let file_path = options.path || "";
    let result = "";

    if (file_path.startsWith("~")) { file_path = path.join(homedir(), file_path.slice(1)) };

    try {
        result = fs.readdirSync(file_path);
    } catch (error) {
        return "ERROR READING DIR: " + error.message;
    }

    return result;
}
