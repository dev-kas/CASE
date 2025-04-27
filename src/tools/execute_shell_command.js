const { spawn } = require('child_process');

module.exports = {};

module.exports.activate = async function (options) {
    const command = options.command || ""; // TODO: Moderate command

    console.log("EXECUTING COMMAND: ", command);


    const shell = options.shell || "/bin/zsh";
    const proc = spawn(command, {
        env: process.env,
        shell: true,
        cwd: process.env.HOME,
        detached: false,
    });
    let output = "";

    const exitCode = await new Promise((resolve, reject) => {
        proc.stdout.on('data', (data) => { output += data.toString() });
        proc.stderr.on('data', (data) => { output += data.toString() });
        proc.on('close', (code) => { resolve(code) });
    });

    output += `\n=== PROCESS EXITED WITH CODE ${exitCode} ===\n`;

    return output;
}
