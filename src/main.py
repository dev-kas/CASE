from TTS.api import TTS
import sounddevice as sd
from scipy.signal import butter, lfilter
import numpy as np
import socketio
import whisper

socket = socketio.Client(reconnection_attempts=9999999, reconnection=True, reconnection_delay=5, reconnection_delay_max=50)
device = "cpu"
models = {}
stt_model = whisper.load_model("base")

result = stt_model.transcribe("input.mp3")
print(result["text"])
exit()
# if torch.backends.mps.is_available():
#     device = "mps"
# elif torch.cuda.is_available():
#     device = "cuda"

@socket.event
def connect():
    print("Connected to server")

@socket.event
def disconnect():
    print("Disconnected from server")

@socket.event
def speak(data, ack):
    text = data["text"]
    model = data["model"]
    speaker = data["speaker"]

    try:
        if model not in models:
            models[model] = TTS(model_name=model).to(device)
        tts = models[model]
        wav = tts.tts(text=text, speaker=speaker)
        wav = butter_lowpass_filter(wav, cutoff=8000, fs=tts.synthesizer.output_sample_rate)
        wav = np.clip(wav, -1.0, 1.0)
        wav = wav / np.max(np.abs(wav))
        sd.play(wav, samplerate=tts.synthesizer.output_sample_rate)
        sd.wait()
        return True, "Speech generated successfully"
    except Exception as e:
        print(f"Error generating speech: {e}")
        return False, f"Error generating speech: {e}"

def butter_lowpass_filter(data, cutoff, fs, order=5):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    y = lfilter(b, a, data)
    return y

socket.connect("http://localhost:5500")
socket.wait()