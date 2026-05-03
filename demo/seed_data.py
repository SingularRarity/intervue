"""
Seed the local database with realistic demo data for the Intervue demo video.
Uses the live API so all business logic (hashing, etc.) is applied correctly,
then patches session results directly via psycopg2 for realistic scores/transcripts.

Run once before recording: python seed_data.py
Returns the IDs needed by browser_recorder.py.
"""
import os
import sys
import json
import uuid
import requests
import psycopg2
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

API_URL     = os.getenv("API_URL", "http://localhost:8080")
DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = int(os.getenv("DB_PORT", 5432))
DB_NAME     = os.getenv("DB_NAME", "ai_interview")
DB_USER     = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DEMO_EMAIL  = os.getenv("DEMO_EMAIL", "demo@techventure.in")
DEMO_PASS   = os.getenv("DEMO_PASSWORD", "DemoPass2026!")

DEMO_COMPANY = "TechVenture India"


# ---------------------------------------------------------------------------
# Demo transcript for Rahul's session
# ---------------------------------------------------------------------------
RAHUL_TRANSCRIPT = [
    {
        "role": "assistant",
        "content": "Welcome Rahul! I'm your AI interviewer today. We'll spend about 30 minutes covering system design and your engineering leadership experience. Ready to begin?",
    },
    {
        "role": "user",
        "content": "Yes, absolutely. Happy to be here.",
    },
    {
        "role": "assistant",
        "content": "Tell me about a time you scaled a backend system under production pressure.",
    },
    {
        "role": "user",
        "content": "At my previous company we processed two million payments daily. I led the migration to microservices — zero downtime was non-negotiable. We used canary deployments and feature flags. Cut latency by forty percent in three months.",
    },
    {
        "role": "assistant",
        "content": "Impressive. Walk me through your rollback strategy when a canary release went wrong.",
    },
    {
        "role": "user",
        "content": "We had automated health checks every sixty seconds. If error rate crossed two percent, the feature flag auto-disabled and traffic shifted back to the stable version. We rolled back a payment gateway update this way — users felt zero impact.",
    },
    {
        "role": "assistant",
        "content": "How did you coordinate across teams during the migration?",
    },
    {
        "role": "user",
        "content": "Weekly architecture review with all service owners. We maintained a shared ADR — Architecture Decision Record — so everyone understood the why behind each choice. Reduced the back-and-forth in code reviews significantly.",
    },
    {
        "role": "assistant",
        "content": "Thank you Rahul. Strong communication of technical decisions. That's it for today — your report will be ready shortly.",
    },
]

PRIYA_TRANSCRIPT = [
    {
        "role": "assistant",
        "content": "Hi Priya! I'll be your AI interviewer today. We'll cover product thinking, prioritization, and cross-functional collaboration. Ready?",
    },
    {
        "role": "user",
        "content": "Absolutely, let's go.",
    },
    {
        "role": "assistant",
        "content": "How do you prioritize when engineering and product are misaligned?",
    },
    {
        "role": "user",
        "content": "I go back to the user problem first. Then I use RICE scoring to make prioritization objective. It removes opinion from the conversation and replaces it with data. Works every time.",
    },
    {
        "role": "assistant",
        "content": "Give me an example where data and user empathy pointed in opposite directions.",
    },
    {
        "role": "user",
        "content": "Our analytics said the onboarding drop-off was at step three. But user interviews revealed people loved step three — they just ran out of time. So the real fix was saving progress, not simplifying the step. Data showed where, empathy showed why.",
    },
    {
        "role": "assistant",
        "content": "Excellent insight. How do you communicate roadmap trade-offs to stakeholders?",
    },
    {
        "role": "user",
        "content": "I use a one-page impact-effort matrix, updated every sprint. It's visual, honest about what we're not doing, and why. Stakeholders trust it because I never hide de-prioritized items.",
    },
    {
        "role": "assistant",
        "content": "Priya, that was a sharp session. Your analytical thinking combined with user empathy is exactly what we look for. Report incoming.",
    },
]

