const robot = require('robotjs');

module.exports = {};
module.exports.activate = async function (options, config) {
    const text = options.text || "";
    let result = "";

    if (text.length = 0) {
        result += "ERROR: No text provided\n";
    }

    try {
        const chunks = text.split(" ");
        for (let i = 0; i < chunks.length; i++) {
            const lines = chunks[i].split("\n");
            for (const line of lines) {
                robot.typeString(line);
                if (lines.indexOf(line) < lines.length - 1) {
                    robot.keyTap("enter", "shift");
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            if (i < chunks.length - 1) {
                robot.typeString(" ");
            }
        }
        result += `SUCCESSFULLY TYPED ${chunks.length} WORDS IN ${chunks.length * 100}ms\n`;
    } catch (error) {
        result += "ERROR TYPING TEXT: " + error.message + "\n";
    }

    return result;
}
