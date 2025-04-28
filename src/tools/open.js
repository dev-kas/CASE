const path = require('path');
const { homedir } = require('os');

module.exports = {};
module.exports.activate = async function (options, config) {
    const open = (await import('open')).default;
    let file_path = options.path || "";

    if (file_path.startsWith("~")) { file_path = path.join(homedir(), file_path.slice(1)) };

    console.log("OPENING: ", file_path);
    open(file_path);

    return "OPENED SUCCESSFULLY";
}
