"""
Intervue Demo Storyboard — 2-minute elevator pitch video.

Each scene has:
  id          : unique key
  nav         : callable name in browser_recorder.py
  voice_lines : list of {speaker, text, voice_id} dicts
  after_audio : seconds to hold the screen after all voice lines finish
"""

# Sarvam voice IDs
VOICE_NARRATOR   = "meera"      # Clear professional female — narrator
VOICE_AI         = "maitreyi"   # Calm female — AI interviewer
VOICE_RAHUL      = "arvind"     # Indian male — candidate
VOICE_PRIYA      = "pavithra"   # Indian female — candidate

SCENES = [
    {
        "id": "landing_hero",
        "nav": "show_landing",
        "voice_lines": [
            {
                "speaker": "narrator",
                "voice": VOICE_NARRATOR,
                "text": (
                    "Hiring is broken. Every week, hours wasted on scheduling, "
                    "inconsistent panels, and gut-feel decisions."
                ),
            }
        ],
        "after_audio": 1.0,
    },
    {
        "id": "landing_value",
        "nav": "scroll_features",
        "voice_lines": [
            {
                "speaker": "narrator",
                "voice": VOICE_NARRATOR,
                "text": (
                    "Intervue gives every candidate a consistent, AI-powered interview — "
                    "in their own time, in their own language. Async, unbiased, instant."
                ),
            }
        ],
        "after_audio": 1.0,
    },
    {
        "id": "dashboard",
        "nav": "show_dashboard",
        "voice_lines": [
            {
                "speaker": "narrator",
                "voice": VOICE_NARRATOR,
                "text": (
                    "Your talent dashboard. Live pipeline view across every role "
                    "you are currently hiring for."
                ),
            }
        ],
        "after_audio": 1.5,
    },
    {
        "id": "templates",
        "nav": "show_templates",
        "voice_lines": [
            {
                "speaker": "narrator",
                "voice": VOICE_NARRATOR,
                "text": (
                    "Create a structured interview template in under a minute. "
                    "Set topics, experience level, and duration."
                ),
            }
        ],
        "after_audio": 1.5,
    },
    {
        "id": "interview_q1",
        "nav": "show_interview_transcript",
        "voice_lines": [
            {
                "speaker": "ai_interviewer",
                "voice": VOICE_AI,
                "text": (
                    "Rahul, tell me about a time you scaled a backend system "
                    "under production pressure."
                ),
            }
        ],
        "after_audio": 0.5,
    },
    {
        "id": "interview_a1",
        "nav": "scroll_transcript_slow",
        "voice_lines": [
            {
                "speaker": "rahul",
                "voice": VOICE_RAHUL,
                "text": (
                    "At my previous company, we processed two million payments daily. "
                    "I led the migration to a microservices architecture — zero downtime "
                    "was non-negotiable. We used canary deployments and feature flags. "
                    "Cut latency by forty percent in three months."
                ),
            }
        ],
        "after_audio": 0.5,
    },
    {
        "id": "interview_q2",
        "nav": "scroll_transcript_slow",
        "voice_lines": [
            {
                "speaker": "ai_interviewer",
                "voice": VOICE_AI,
                "text": (
                    "Priya, how do you prioritize when engineering and product "
                    "are misaligned?"
                ),
            }
        ],
        "after_audio": 0.5,
    },
    {
        "id": "interview_a2",
        "nav": "scroll_transcript_slow",
        "voice_lines": [
            {
                "speaker": "priya",
                "voice": VOICE_PRIYA,
                "text": (
                    "I go back to the user problem first. Then I use RICE scoring "
                    "to make prioritization objective. It removes opinion from the "
                    "conversation and replaces it with data. Works every time."
                ),
            }
        ],
        "after_audio": 0.5,
    },
    {
        "id": "results",
        "nav": "show_results_score",
        "voice_lines": [
            {
                "speaker": "narrator",
                "voice": VOICE_NARRATOR,
                "text": (
                    "Instant AI scorecard. Communication, technical depth, problem solving — "
                    "all scored in seconds, not weeks."
                ),
            }
        ],
        "after_audio": 2.0,
    },
    {
        "id": "analytics",
        "nav": "show_analytics",
        "voice_lines": [
            {
                "speaker": "narrator",
                "voice": VOICE_NARRATOR,
                "text": (
                    "Track your full pipeline. Compare candidates across roles. "
                    "Make data-driven offers with confidence."
                ),
            }
        ],
        "after_audio": 2.0,
    },
    {
        "id": "cta",
        "nav": "show_cta",
        "voice_lines": [
            {
                "speaker": "narrator",
                "voice": VOICE_NARRATOR,
                "text": (
                    "Fifteen days free. No credit card required. "
                    "Built for Indian startups, by Indian founders. "
                    "Try Intervue today."
                ),
            }
        ],
        "after_audio": 1.0,
    },
]

# End card is generated by composer.py — not a browser scene
END_CARD_DURATION = 8.0  # seconds
