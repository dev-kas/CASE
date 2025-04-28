const fs = require('fs');

module.exports = {};
module.exports.activate = async function (options, config) {
    const file_path = options.path || "";
    let result = "";
    try {
        result = fs.readFileSync(file_path, "utf-8");
    } catch (error) {
        return "ERROR READING FILE: " + error.message;
    }

    return result;
}
