"""
FFmpeg-based video composition for the Intervue demo.

Pipeline:
  1. Convert Playwright WebM → raw MP4 (scene video)
  2. Mix master audio WAV into the scene video
  3. Generate a static end card image (logo + text)
  4. Convert end card image → 8-second video clip
  5. Concatenate scene video + end card clip
  6. Output final demo.mp4
"""
import os
import subprocess
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


END_CARD_DURATION = 8  # seconds
FFMPEG = shutil.which("ffmpeg") or "ffmpeg"


def _run(cmd: list, label: str):
    print(f"  [{label}] {' '.join(str(c) for c in cmd[:6])}...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  [ERROR] {label}:\n{result.stderr[-800:]}")
        raise RuntimeError(f"FFmpeg failed: {label}")
    return result


def _make_end_card(
    output_path: Path,
    logo_path: Path | None,
    width: int = 1280,
    height: int = 800,
):
    """
    Generate the end card PNG.
    Dark background, centered logo (if provided), product name + URL below.
    """
    img = Image.new("RGB", (width, height), color=(10, 14, 35))
    draw = ImageDraw.Draw(img)

    # Try to load a system font; fall back to default
    def _font(size: int):
        for family in ["DejaVuSans-Bold.ttf", "Arial.ttf", "Helvetica.ttf"]:
            for search in [
                Path("/usr/share/fonts/truetype/dejavu/") / family,
                Path("C:/Windows/Fonts/arialbd.ttf"),
                Path("C:/Windows/Fonts/arial.ttf"),
            ]:
                if search.exists():
                    try:
                        return ImageFont.truetype(str(search), size)
                    except Exception:
                        pass
        return ImageFont.load_default()

    y_center = height // 2

    # Logo
    logo_h = 0
    if logo_path and logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        max_w, max_h = width // 3, height // 5
        logo.thumbnail((max_w, max_h), Image.LANCZOS)
        bg = Image.new("RGBA", logo.size, (10, 14, 35, 255))
        bg.paste(logo, mask=logo.split()[3] if logo.mode == "RGBA" else None)
        logo_rgb = bg.convert("RGB")
        logo_x = (width - logo.width) // 2
        logo_y = y_center - logo.height - 32
        img.paste(logo_rgb, (logo_x, logo_y))
        logo_h = logo.height + 32

    # Product name
    font_large = _font(52)
    product_name = "Intervue"
    bbox = draw.textbbox((0, 0), product_name, font=font_large)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) // 2, y_center - logo_h // 2), product_name, font=font_large, fill=(255, 255, 255))

    # By line
    font_med = _font(22)
    by_line = "by SingularRarityLabs"
    bbox2 = draw.textbbox((0, 0), by_line, font=font_med)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(((width - tw2) // 2, y_center - logo_h // 2 + 70), by_line, font=font_med, fill=(100, 120, 180))

    # URL
    font_url = _font(18)
    url = "intervue.singularraritylabs.com"
    bbox3 = draw.textbbox((0, 0), url, font=font_url)
    tw3 = bbox3[2] - bbox3[0]
    draw.text(((width - tw3) // 2, y_center - logo_h // 2 + 112), url, font=font_url, fill=(60, 100, 160))

    img.save(str(output_path))
    print(f"  End card generated: {output_path}")


def compose(
    webm_path: Path,
    audio_path: Path,
    output_dir: Path,
    logo_path: Path | None = None,
    viewport: dict | None = None,
) -> Path:
    """
    Compose the final demo video. Returns path to the output MP4.
    """
    vp = viewport or {"width": 1280, "height": 800}
    w, h = vp["width"], vp["height"]

    tmp = output_dir / "_tmp"
    tmp.mkdir(parents=True, exist_ok=True)

    # Step 1: Convert WebM → MP4 (scene video, muted — we'll add audio next)
    scene_mp4 = tmp / "scene.mp4"
    _run([
        FFMPEG, "-y",
        "-i", str(webm_path),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-an",
        str(scene_mp4),
    ], "webm→mp4")

    # Step 2: Get scene video duration
    probe = subprocess.run(
        [FFMPEG, "-i", str(scene_mp4), "-f", "null", "-"],
        capture_output=True, text=True
    )
    # Parse duration from stderr
    import re
    dur_match = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", probe.stderr)
    scene_duration = 0.0
    if dur_match:
        h_val, m_val, s_val = dur_match.groups()
        scene_duration = int(h_val) * 3600 + int(m_val) * 60 + float(s_val)
    print(f"  Scene video duration: {scene_duration:.1f}s")

    # Step 3: Mix audio into scene video (pad/trim audio to match video)
    scene_with_audio = tmp / "scene_audio.mp4"
    _run([
        FFMPEG, "-y",
        "-i", str(scene_mp4),
        "-i", str(audio_path),
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-map", "0:v:0", "-map", "1:a:0",
        str(scene_with_audio),
    ], "mix audio")

    # Step 4: Generate end card image
    end_card_img = tmp / "end_card.png"
    _make_end_card(end_card_img, logo_path, width=w, height=h)

    # Step 5: Convert end card image → video clip
    end_card_mp4 = tmp / "end_card.mp4"
    _run([
        FFMPEG, "-y",
        "-loop", "1",
        "-i", str(end_card_img),
        "-t", str(END_CARD_DURATION),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-vf", f"scale={w}:{h}",
        "-an",
        str(end_card_mp4),
    ], "end card video")

    # Add silent audio to end card so concat filter works cleanly
    end_card_silent = tmp / "end_card_silent.mp4"
    _run([
        FFMPEG, "-y",
        "-i", str(end_card_mp4),
        "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "128k",
        "-t", str(END_CARD_DURATION),
        "-shortest",
        str(end_card_silent),
    ], "end card + silence")

    # Step 6: Write concat list
    concat_list = tmp / "concat.txt"
    concat_list.write_text(
        f"file '{scene_with_audio.resolve()}'\nfile '{end_card_silent.resolve()}'\n"
    )

    # Step 7: Concatenate
    final_path = output_dir / "intervue_demo.mp4"
    _run([
        FFMPEG, "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(final_path),
    ], "final concat")

    print(f"\n=== Demo video ready: {final_path} ===")
    return final_path
