"""
Intervue Demo Generator — main entry point.

Usage:
    python generate_demo.py [--skip-seed] [--skip-record] [--skip-tts]

Steps:
    1. Seed database with demo data
    2. Generate TTS audio for all scenes (Sarvam AI)
    3. Record browser walkthrough (Playwright)
    4. Compose final video with audio + end card (FFmpeg)

Output: output/intervue_demo.mp4  (~2 minutes)
"""
import os
import sys
import json
import argparse
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Load env from demo/.env (copy from .env.example and fill in)
_here = Path(__file__).parent
load_dotenv(_here / ".env")

# Make sure local modules are importable
sys.path.insert(0, str(_here))

import storyboard
import tts_generator
import browser_recorder
import composer


def _check_ffmpeg():
    if not shutil.which("ffmpeg"):
        print(
            "\n[ERROR] ffmpeg not found in PATH.\n"
            "  Windows: winget install ffmpeg\n"
            "  Or download from https://ffmpeg.org/download.html and add to PATH.\n"
        )
        sys.exit(1)


def _check_playwright():
    try:
        import playwright  # noqa: F401
    except ImportError:
        print("\n[ERROR] playwright not installed. Run:\n  pip install -r requirements.txt\n  playwright install chromium\n")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Generate Intervue demo video")
    parser.add_argument("--skip-seed",   action="store_true", help="Skip DB seeding (use existing seed_output.json)")
    parser.add_argument("--skip-tts",    action="store_true", help="Skip TTS generation (use existing audio files)")
    parser.add_argument("--skip-record", action="store_true", help="Skip browser recording (use existing WebM)")
    args = parser.parse_args()

    output_dir = _here / os.getenv("OUTPUT_DIR", "output")
    audio_dir  = output_dir / "audio"
    output_dir.mkdir(exist_ok=True)
    audio_dir.mkdir(exist_ok=True)

    logo_path = _here / "assets" / "logo.png"
    if not logo_path.exists():
        print("[WARN] No logo at demo/assets/logo.png — end card will use text only.")
        logo_path = None

    sarvam_key = os.getenv("SARVAM_API_KEY") or None
    if not sarvam_key:
        print("[WARN] SARVAM_API_KEY not set — TTS will produce silence.\n"
              "       Set it in demo/.env for real Indian voices.")

    # ------------------------------------------------------------------
    # Step 1: Seed
    # ------------------------------------------------------------------
    seed_path = output_dir / "seed_output.json"

    if args.skip_seed and seed_path.exists():
        print("=== Skipping seed (using existing seed_output.json) ===")
        seed_output = json.loads(seed_path.read_text())
    else:
        print("=== Step 1: Seeding demo data ===")
        import seed_data
        seed_output = seed_data.seed()
        seed_path.write_text(json.dumps(seed_output, indent=2))

    # ------------------------------------------------------------------
    # Step 2: Generate TTS audio
    # ------------------------------------------------------------------
    master_audio = audio_dir / "master.wav"

    if args.skip_tts and master_audio.exists():
        print("=== Skipping TTS (using existing master.wav) ===")
        # Still need annotated scenes for timing
        annotated = tts_generator.generate_all_scenes(
            storyboard.SCENES, audio_dir, api_key=None
        )
    else:
        print("=== Step 2: Generating TTS audio ===")
        annotated = tts_generator.generate_all_scenes(
            storyboard.SCENES, audio_dir, api_key=sarvam_key
        )
        total_audio = tts_generator.merge_scene_audio(annotated, master_audio)
        print(f"  Master audio: {total_audio:.1f}s (+ {storyboard.END_CARD_DURATION}s end card)")

    total_dur = sum(s["total_duration"] for s in annotated) + storyboard.END_CARD_DURATION
    print(f"  Total estimated video duration: {total_dur:.1f}s ({total_dur/60:.1f} min)")

    # ------------------------------------------------------------------
    # Step 3: Record browser
    # ------------------------------------------------------------------
    webm_dir = output_dir / "video"
    existing_webm = sorted(webm_dir.glob("*.webm")) if webm_dir.exists() else []

    if args.skip_record and existing_webm:
        webm_path = existing_webm[-1]
        print(f"=== Skipping browser recording (using {webm_path.name}) ===")
    else:
        _check_playwright()
        print("=== Step 3: Recording browser walkthrough ===")
        print("  Browser window will open — do not interact with it.\n")
        webm_path = browser_recorder.record(
            scenes=annotated,
            output_dir=output_dir,
            seed_output=seed_output,
            viewport={"width": 1280, "height": 800},
        )

    # ------------------------------------------------------------------
    # Step 4: Compose final video
    # ------------------------------------------------------------------
    _check_ffmpeg()
    print("=== Step 4: Composing final video ===")
    final_path = composer.compose(
        webm_path=webm_path,
        audio_path=master_audio,
        output_dir=output_dir,
        logo_path=logo_path,
        viewport={"width": 1280, "height": 800},
    )

    print(f"\n{'='*60}")
    print(f"  DONE: {final_path}")
    print(f"  Duration: ~{total_dur:.0f}s")
    print(f"  Share this file with your investor and HR outreach.")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
