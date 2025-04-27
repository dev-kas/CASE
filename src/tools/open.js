module.exports = {};
module.exports.activate = async function (options, config) {
    const open = (await import('open')).default;
    const path = options.path || "";

    console.log("OPENING: ", path);
    open(path);

    return "OPENED SUCCESSFULLY";
}
