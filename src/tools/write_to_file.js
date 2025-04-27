const fs = require('fs');

module.exports = {};
module.exports.activate = async function (options, config) {
    const file_path = options.path || "";
    const content = options.content || "";

    try {
        fs.writeFileSync(file_path, content);
    } catch (error) {
        return "ERROR WRITING TO FILE: " + error.message;
    }

    return "WRITTEN SUCCESSFULLY";
}
