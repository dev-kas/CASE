const fs = require('fs');
const { homedir } = require('os');
const path = require('path');

module.exports = {};
module.exports.activate = async function (options, config) {
    const file_path = options.path || "";
    let result = "";

    if (file_path.startsWith("~")) { file_path = path.join(homedir(), file_path.slice(1)) };

    try {
        result = fs.readFileSync(file_path, "utf-8");
    } catch (error) {
        return "ERROR READING FILE: " + error.message;
    }

    return result;
}
