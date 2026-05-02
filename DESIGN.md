# Design System — InterviewAI

## Product Context
- **What this is:** AI-powered voice and video interview platform for high-volume hiring at Indian tech companies
- **Who it's for:** Recruiters and HR leads at companies like Zomato, Ola, Paytm, Swiggy running hundreds of interviews monthly; and the candidates they screen (mobile-first, multi-language)
- **Space/industry:** HR Tech / AI Recruiting, Indian enterprise SaaS
- **Project type:** B2B SaaS — three surfaces: recruiter dashboard (daily driver), candidate portal (mobile-first, high-stakes), marketing landing page

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian with editorial confidence
- **Decoration level:** Minimal intentional — typography and data do the work; decoration only where it earns its place
- **Mood:** Serious tools don't show off, they just work. The product should feel like what Notion would design if it entered HR tech — precision-engineered, not flashy. Every pixel earns its place. Hiring decisions are high-stakes; the UI should communicate that.
- **Memorable thing:** "This is serious software for serious hiring decisions."
- **Reference sites:** Linear, Raycast (split-surface treatment); Carta, Ramp (serif + data sans pairing)

## Typography
- **Display/Hero:** Instrument Serif — rationale: no other HR platform uses a serif; a confident serif signals "we've earned the right to be different." Used for landing page heroes, section headings, and key metric callouts.
- **Body/UI:** Geist — rationale: built for density and precision, excellent tabular-nums support, modern but not trendy. Used for all UI text, labels, navigation, body copy.
- **Data/Tables:** Geist with `font-variant-numeric: tabular-nums` — numbers align cleanly in score columns and analytics tables.
- **Code:** Geist Mono — used for code assessment output, session IDs, raw score displays.
- **Loading:** Google Fonts CDN — `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap`
- **Scale:**
  - Display: 32–58px, Instrument Serif, letter-spacing -0.02em to -0.03em
  - Heading 1: 24px, Geist 600, letter-spacing -0.01em
  - Heading 2: 18px, Geist 600
  - Body: 15px, Geist 400, line-height 1.6
  - Small/Table: 13px, Geist 400
  - Label: 11px, Geist 700, uppercase, letter-spacing 0.08–0.12em

## Color
- **Approach:** Restrained — color is rare; when it appears, it means something
- **Primary surface (sidebar/nav):** `#1E2235` (Slate 900) — deep slate, not navy (HireVue owns navy), not black (too heavy), not purple (every Indian SaaS)
- **Canvas (dashboard content area):** `#F8F7F5` — warm gray, not pure white; reduces eye strain for daily-driver use
- **Accent:** `#10B981` (Emerald) — the color of a green hire signal, growth, positive outcomes; nobody in HR tech owns this color
- **Accent dark:** `#059669` — hover states, pressed states
- **Accent light:** `#D1FAE5` — badge backgrounds, success states, tips blocks
- **Text primary:** `#0F0F0F` on light surfaces; `#FFFFFF` on dark surfaces
- **Text secondary:** `#4A5472` (Slate 600) on light; `#7A8AAD` (Slate 400) on dark
- **Borders:** `#D0D6E8` (Slate 200) on light; `#2E3650` (Slate 700) on dark
- **Semantic colors:**
  - Success: `#10B981` (emerald) — "Proceed" status
  - Warning: `#F59E0B` (amber) — "Review" status
  - Error: `#EF4444` (red) — "Reject" status, score bars below threshold
  - Info: `#3B82F6` (blue) — informational messages only
- **Dark mode strategy:** Dark surfaces use the slate scale (900→800→700); reduce emerald saturation by ~10%; keep semantic colors at full saturation since they carry meaning

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable on dashboard (data-dense but not cramped); generous on candidate portal (mobile, high-stakes, needs breathing room)
- **Scale:** 2(2px) 4(4px) 8(8px) 12(12px) 16(16px) 24(24px) 32(32px) 48(48px) 64(64px) 80(80px)
- **Component padding rhythm:** Buttons 9px/18px (default), 6px/12px (sm); cards 16–28px; table cells 12px/16px

## Layout
- **Approach:** Hybrid — grid-disciplined for the recruiter dashboard; single-column generous for the candidate portal; editorial for the landing page hero
- **Recruiter dashboard:** 220px fixed sidebar + fluid content area; split surface (dark sidebar, warm gray canvas)
- **Candidate portal:** Single-column, max-width 375px (mobile-native), generous vertical rhythm
- **Landing page:** 1200px max-width container, 32px gutters; editorial hero full-bleed dark, feature sections on white
- **Grid:** 12-column at desktop (>1024px), 4-column at tablet (768–1024px), 1-column at mobile (<768px)
- **Border radius:** sm 6px (buttons, badges), md 8px (cards, panels, inputs), lg 12px (mockup frames, mobile frame), full 9999px (pills, lang chips)

## Motion
- **Approach:** Minimal functional — only transitions that orient the user
- **Easing:** enter `ease-out`; exit `ease-in`; move `ease-in-out`
- **Duration:**
  - Micro (hover, focus ring): 100–120ms
  - Short (button press, badge state): 150ms
  - Medium (sidebar collapse, panel slide): 200–250ms
  - Long (score reveal animation): 400ms
- **What moves:** Sidebar hover/active states; score bar fill on load; session status badge color transitions; modal/sheet entrance
- **What does not move:** Data tables (stability is a feature for data-dense contexts); the score value number itself (no counting animation — it's not a game)

## Surface Treatment
- **The split:** Dark slate sidebar (`#1E2235`) + warm gray content canvas (`#F8F7F5`). This is the core structural call. It creates clear hierarchy: the nav is structural, the data is live.
- **Sidebar:** `background: #1E2235`. Section labels 11px uppercase slate-600. Nav items 13px slate-400, active: white on slate-800 background. Nav badges: emerald for active alerts, slate-700 for counts.
- **Content panels:** White (`#FFFFFF`) cards on warm gray canvas (`#F8F7F5`). 1px border `#D0D6E8`. 8px border-radius. No drop shadow on inline panels (shadow creates depth, not needed here). Subtle shadow only on modals and floating elements: `0 4px 32px rgba(0,0,0,0.08)`.
- **Candidate portal:** White background. Dark slate hero block at top for company branding. Emerald CTAs. Single green tips block with `#D1FAE5` background.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-03 | Instrument Serif for hero type | No HR tech competitor uses a serif — deliberate differentiation signal |
| 2026-05-03 | Emerald (#10B981) accent | Ownable in HR tech space; "proceed/growth" semantic meaning; avoids navy (HireVue) and purple (Indian SaaS cliché) |
| 2026-05-03 | Split surface (dark sidebar + warm gray canvas) | Linear/Raycast pattern; separates navigation structure from live data clearly |
| 2026-05-03 | Geist for UI and data | Excellent at density, tabular-nums, modern without being trendy; pairs well with the serif |
| 2026-05-03 | Warm gray canvas (#F8F7F5) over pure white | Reduces eye strain for daily-driver recruiter use; differentiates from generic SaaS white |
| 2026-05-03 | Initial design system | Created by /design-consultation; research from HireVue, Karat, Interview Mocha, Springworks |
