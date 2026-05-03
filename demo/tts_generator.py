"""
TTS generation using Sarvam AI bulbul:v1 model.
Falls back to generating silent WAV of estimated duration if no API key.
"""
import os
import base64
import json
import struct
import math
import requests
from pathlib import Path


SARVAM_API_URL = "https://api.sarvam.ai/text-to-speech"
SAMPLE_RATE = 22050


def _words_per_second(voice_id: str) -> float:
    """Approximate speaking pace per voice for fallback duration estimation."""
    paces = {
        "meera":    2.8,
        "maitreyi": 2.6,
        "arvind":   2.7,
        "pavithra": 2.9,
    }
    return paces.get(voice_id, 2.7)


def _make_silent_wav(duration_seconds: float, output_path: Path) -> float:
    """Generate a silent WAV file of the given duration. Returns actual duration."""
    num_samples = int(SAMPLE_RATE * duration_seconds)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        # WAV header
        data_size = num_samples * 2  # 16-bit mono
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, SAMPLE_RATE, SAMPLE_RATE * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        f.write(b"\x00" * data_size)
    return duration_seconds


def _get_wav_duration(path: Path) -> float:
    """Read duration from a WAV file header."""
    with open(path, "rb") as f:
        f.seek(24)  # sample rate offset
        sample_rate = struct.unpack("<I", f.read(4))[0]
        f.seek(40)  # data chunk size
        data_size = struct.unpack("<I", f.read(4))[0]
    if sample_rate == 0:
        return 0.0
    return data_size / (sample_rate * 2)


def generate_audio(
    text: str,
    voice_id: str,
    output_path: Path,
    api_key: str | None = None,
    pace: float = 1.0,
) -> float:
    """
    Generate TTS audio for text using Sarvam AI.
    Returns the duration in seconds.
    Falls back to silence if api_key is None or request fails.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not api_key:
        word_count = len(text.split())
        estimated = word_count / _words_per_second(voice_id) / pace
        print(f"  [TTS fallback — silent] {voice_id}: {word_count} words → {estimated:.1f}s")
        return _make_silent_wav(estimated, output_path)

    payload = {
        "inputs": [text],
        "target_language_code": "en-IN",
        "speaker": voice_id,
        "pitch": 0,
        "pace": pace,
        "loudness": 1.5,
        "speech_sample_rate": SAMPLE_RATE,
        "enable_preprocessing": True,
        "model": "bulbul:v1",
    }
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post(SARVAM_API_URL, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        audio_b64 = data.get("audios", [None])[0]
        if not audio_b64:
            raise ValueError("No audio in Sarvam response")

        audio_bytes = base64.b64decode(audio_b64)
        output_path.write_bytes(audio_bytes)
        duration = _get_wav_duration(output_path)
        print(f"  [TTS ok] {voice_id}: '{text[:50]}...' → {duration:.1f}s")
        return duration

    except Exception as exc:
        print(f"  [TTS error] {voice_id}: {exc}. Using silence fallback.")
        word_count = len(text.split())
        estimated = word_count / _words_per_second(voice_id) / pace
        return _make_silent_wav(estimated, output_path)


def generate_all_scenes(scenes: list, audio_dir: Path, api_key: str | None) -> list:
    """
    Generate audio for every voice line in every scene.
    Returns scenes annotated with 'clip_path' and 'clip_duration' per voice line,
    and 'total_duration' per scene.
    """
    results = []
    for scene in scenes:
        annotated_lines = []
        scene_total = 0.0
        for i, line in enumerate(scene["voice_lines"]):
            fname = f"{scene['id']}_{i:02d}_{line['speaker']}.wav"
            path = audio_dir / fname
            duration = generate_audio(
                text=line["text"],
                voice_id=line["voice"],
                output_path=path,
                api_key=api_key,
            )
            scene_total += duration
            annotated_lines.append({**line, "clip_path": str(path), "clip_duration": duration})

        scene_total += scene.get("after_audio", 0.0)
        results.append({
            **scene,
            "voice_lines": annotated_lines,
            "total_duration": scene_total,
        })

    return results


def merge_scene_audio(scenes: list, output_path: Path, silence_gap: float = 0.0) -> float:
    """
    Concatenate all scene audio clips (in order) into a single master WAV.
    Returns total duration in seconds.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    all_frames: list[bytes] = []
    total_samples = 0

    def _load_wav_frames(path: str) -> bytes:
        with open(path, "rb") as f:
            f.seek(44)  # skip WAV header
            return f.read()

    gap_samples = int(SAMPLE_RATE * silence_gap)
    gap_bytes = b"\x00" * (gap_samples * 2)

    for scene in scenes:
        for line in scene["voice_lines"]:
            frames = _load_wav_frames(line["clip_path"])
            all_frames.append(frames)
            total_samples += len(frames) // 2

        # after_audio silence
        after = scene.get("after_audio", 0.0)
        if after > 0:
            pad = int(SAMPLE_RATE * after) * 2
            all_frames.append(b"\x00" * pad)
            total_samples += pad // 2

        # inter-scene gap
        if gap_samples:
            all_frames.append(gap_bytes)
            total_samples += gap_samples

    raw = b"".join(all_frames)
    data_size = len(raw)

    with open(output_path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, SAMPLE_RATE, SAMPLE_RATE * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        f.write(raw)

    return total_samples / SAMPLE_RATE
