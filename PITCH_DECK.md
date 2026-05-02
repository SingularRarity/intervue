# InterviewAI - Pitch Deck for Startup Outreach

## Slide 1: The Problem

**Hiring is broken for Indian startups:**

- HR teams spend **2-4 hours per candidate** on initial screening
- Phone screens are inconsistent and biased
- Language barriers limit candidate pool (especially Tier-2/3 cities)
- Startups with <50 employees can't afford dedicated recruiters
- Cost per hire: ₹50,000 - ₹2,00,000 for tech roles

**Real quotes from Gurgaon startups:**
> "We interview 20 people to hire 1. That's 40 hours of engineering time wasted." - CTO, Series A startup
> "Our HR person speaks Hindi, but our best React dev candidate only speaks Tamil." - Founder, 15-person team

---

## Slide 2: The Solution

**InterviewAI - AI Voice Interviews in 10+ Indian Languages**

1. **Paste a resume** → AI generates tailored questions
2. **Candidate speaks naturally** → AI listens in their language
3. **Get instant report** → Scores, strengths, weaknesses, hire/no-hire

**Powered by:**
- ![Sarvam AI](https://www.sarvam.ai/assets/og-images/home-og.png) **Sarvam AI** - India's best voice AI (STT/TTS in 10+ languages)
- ![Claude](https://www.anthropic.com/images/social.png) **Claude 3.5 Sonnet** - World's most intelligent AI for question generation

---

## Slide 3: How It Works (Demo)

```
[SCREEN RECORDING]

1. HR uploads job description
2. System generates 10 targeted questions
3. Candidate clicks link → Browser opens
4. AI: "Hello Rahul, I'm your interviewer today. Tell me about your experience with React."
5. Candidate speaks in Hindi/Tamil/English
6. AI responds naturally, asks follow-ups
7. 30 minutes later: Detailed report with scores
```

---

## Slide 4: Key Differentiators

| Feature | ConstructiveFeedback.in | InterviewAI |
|---------|------------------------|-------------|
| Languages | English only | **10+ Indian languages** |
| AI Brain | Generic | **Claude 3.5 Sonnet** |
| Voice Quality | Robotic | **Natural Indian voices (Sarvam)** |
| Multi-tenant | No | **Yes - each company isolated** |
| API Cost Model | Platform pays | **You bring your own keys** |
| Resume-aware questions | Basic | **Deep contextual analysis** |
| Pricing | ₹500/interview | **₹0 + your API usage** |

---

## Slide 5: Pricing (The Killer Feature)

**ZERO platform fees. You only pay for API usage.**

| Plan | Cost | Includes |
|------|------|----------|
| **Free Trial** | ₹0 | 50 interviews, 14 days |
| **Starter** | ₹0/month | Unlimited interviews, bring your own keys |
| **Pro** | ₹2,999/month | Priority support, custom templates, analytics |
| **Enterprise** | Custom | SLA, dedicated infra, SSO |

**Your API costs (approximate per interview):**
- Sarvam STT + TTS: ₹3-5
- Claude API: ₹8-15
- **Total per interview: ₹11-20**

Compare to: ₹2,000-5,000 per manual phone screen (engineer time)

**ROI: 100x cost savings**

---

## Slide 6: Target Market Validation

### Gurgaon - Sectors 30, 44, 45

**Verified companies actively hiring (2026 data):**

| Sector | Companies | Total Employees | Monthly Hiring |
|--------|-----------|-----------------|----------------|
| 45 | Zomato, PolicyBazaar, Delhivery, Paytm | 25,000+ | 200-400 |
| 44 | MakeMyTrip, Oyo, Ixigo, Goibibo | 10,000+ | 100-200 |
| 30 | Ola, Uber, Dunzo, Blinkit, Zepto | 25,000+ | 300-500 |

**Total addressable market in these 3 sectors alone: 600-1,100 hires/month**

At ₹20/interview vs ₹3,000/manual screen = **₹1.8L - ₹3.3L/month savings** for this cluster

---

## Slide 7: Bangalore, Hyderabad, Chennai Expansion

### Bangalore (Koramangala, HSR, Indiranagar)
- **500+ active startups** in 5km radius
- Average team size: 15-40
- Pain point: Engineers doing interviews = lost dev time
- **Target: 50 pilot customers in Month 1**

### Hyderabad (HITEC City, Gachibowli)
- **200+ product companies**
- Strong EdTech presence (BYJU's, Unacademy offices)
- Pain point: Multi-language hiring (Telugu + English)
- **Target: 30 pilot customers in Month 2**

### Chennai (OMR, Tidel Park)
- **150+ SaaS and manufacturing-tech companies**
- Pain point: Tamil-speaking candidates, English interviews
- **Target: 25 pilot customers in Month 3**

---

## Slide 8: The Ask

**We're looking for 10 pilot customers from each city.**

**What you get:**
- Free 14-day trial (50 interviews)
- 1-on-1 onboarding call
- Custom interview template setup
- Direct feedback channel to founders

**What we need from you:**
- Try it with 5-10 candidates
- Share honest feedback (what works, what doesn't)
- Introduce us to 2 other startup founders

**Sign up:** https://interviewai.dev/register
**Contact:** founders@interviewai.dev | +91-XXXXX-XXXXX

---

## Slide 9: Technical Architecture

```
Frontend: React 18 + TypeScript + Tailwind + Vite
Backend: Rust (Axum) + SQLx + PostgreSQL + Redis
AI: Sarvam AI (Voice) + Claude 3.5 (Brain)
Deployment: Docker Compose / Kubernetes
```

**Why Rust?**
- Handles 10,000+ concurrent WebSocket connections
- Memory safe, zero crashes
- 10x faster than Node.js for I/O bound workloads
- Perfect for real-time audio streaming

---

## Slide 10: Roadmap

**Q2 2026:**
- [x] Core voice interview engine
- [x] Multi-tenant architecture
- [x] 10+ Indian languages
- [x] Video interview mode
- [x] ATS integrations (Greenhouse, Lever)

**Q3 2026:**
- [x] AI resume parsing
- [x] Automated scheduling (candidate invite tokens)
- [x] Team collaboration features
- [x] Mobile candidate portal (public invite link)

**Q4 2026:**
- [x] Proctoring/anti-cheat
- [x] Coding assessment integration
- [x] Enterprise SSO (Google, GitHub, SAML)
- [x] White-label option

---

## Appendix: Competitor Analysis

| Competitor | Price | Languages | Voice Quality | Indian Focus |
|-----------|-------|-----------|---------------|--------------|
| ConstructiveFeedback.in | ₹500/int | English | Robotic | No |
| HireVue | $500/mo | English | Good | No |
| HackerRank | $300/mo | English | N/A (text) | Partial |
| InterviewAI | ₹0 + API | 10+ | Excellent (Sarvam) | **Yes** |

**Our moat:**
1. Only platform with Sarvam AI integration
2. Only platform where YOU own the API keys
3. Only platform truly built for Indian languages
4. Rust backend = unbeatable performance at scale

---

## Contact

**InterviewAI**
Built for Indian startups, by Indian builders.

Website: https://interviewai.dev
Email: founders@interviewai.dev
Demo: https://interviewai.dev/demo

**Powered by:**
- Sarvam AI (Voice)
- Anthropic Claude (Intelligence)
- Rust (Performance)
