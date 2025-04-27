# CASE

CASE is a personal AI assistant designed to interact with the user and perform tasks directly on their system via natural language and voice.

Built as a hybrid application, CASE consists of:
- A **Node.js server** acting as the central orchestrator, handling user input, managing conversation history with the Google Gemini API, and processing the AI's responses (text or function calls).
- A **Python client** connecting via Socket.IO, handling specialized tasks like:
    - Local Speech-to-Text (using Whisper) for transcribing voice input.
    - Local Text-to-Speech (using Coqui TTS) for generating voice output.
    - Executing shell commands (via Node.js's `child_process`, triggered by the AI's function calls) to interact with the file system, run applications, and perform system operations.

Inspired by the calm, logical, and efficient persona of the AI robot from *Interstellar*, CASE aims to be a smart, direct, and capable system agent that translates user requests into system actions, leveraging the power of large language models and local execution.
