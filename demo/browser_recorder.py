"""
Playwright-based screen recorder for the Intervue demo video.

Navigates through the running app, pausing at each scene for exactly the
duration of that scene's audio. Produces a WebM video file.

Usage: called from generate_demo.py — not meant to be run directly.
"""
import os
import time
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, Page


APP_URL = os.getenv("APP_URL", "http://localhost:3000")


# ---------------------------------------------------------------------------
# Navigation actions — one function per storyboard scene nav value
# ---------------------------------------------------------------------------

def _slow_scroll(page: Page, pixels: int = 300, steps: int = 6, delay_ms: int = 200):
    """Smoothly scroll down the page."""
    step_px = pixels // steps
    for _ in range(steps):
        page.evaluate(f"window.scrollBy(0, {step_px})")
        page.wait_for_timeout(delay_ms)


def show_landing(page: Page, duration: float, **_):
    page.goto(APP_URL, wait_until="networkidle")
    page.wait_for_timeout(800)
    page.wait_for_timeout(int(duration * 1000))


def scroll_features(page: Page, duration: float, **_):
    _slow_scroll(page, pixels=500, steps=10, delay_ms=int(duration * 80))
    remaining = max(0, duration - (500 / 300 * 0.2))
    if remaining > 0:
        page.wait_for_timeout(int(remaining * 1000))


def show_dashboard(page: Page, duration: float, token: str, **_):
    page.goto(f"{APP_URL}/login", wait_until="networkidle")
    page.wait_for_timeout(400)
    page.fill("input[type='email']", os.getenv("DEMO_EMAIL", "demo@techventure.in"))
    page.fill("input[type='password']", os.getenv("DEMO_PASSWORD", "DemoPass2026!"))
    page.wait_for_timeout(300)
    page.click("button[type='submit']")
    page.wait_for_url(f"{APP_URL}/dashboard", timeout=10000)
    page.wait_for_timeout(600)
    _slow_scroll(page, pixels=200, steps=4, delay_ms=300)
    page.wait_for_timeout(int(max(0, duration - 2.0) * 1000))


def show_templates(page: Page, duration: float, **_):
    page.click("a[href='/templates']")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(600)
    _slow_scroll(page, pixels=200, steps=4, delay_ms=300)
    page.wait_for_timeout(int(max(0, duration - 1.5) * 1000))


def show_interview_transcript(page: Page, duration: float, session_rahul: str, **_):
    page.goto(f"{APP_URL}/results/{session_rahul}", wait_until="networkidle")
    page.wait_for_timeout(800)
    # Zoom slightly to make transcript legible
    page.evaluate("document.body.style.zoom = '1.05'")
    page.wait_for_timeout(int(duration * 1000))


def scroll_transcript_slow(page: Page, duration: float, **_):
    _slow_scroll(page, pixels=180, steps=8, delay_ms=int(duration * 80))
    page.wait_for_timeout(int(max(0, duration - 1.5) * 1000))


def show_results_score(page: Page, duration: float, **_):
    # Scroll back to top of results to show the score card
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(500)
    _slow_scroll(page, pixels=150, steps=5, delay_ms=300)
    page.wait_for_timeout(int(max(0, duration - 2.0) * 1000))


def show_analytics(page: Page, duration: float, **_):
    page.click("a[href='/analytics']")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(700)
    _slow_scroll(page, pixels=200, steps=5, delay_ms=300)
    page.wait_for_timeout(int(max(0, duration - 2.0) * 1000))


def show_cta(page: Page, duration: float, **_):
    page.goto(APP_URL, wait_until="networkidle")
    page.wait_for_timeout(500)
    # Scroll to CTA section
    page.evaluate("document.querySelector('#feedback')?.scrollIntoView({behavior:'smooth'})")
    page.wait_for_timeout(int(duration * 1000))


# ---------------------------------------------------------------------------
# NAV dispatch table
# ---------------------------------------------------------------------------
NAV_ACTIONS = {
    "show_landing":             show_landing,
    "scroll_features":          scroll_features,
    "show_dashboard":           show_dashboard,
    "show_templates":           show_templates,
    "show_interview_transcript": show_interview_transcript,
    "scroll_transcript_slow":   scroll_transcript_slow,
    "show_results_score":       show_results_score,
    "show_analytics":           show_analytics,
    "show_cta":                 show_cta,
}


# ---------------------------------------------------------------------------
# Main recorder
# ---------------------------------------------------------------------------

def record(
    scenes: list,
    output_dir: Path,
    seed_output: dict,
    viewport: dict | None = None,
) -> Path:
    """
    Record the browser session and return the path to the WebM video file.

    scenes      : annotated scenes from tts_generator.generate_all_scenes()
    output_dir  : where to write the video
    seed_output : dict from seed_data.seed() — contains session IDs + token
    """
    video_dir = output_dir / "video"
    video_dir.mkdir(parents=True, exist_ok=True)

    vp = viewport or {"width": 1280, "height": 800}

    print("=== Starting browser recording ===")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--start-maximized", "--disable-infobars", "--no-default-browser-check"],
        )
        context = browser.new_context(
            viewport=vp,
            record_video_dir=str(video_dir),
            record_video_size=vp,
            device_scale_factor=1,
        )
        page = context.new_page()

        # Suppress cookie banners / alerts
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        """)

        ctx = {
            "token":          seed_output.get("token", ""),
            "session_rahul":  seed_output.get("session_rahul", ""),
            "session_priya":  seed_output.get("session_priya", ""),
        }

        for scene in scenes:
            nav_fn = NAV_ACTIONS.get(scene["nav"])
            if not nav_fn:
                print(f"  [WARN] Unknown nav action: {scene['nav']} — skipping")
                continue

            print(f"  Scene: {scene['id']} ({scene['total_duration']:.1f}s)")
            try:
                nav_fn(page, duration=scene["total_duration"], **ctx)
            except Exception as exc:
                print(f"  [ERROR] Scene {scene['id']}: {exc}")
                page.wait_for_timeout(int(scene["total_duration"] * 1000))

        context.close()
        browser.close()

    # Playwright writes a single WebM file into video_dir
    webm_files = sorted(video_dir.glob("*.webm"))
    if not webm_files:
        raise FileNotFoundError(f"No WebM found in {video_dir}")

    webm_path = webm_files[-1]
    print(f"  Video recorded: {webm_path}")
    return webm_path
