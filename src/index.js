const { GoogleGenAI, Type } = require('@google/genai');
const socketIO = require('socket.io');
const { createServer } = require('http');
const http_server = createServer();
const io = socketIO(http_server);

require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SHELL = "/bin/zsh";
const SYSTEM_PROMPT = `
You are an AI assistant working for the user. The user is on MacOS Sonoma and uses the ${SHELL} shell.

You must:
- Assist quickly and clearly, without long speeches (TTS-friendly).
- Use function calls as needed, without hesitation.
- Respond in short, natural English, like "Here's what I found:" or "These are your folders:".
- No excuses. No overexplaining. No asking unnecessary questions.
- Assume normal paths like ~/Documents, ~/Downloads, etc., unless user says otherwise.

Your only job: Work for the user. Get things done. Keep it simple, clean, and smart.
`;

const gemini = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});

const tools = [
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
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            }
                        },
                    }
                }
            }
        ]
    }
]

const config = {
    tools,
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

io.on('connection', (socket) => {
    console.log("Client connected");
    if (client) {
        console.log("Disconnecting old client");
        client.disconnect();
    }
    client = socket;

    speak("Speech synthesis initiated. Now we're speaking!");
});

function speak(text, model = "tts_models/en/vctk/vits", speaker = "p233") {
    return new Promise((resolve, reject) => {
        if (client) {
            client.emitWithAck('speak', { text, model, speaker }, function(success, message) {
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
