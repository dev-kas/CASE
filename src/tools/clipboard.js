module.exports = {};
module.exports.activate = async function (options, config) {
    const clipboard = (await import('clipboardy')).default;
    const data = options.data || "";
    const task = options.task || "";
    let result = "";

    try {
        if (task === "read") {
            result = await clipboard.read();
        } else if (task === "write") {
            await clipboard.write(data);
        } else {
            result = "ERROR: Invalid task. Available tasks include `read` and `write`.";
        }
    } catch (error) {
        return "ERROR READING CLIPBOARD: " + error.message;
    }

    return result;
}
