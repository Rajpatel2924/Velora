# Velora — AI Mental Wellness Companion for Gen Z

## Original Problem Statement
Build a complete production-ready, mobile-first AI-powered mental health platform specifically designed for Gen Z users. The app focuses on AI conversations, mood tracking, journaling, habit building, meditation, wellness analytics, gamification, and community support — with a premium Gen Z dark aesthetic, glassmorphism, purple+blue gradients, smooth animations, and accessibility.

## Tech Stack (built)
- Frontend: React (JS) + Tailwind + shadcn/ui + Framer Motion + Recharts + Sonner toasts
- Backend: FastAPI + Motor (async MongoDB)
- AI: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`), OpenAI Whisper STT, OpenAI TTS — all via `emergentintegrations` + Emergent Universal LLM Key
- Auth: JWT (email/password + Guest mode)

## User Personas
- Gen Z students (13-27) feeling overwhelmed by academic pressure, anxiety, burnout
- Young professionals managing stress, sleep, and motivation
- Privacy-first users who want anonymous, judgement-free reflection

## Core Requirements (static)
- Premium dark-mode UI with glassmorphism and purple-blue gradients
- AI chat that's empathetic, casual, Gen Z-aware, never preachy
- Privacy: data scoped to user account; guest mode supported
- Mobile-first responsive with both mobile bottom nav and desktop sidebar
- Crisis safety: SOS dialog with hotlines always one tap away

## What's Implemented (2026-06-14)
- ✅ Auth: register, login, guest, JWT, /auth/me, /auth/onboarding
- ✅ 8-step onboarding wizard (name → age → role → goals → stress → sleep → activities → daily goal)
- ✅ Landing page (hero, features, mood demo, testimonials, pricing, FAQ, footer)
- ✅ Dashboard with wellness score, streak, level, avg mood, XP progress bar, 14-day trend, AI insight, quick-action tiles
- ✅ Mood tracker — 9 emojis, optional note, 7×7 heatmap, distribution bar chart, area trend chart, stability score
- ✅ AI Chat — Claude Sonnet 4.5 SSE streaming, suggested prompts, voice input (Whisper)
- ✅ Journal — text + voice (Whisper) entries with AI sentiment + insight; categories; search; delete
- ✅ Habit tracker — 8 default seed habits, custom habits, daily toggle with streaks and longest streak
- ✅ Breathing exercises — Box, 4-7-8, Deep, Calm, Focus with animated breathing circle
- ✅ Meditation Center — 5 sessions with progress timer, AI voice guide (OpenAI TTS)
- ✅ 8 Mental health assessments (anxiety, stress, burnout, depression, social anxiety, self-esteem, productivity, wellbeing) with interpretation + recommendations + history
- ✅ Sleep tracker (in Profile)
- ✅ Gamification: XP, 6 levels (Beginner → Wellness Champion), wellness coins, 4 badges, streak system
- ✅ Emergency SOS dialog with hotlines (US/UK/IN/AU/CA) + tips
- ✅ Profile page with badges, sleep history, goals

## Test Results
- Backend pytest: 31/31 passing
- Frontend E2E: 10/10 flows passing

## Prioritized Backlog
### P1 (next iteration)
- Anonymous community platform with topic rooms, posts, reactions, moderation
- Wellness challenges (7-day Gratitude, 30-day Wellness, Digital Detox) with progress UI
- Resource library (articles, videos, podcasts)
- AI weekly wellness report (downloadable)
- Spotify mood-based playlist recommendations
- Admin dashboard with moderation & content management

### P2
- Apple / Google OAuth (replace email-only)
- Push/email notifications for daily check-in, meditation reminders
- Mood prediction model based on patterns
- Custom challenge creation
- Real-time multi-user features (community)

## Next Tasks
1. Build community platform (anonymous posts, rooms, moderation)
2. Add wellness challenges + UI for join/track/complete
3. Resource library with embedded media
4. Add AI weekly report PDF/email export

## Files of Note
- `/app/backend/server.py` — all API routes
- `/app/backend/ai_service.py` — Claude streaming, sentiment, insight gen
- `/app/backend/models.py` — Pydantic models
- `/app/backend/auth_utils.py` — JWT + bcrypt
- `/app/frontend/src/App.js` — routes
- `/app/frontend/src/pages/*` — 10 pages
- `/app/frontend/src/components/AppShell.jsx` — layout + nav
- `/app/memory/test_credentials.md` — test accounts
