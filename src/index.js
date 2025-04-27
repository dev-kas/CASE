const { GoogleGenAI, Type } = require('@google/genai');
const socketIO = require('socket.io');
const { createServer } = require('http');
const http_server = createServer();
const io = socketIO(http_server);
const tools = require('./tools');
require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SHELL = "/bin/zsh";
const SYSTEM_PROMPT = `
# User-Specific Context:
You are assisting a user on a MacOS Sonoma system. Their preferred shell is ${SHELL}. Use this information to make decisions about paths, file locations, and environment. When interacting with the file system, assume paths like ~/Documents, ~/Downloads, etc., unless otherwise specified.

# CASE Personality and Behavior:
You are CASE, an AI assistant inspired by the robot from *Interstellar*. Your personality is calm, logical, and efficient. You focus on solving problems in the simplest and most direct way possible, while also keeping your responses quick, clear, and relevant.

Your main traits are:
- Efficient problem-solving with a clear, no-nonsense approach.
- Logical thinking, staying focused on providing clear solutions without hesitation.
- A subtle sense of humor, when appropriate, with a tone that remains calm and collected.

Follow these guidelines:
- Assist quickly and clearly, with short and natural English (TTS-friendly).
- No overexplaining or unnecessary questions. Keep it simple, smart, and fast.
- Use functions as needed, without hesitation.
- You have a solid knowledge base, including concepts like Snell's Law, OOP, and other basic principles. You are a general AI assistant, not limited to specific tasks.
- Respond like CASE from *Interstellar*: calm, concise, and always thinking logically.
- **NEVER EVER** use markdown unless the user explicitly requests it. Always respond in plain text, even if it's for code or any other data. If the user requests markdown, you may comply but only then.

Your only job: Work for the user. Get things done with logic, efficiency, and clarity. You are CASE, inspired by *Interstellar*, and you aim to assist in the most practical, intelligent way possible.
`;

const gemini = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});

const tools_definitions = [
    {
        functionDeclarations: [
            {
                name: "execute_shell_command",
                description: `Executes a shell command in ${SHELL} with the home directory set to the user's home directory and returns the stdout/stderr. Does not support interactive commands.`,
                parameters: {
                    type: Type.OBJECT,
                    required: ["command"],
                    properties: {
                        command: {
                            type: Type.STRING,
                        },
                    }
                }
            }
        ]
    }
]

const config = {
    tools: tools_definitions,
    responseMimeType: 'text/plain',
    systemInstruction: SYSTEM_PROMPT
}

const model = "gemini-2.0-flash";
const contents = [];

function sendMessage(content) {
    contents.push(content);
}

async function chat(message) {
    sendMessage(message);

    const response = await gemini.models.generateContent({
        model, contents, config
    });

    sendMessage(response.candidates[0].content);

    return contents[contents.length - 1];
}

// (async()=>{
//     const resp = await chat({
//         role: "user",
//         parts: [{text: "tell me the contents of documents folder"}]
//     });

//     debugger;

//     await chat({
//         role: "user",
//         parts: [
//             {
//                 functionResponse: {
//                     name: "execute_shell_command",
//                     response: {
//                         output: "Office\\ Stuff Food\\ Recipes Projects Family\\ Photos"
//                     }
//                 }
//             }
//         ]
//     });

//     debugger;

//     await chat({
//         role: "user",
//         parts: [{text: "i have an app.log file inside the Jarvis project. can you fetch me all the places where a warning occured?"}]
//     })

//     debugger;

//     await chat({
//         role: "user",
//         parts: [
//             {
//                 functionResponse: {
//                     name: "execute_shell_command",
//                     response: {
//                         output: `Warning: Disk space is running low.\nWarning: API call timed out.\nWarning: AI Services malfunctioned. All services have restarted\nService_2 Warning: Unplanned shutdown signal received.`
//                     }
//                 }
//             }
//         ]
//     });

//     console.dir(contents, {depth: null});
// })();

// (async ()=>{
//     await speak("Speech synthesis initiated. Now we're speaking!");
// })();

// socket io management
let client = null;

io.on('connection', async (socket) => {
    console.log("Client connected");
    if (client) {
        console.log("Disconnecting old client");
        client.disconnect();
    }
    client = socket;

    let isRunning = true;
    let i = 0;
    await speak("You can now start speaking.");
    while (isRunning) {
        i++;
        const response = await listen();
        await converse(await chat({
            role: "user",
            parts: [
                {
                    text: response.text
                }
            ]
        }));
        // if (i >= 5) {
            isRunning = false;
        // }
    }
        
    async function converse(res) {
        console.dir(res, {depth: null});
        for (const part of res.parts) {
            if (part.text) {
                await speak(part.text);
            } else if (part.functionCall) {
                const { name, args } = part.functionCall;
                args.shell = SHELL;
                if (tools[name]) {
                    console.log()
                    const output = await tools[name].activate(args);
                    console.log(output);
                    await converse(await chat({
                        role: "user",
                        parts: [{
                            functionResponse: { name, response: { output } }
                        }]
                    }));
                } else {
                    console.error(`Tool ${name} not found`);
                }
            }
        }
    }
});

function speak(text, model = "tts_models/en/vctk/vits", speaker = "p233") {
    return new Promise((resolve, reject) => {
        if (client) {
            client.emit('speak', { text, model, speaker }, (success, message) => {
                if (success) {
                    resolve(message);
                } else {
                    reject(message);
                }
            });
        } else {
            reject("No client connected");
        }
    });
}

function listen() {
    return new Promise((resolve, reject) => {
        if (client) {
            client.emit('listen', {}, function (success, message) {
                if (success) {
                    resolve(message);
                } else {
                    reject(message);
                }
            });
        } else {
            reject("No client connected");
        }
    });
}

http_server.on('request', (req, res) => {
    if (req.url === "/") {
        res.end("Server is ONLINE");
    }
});

http_server.listen(5500, () => {
    console.log("Server is listening on port 5500");
});
