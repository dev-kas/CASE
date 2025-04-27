const fs = require('fs');

module.exports = {};
module.exports.activate = async function (options, config) {
    const file_path = options.path || "";
    let result = "";
    try {
        result = fs.readdirSync(file_path);
    } catch (error) {
        return "ERROR READING DIR: " + error.message;
    }

    return result;
}