RAHUL_ANALYSIS = {
    "overall_score": 87.5,
    "recommendation": "Strong Hire",
    "skills": [
        {"skill": "System Design", "score": 90},
        {"skill": "Communication", "score": 88},
        {"skill": "Leadership", "score": 85},
        {"skill": "Problem Solving", "score": 87},
    ],
    "summary": "Rahul demonstrated strong ownership of complex distributed systems migrations. His use of canary deployments, feature flags, and ADRs shows engineering maturity. Communication was clear and structured throughout.",
    "strengths": [
        "Deep hands-on experience with zero-downtime migrations",
        "Structured approach to cross-team communication",
        "Metrics-driven decision making",
    ],
    "areas_for_growth": [
        "Could elaborate more on trade-off analysis during design decisions",
    ],
}

PRIYA_ANALYSIS = {
    "overall_score": 91.0,
    "recommendation": "Strong Hire",
    "skills": [
        {"skill": "Product Thinking", "score": 94},
        {"skill": "Data Literacy", "score": 89},
        {"skill": "Communication", "score": 92},
        {"skill": "Stakeholder Management", "score": 90},
    ],
    "summary": "Priya exhibits exceptional product thinking — she correctly identifies the difference between symptomatic data and root-cause empathy. Her RICE-based prioritization and visual roadmap communication are hallmarks of a senior PM.",
    "strengths": [
        "Outstanding ability to combine data with user empathy",
        "Transparent and visual stakeholder communication",
        "User-first framing in every answer",
    ],
    "areas_for_growth": [
        "Could discuss technical feasibility constraints more proactively",
    ],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def api_post(path: str, body: dict, token: str | None = None) -> dict:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = requests.post(f"{API_URL}{path}", json=body, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()


def db_conn():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD,
    )


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------

def seed() -> dict:
    """
    Seed demo data. Returns dict with session IDs and login token for recording.
    Idempotent: skips creation if demo tenant already exists.
    """
    print("=== Seeding demo data ===")

    # 1. Register or reuse demo tenant
    token = None
    try:
        data = api_post("/api/v1/tenants", {
            "company_name": DEMO_COMPANY,
            "email": DEMO_EMAIL,
            "password": DEMO_PASS,
            "industry": "Technology",
            "company_size": "11-50",
        })
        token = data["token"]
        print(f"  Created tenant: {DEMO_EMAIL}")
    except requests.HTTPError as e:
        if e.response.status_code == 409:
            # Already exists — login instead
            data = api_post("/api/v1/tenants/login", {"email": DEMO_EMAIL, "password": DEMO_PASS})
            token = data["token"]
            print(f"  Tenant exists, logged in: {DEMO_EMAIL}")
        else:
            raise

    # 2. Create interview templates
    t1 = api_post("/api/v1/interviews", {
        "title": "Senior Backend Engineer — Distributed Systems",
        "description": "30-minute async interview focusing on system design, scaling, and engineering leadership.",
        "interview_type": "Technical",
        "difficulty": "Hard",
        "duration_minutes": 30,
        "language": "en",
        "topics": ["System Design", "Microservices", "Performance", "Leadership"],
    }, token)["id"]
    print(f"  Template 1: {t1}")

    t2 = api_post("/api/v1/interviews", {
        "title": "Product Manager — Growth & Monetization",
        "description": "Behavioral + product thinking interview for PM roles.",
        "interview_type": "Mixed",
        "difficulty": "Medium",
        "duration_minutes": 25,
        "language": "en",
        "topics": ["Product Strategy", "Prioritization", "User Research", "Data Analysis"],
    }, token)["id"]
    print(f"  Template 2: {t2}")

    t3 = api_post("/api/v1/interviews", {
        "title": "Frontend Engineer — React & Performance",
        "description": "Technical screening for frontend engineers.",
        "interview_type": "Technical",
        "difficulty": "Medium",
        "duration_minutes": 20,
        "language": "en",
        "topics": ["React", "CSS", "Performance", "Accessibility"],
    }, token)["id"]
    print(f"  Template 3: {t3}")

    # 3. Create candidates
    rahul = api_post("/api/v1/candidates", {
        "name": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "phone": "+91-9876543210",
        "skills": ["Go", "Kubernetes", "PostgreSQL", "gRPC", "System Design"],
        "experience_years": 6,
        "current_position": "Senior Software Engineer at Razorpay",
    }, token)["id"]
    print(f"  Candidate Rahul: {rahul}")

    priya = api_post("/api/v1/candidates", {
        "name": "Priya Mehta",
        "email": "priya.mehta@example.com",
        "phone": "+91-9812345678",
        "skills": ["Product Strategy", "SQL", "Figma", "JTBD", "OKRs"],
        "experience_years": 5,
        "current_position": "Product Manager at CRED",
    }, token)["id"]
    print(f"  Candidate Priya: {priya}")

    aditya = api_post("/api/v1/candidates", {
        "name": "Aditya Nair",
        "email": "aditya.nair@example.com",
        "phone": "+91-9988776655",
        "skills": ["React", "TypeScript", "Next.js", "GraphQL"],
        "experience_years": 3,
        "current_position": "Frontend Engineer at Swiggy",
    }, token)["id"]
    print(f"  Candidate Aditya: {aditya}")

    # 4. Create sessions
    s_rahul = api_post("/api/v1/sessions", {
        "template_id": t1,
        "candidate_id": rahul,
    }, token)["id"]

    s_priya = api_post("/api/v1/sessions", {
        "template_id": t2,
        "candidate_id": priya,
    }, token)["id"]

    s_aditya = api_post("/api/v1/sessions", {
        "template_id": t3,
        "candidate_id": aditya,
    }, token)["id"]

    print(f"  Sessions: {s_rahul}, {s_priya}, {s_aditya}")

    # 5. Patch sessions with realistic completed state via direct SQL
    _patch_session(s_rahul, RAHUL_TRANSCRIPT, RAHUL_ANALYSIS)
    _patch_session(s_priya, PRIYA_TRANSCRIPT, PRIYA_ANALYSIS)
    _patch_session(s_aditya, [], {"overall_score": 72.0, "recommendation": "Consider", "skills": [], "summary": "Strong React fundamentals, needs more complex project experience.", "strengths": ["Clean code style"], "areas_for_growth": ["System design depth"]}, status="InProgress")

    print("=== Seed complete ===")

    return {
        "token": token,
        "session_rahul": s_rahul,
        "session_priya": s_priya,
        "template_backend": t1,
    }


def _patch_session(
    session_id: str,
    transcript: list,
    analysis: dict,
    status: str = "Completed",
):
    conn = db_conn()
    try:
        with conn.cursor() as cur:
            now = datetime.now(timezone.utc)
            started = now - timedelta(minutes=35)
            completed = now - timedelta(minutes=5)

            cur.execute(
                """
                UPDATE interview_sessions
                SET status = %s,
                    started_at = %s,
                    completed_at = %s,
                    overall_score = %s,
                    recommendation = %s,
                    transcript = %s,
                    analysis = %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (
                    status,
                    started if status == "Completed" else None,
                    completed if status == "Completed" else None,
                    analysis.get("overall_score"),
                    analysis.get("recommendation"),
                    json.dumps(transcript),
                    json.dumps(analysis),
                    session_id,
                ),
            )

            # Insert messages into interview_messages
            for msg in transcript:
                cur.execute(
                    "INSERT INTO interview_messages (session_id, role, content) VALUES (%s, %s, %s)",
                    (session_id, msg["role"], msg["content"]),
                )

        conn.commit()
        print(f"  Patched session {session_id} → {status}")
    finally:
        conn.close()


if __name__ == "__main__":
    result = seed()
    # Write seed output for browser_recorder.py to read
    out_path = Path(__file__).parent / "output" / "seed_output.json"
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(json.dumps(result, indent=2))
    print(f"\nSeed output written to {out_path}")
    print(json.dumps(result, indent=2))
