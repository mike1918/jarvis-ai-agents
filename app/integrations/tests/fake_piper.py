#!/usr/bin/env python3
"""TEST DOUBLE for the piper CLI: `fake_piper.py -m MODEL -f OUT.wav` reads text from stdin and writes a short valid WAV."""
import sys, wave
args = sys.argv[1:]; out = args[args.index("-f") + 1]; text = sys.stdin.read()
with wave.open(out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050); w.writeframes(b"\x00\x00" * (220 * max(1, len(text))))
