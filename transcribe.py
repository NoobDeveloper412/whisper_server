import sys
import whisper

model = whisper.load_model("base")  # Change model as needed (tiny, base, small, medium, large)
result = model.transcribe(sys.argv[1])
print(result["text"])
