import os
from TTS.api import TTS
import sounddevice as sd
from scipy.signal import butter, lfilter
import numpy as np
import socketio
import whisper
import time
from scipy.io.wavfile import write

socket = socketio.Client(reconnection_attempts=9999999, reconnection=True, reconnection_delay=5, reconnection_delay_max=50)
device = "cpu"
models = {}
stt_model = whisper.load_model("base")
THRESHOLD = 3.6
SAMPLE_RATE = 16000
CHANNELS = 1
SILENCE_TOLERANCE = 3

# if torch.backends.mps.is_available():
#     device = "mps"
# elif torch.cuda.is_available():
#     device = "cuda"

@socket.event
def connection():
    print("Connected to server")

@socket.event
def disconnect():
    print("Disconnected from server")

@socket.on("speak")
def speak(data):
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
        print("Speech generated successfully")
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

@socket.event
def listen(data):
    thr = data["threshold"] if "threshold" in data else THRESHOLD
    fs = data["sample_rate"] if "sample_rate" in data else SAMPLE_RATE
    st = data["silence_tolerance"] if "silence_tolerance" in data else SILENCE_TOLERANCE
    listen_internal(threshold=thr, fs=fs, silence_tolerance=st)
    result = stt_model.transcribe("recording.wav")
    try:
        os.remove("recording.wav")
    except FileNotFoundError:
        pass
    
    return True, result

def listen_internal(threshold=THRESHOLD, fs=SAMPLE_RATE, silence_tolerance=SILENCE_TOLERANCE):
    print("Listening for voice...")
    recording = []
    started = False
    last_voice_time = None
    completed = False

    def callback(indata, frames, time_info, status):
        nonlocal recording, started, last_voice_time, completed
        volume_norm = np.linalg.norm(indata) * 10
        if volume_norm > threshold:
            if not started:
                print("Voice detected! Recording...")
                started = True
            recording.append(indata.copy())
            last_voice_time = time.time()
        elif started:
            if last_voice_time and (time.time() - last_voice_time) > silence_tolerance:
                print("Voice stopped. Stopping recording.")
                completed = True
                raise sd.CallbackStop()
            else:
                recording.append(indata.copy())
        
    with sd.InputStream(callback=callback, channels=CHANNELS, samplerate=fs):
        while not completed:
            time.sleep(0.1)

    audio_data = np.concatenate(recording, axis=0)
    write("recording.wav", fs, (audio_data * 32767).astype(np.int16))
    print("Recording saved as recording.wav")

socket.connect("http://localhost:5500")
socket.wait()