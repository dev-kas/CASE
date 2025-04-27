const fs = require('fs');

module.exports = {};
module.exports.activate = async function (options, config) {
    const file_path = options.path || "";

    try {
        fs.mkdirSync(file_path);
    } catch (error) {
        return "ERROR CREATING DIR: " + error.message;
    }

    return "CREATED SUCCESSFULLY";
}
