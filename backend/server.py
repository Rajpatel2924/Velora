"""Velora — AI Mental Wellness Companion backend."""
import os
import io
import json
import logging
from openai import AsyncOpenAI
from datetime import datetime, timezone, date, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
openai_client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

from models import (
    RegisterRequest, LoginRequest, GuestRequest, AuthResponse,
    User, OnboardingSubmit,
    MoodCreate, MoodEntry,
    JournalCreate, JournalEntry,
    HabitCreate, Habit,
    ChatMessageCreate, ChatMessage,
    AssessmentSubmit, AssessmentResult,
    SessionLog, SleepCreate, SleepEntry,
    PostCreate, ReactionToggle, ReportCreate, CommunityPost,
    new_id, now_iso,
)
from auth_utils import hash_password, verify_password, create_token, get_current_user_id
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
mongo_url = os.environ["MONGO_URL"]

client = AsyncIOMotorClient(
    mongo_url,
    tls=True,
    tlsCAFile=certifi.where()
)

db = client[os.environ["DB_NAME"]]

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Velora API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://velora-one-kappa.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

logger = logging.getLogger("velora")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


# ============================================================
# Helpers
# ============================================================
MOOD_SCORES = {
    "happy": 9, "good": 8, "relaxed": 7, "neutral": 5,
    "sad": 4, "depressed": 2, "angry": 3, "anxious": 3, "burned_out": 2,
}

LEVEL_NAMES = ["Beginner", "Explorer", "Growth Seeker", "Wellness Builder", "Mind Master", "Wellness Champion"]


def _public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "name": u.get("name"),
        "email": u.get("email"),
        "is_guest": u.get("is_guest", False),
        "is_admin": (u.get("email") or "").lower() in [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()],
        "avatar": u.get("avatar"),
        "onboarding": u.get("onboarding"),
        "onboarding_complete": u.get("onboarding_complete", False),
        "xp": u.get("xp", 0),
        "level": u.get("level", 1),
        "level_name": LEVEL_NAMES[min(u.get("level", 1) - 1, len(LEVEL_NAMES) - 1)],
        "wellness_coins": u.get("wellness_coins", 0),
        "streak_days": u.get("streak_days", 0),
        "badges": u.get("badges", []),
        "created_at": u.get("created_at"),
    }


def _level_from_xp(xp: int) -> int:
    # 0-99 -> 1, 100-299 -> 2, 300-599 -> 3, 600-999 -> 4, 1000-1499 -> 5, 1500+ -> 6
    thresholds = [0, 100, 300, 600, 1000, 1500]
    lvl = 1
    for i, t in enumerate(thresholds):
        if xp >= t:
            lvl = i + 1
    return min(lvl, 6)


async def _award_xp(user_id: str, amount: int, badge: Optional[str] = None):
    user = await db.users.find_one({"id": user_id})
    if not user:
        return
    new_xp = user.get("xp", 0) + amount
    new_level = _level_from_xp(new_xp)
    update = {"xp": new_xp, "level": new_level, "wellness_coins": user.get("wellness_coins", 0) + amount // 5}
    badges = list(user.get("badges", []))
    if badge and badge not in badges:
        badges.append(badge)
        update["badges"] = badges
    await db.users.update_one({"id": user_id}, {"$set": update})


async def _update_streak(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        return
    today = date.today().isoformat()
    last = user.get("last_active_date")
    streak = user.get("streak_days", 0)
    if last == today:
        return
    if last:
        try:
            last_d = date.fromisoformat(last)
            if (date.today() - last_d).days == 1:
                streak += 1
            else:
                streak = 1
        except Exception:
            streak = 1
    else:
        streak = 1
    await db.users.update_one({"id": user_id}, {"$set": {"streak_days": streak, "last_active_date": today}})


# ============================================================
# AUTH
# ============================================================
@api.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=req.name, email=req.email.lower(), password_hash=hash_password(req.password))
    await db.users.insert_one(user.model_dump())
    token = create_token(user.id)
    return AuthResponse(token=token, user=_public_user(user.model_dump()))


@api.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not user.get("password_hash") or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    return AuthResponse(token=token, user=_public_user(user))


@api.post("/auth/guest", response_model=AuthResponse)
async def guest(req: GuestRequest):
    user = User(name=req.name or "Guest", is_guest=True)
    await db.users.insert_one(user.model_dump())
    token = create_token(user.id)
    return AuthResponse(token=token, user=_public_user(user.model_dump()))


@api.get("/auth/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _public_user(user)


@api.post("/auth/onboarding")
async def submit_onboarding(payload: OnboardingSubmit, user_id: str = Depends(get_current_user_id)):
    update = {"onboarding": payload.data.model_dump(), "onboarding_complete": True}
    if payload.name:
        update["name"] = payload.name
    await db.users.update_one({"id": user_id}, {"$set": update})
    await _award_xp(user_id, 50, badge="onboarded")
    user = await db.users.find_one({"id": user_id})
    return _public_user(user)


# ============================================================
# MOOD
# ============================================================
@api.post("/mood", response_model=MoodEntry)
async def log_mood(req: MoodCreate, user_id: str = Depends(get_current_user_id)):
    score = MOOD_SCORES.get(req.mood, 5)
    entry = MoodEntry(user_id=user_id, mood=req.mood, score=score, note=req.note or "")
    await db.moods.insert_one(entry.model_dump())
    await _update_streak(user_id)
    await _award_xp(user_id, 10)
    return entry


@api.get("/mood")
async def list_moods(user_id: str = Depends(get_current_user_id), days: int = 30):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    cursor = db.moods.find({"user_id": user_id, "timestamp": {"$gte": cutoff}}, {"_id": 0}).sort("timestamp", -1)
    return await cursor.to_list(1000)


@api.get("/mood/analytics")
async def mood_analytics(user_id: str = Depends(get_current_user_id), days: int = 30):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    cursor = db.moods.find({"user_id": user_id, "timestamp": {"$gte": cutoff}}, {"_id": 0})
    moods = await cursor.to_list(1000)
    if not moods:
        return {"distribution": {}, "trend": [], "average_score": 0, "stability": 0, "total": 0}
    dist = {}
    for m in moods:
        dist[m["mood"]] = dist.get(m["mood"], 0) + 1
    # Daily trend
    by_day = {}
    for m in moods:
        day = m["timestamp"][:10]
        by_day.setdefault(day, []).append(m["score"])
    trend = [{"date": d, "avg": round(sum(s) / len(s), 2)} for d, s in sorted(by_day.items())]
    avg = round(sum(m["score"] for m in moods) / len(moods), 2)
    # stability: 100 - (range * 10)
    scores = [m["score"] for m in moods]
    stability = max(0, 100 - (max(scores) - min(scores)) * 10)
    return {"distribution": dist, "trend": trend, "average_score": avg, "stability": stability, "total": len(moods)}


# ============================================================
# JOURNAL
# ============================================================
from ai_service import analyze_sentiment, generate_wellness_insight, stream_chat_response


@api.post("/journal", response_model=JournalEntry)
async def create_journal(req: JournalCreate, user_id: str = Depends(get_current_user_id)):
    entry = JournalEntry(
        user_id=user_id,
        title=req.title,
        content=req.content,
        category=req.category or "reflection",
        journal_type=req.journal_type or "text",
    )
    # Run AI sentiment
    try:
        analysis = await analyze_sentiment(req.content)
        entry.sentiment = analysis["sentiment"]
        entry.sentiment_score = analysis["score"]
        entry.ai_insight = analysis["insight"]
    except Exception as e:
        logger.warning(f"sentiment failed: {e}")
    await db.journals.insert_one(entry.model_dump())
    await _update_streak(user_id)
    await _award_xp(user_id, 15, badge="first_journal")
    return entry


@api.get("/journal")
async def list_journals(user_id: str = Depends(get_current_user_id), q: Optional[str] = None):
    query = {"user_id": user_id}
    if q:
        query["content"] = {"$regex": q, "$options": "i"}
    cursor = db.journals.find(query, {"_id": 0}).sort("timestamp", -1)
    return await cursor.to_list(500)


@api.delete("/journal/{entry_id}")
async def delete_journal(entry_id: str, user_id: str = Depends(get_current_user_id)):
    res = await db.journals.delete_one({"id": entry_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ============================================================
# HABITS
# ============================================================
DEFAULT_HABITS = [
    {"title": "Drink Water", "icon": "droplet"},
    {"title": "Exercise", "icon": "dumbbell"},
    {"title": "Meditation", "icon": "brain"},
    {"title": "Reading", "icon": "book-open"},
    {"title": "Journaling", "icon": "pen-line"},
    {"title": "Sleep 8 Hours", "icon": "moon"},
    {"title": "Gratitude Practice", "icon": "heart"},
    {"title": "Morning Walk", "icon": "footprints"},
]


@api.post("/habits", response_model=Habit)
async def create_habit(req: HabitCreate, user_id: str = Depends(get_current_user_id)):
    habit = Habit(user_id=user_id, title=req.title, icon=req.icon or "sparkles", target_per_day=req.target_per_day)
    await db.habits.insert_one(habit.model_dump())
    return habit


@api.get("/habits")
async def list_habits(user_id: str = Depends(get_current_user_id)):
    habits = await db.habits.find({"user_id": user_id}, {"_id": 0}).to_list(200)
    # Seed defaults on first use
    if not habits:
        for h in DEFAULT_HABITS:
            hb = Habit(user_id=user_id, title=h["title"], icon=h["icon"])
            await db.habits.insert_one(hb.model_dump())
        habits = await db.habits.find({"user_id": user_id}, {"_id": 0}).to_list(200)
    return habits


@api.post("/habits/{habit_id}/toggle")
async def toggle_habit(habit_id: str, user_id: str = Depends(get_current_user_id)):
    habit = await db.habits.find_one({"id": habit_id, "user_id": user_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    today = date.today().isoformat()
    completions = list(habit.get("completions", []))
    if today in completions:
        completions.remove(today)
        # recompute streak roughly
        completions.sort()
        streak = 0
        d = date.today()
        while d.isoformat() in completions:
            streak += 1
            d = d - timedelta(days=1)
        await db.habits.update_one({"id": habit_id}, {"$set": {"completions": completions, "streak": streak, "last_completed_date": completions[-1] if completions else None}})
        return {"completed": False, "streak": streak}
    else:
        completions.append(today)
        completions.sort()
        # streak = consecutive days back from today
        streak = 0
        d = date.today()
        while d.isoformat() in completions:
            streak += 1
            d = d - timedelta(days=1)
        longest = max(habit.get("longest_streak", 0), streak)
        await db.habits.update_one({"id": habit_id}, {"$set": {"completions": completions, "streak": streak, "longest_streak": longest, "last_completed_date": today}})
        await _award_xp(user_id, 5)
        await _update_streak(user_id)
        return {"completed": True, "streak": streak}


@api.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, user_id: str = Depends(get_current_user_id)):
    res = await db.habits.delete_one({"id": habit_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ============================================================
# CHAT (Streaming SSE)
# ============================================================
@api.get("/chat/sessions")
async def chat_sessions(user_id: str = Depends(get_current_user_id)):
    sessions = await db.chat_sessions.find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1).to_list(50)
    return sessions


@api.get("/chat/messages")
async def chat_messages(session_id: str, user_id: str = Depends(get_current_user_id)):
    msgs = await db.chat_messages.find({"user_id": user_id, "session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(500)
    return msgs


@api.post("/chat/send")
async def chat_send(req: ChatMessageCreate, user_id: str = Depends(get_current_user_id)):
    session_id = req.session_id or new_id()
    # Save user message
    user_msg = ChatMessage(user_id=user_id, session_id=session_id, role="user", content=req.message)
    await db.chat_messages.insert_one(user_msg.model_dump())

    # Build history
    prior = await db.chat_messages.find(
        {"user_id": user_id, "session_id": session_id},
        {"_id": 0, "role": 1, "content": 1, "timestamp": 1}
    ).sort("timestamp", 1).to_list(50)
    prior_for_ai = [{"role": m["role"], "content": m["content"]} for m in prior[:-1]]

    async def event_gen():
        full_response = ""
        try:
            yield f"data: {json.dumps({'session_id': session_id})}\n\n"
            async for chunk in stream_chat_response(session_id, prior_for_ai, req.message):
                full_response += chunk
                yield f"data: {json.dumps({'delta': chunk})}\n\n"
            # Save assistant message
            ai_msg = ChatMessage(user_id=user_id, session_id=session_id, role="assistant", content=full_response)
            await db.chat_messages.insert_one(ai_msg.model_dump())
            # Upsert session
            await db.chat_sessions.update_one(
                {"id": session_id, "user_id": user_id},
                {"$set": {
                    "id": session_id, "user_id": user_id,
                    "title": req.message[:60],
                    "updated_at": now_iso(),
                }},
                upsert=True,
            )
            await _award_xp(user_id, 5)
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.exception("chat stream error")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"})


# ============================================================
# VOICE (Whisper STT + TTS)
# ============================================================
@api.post("/voice/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    try:
        data = await audio.read()

        bio = io.BytesIO(data)
        bio.name = audio.filename or "recording.webm"

        transcript = await openai_client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe",
            file=bio
        )

        return {
            "text": transcript.text
        }

    except Exception as e:
        logger.exception("transcribe failed")

        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {e}"
        )


@api.post("/voice/speak")
async def text_to_speech(
    payload: dict,
    user_id: str = Depends(get_current_user_id)
):
    text = (payload or {}).get("text", "").strip()
    voice = (payload or {}).get("voice", "alloy")

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text required"
        )

    try:
        speech = await openai_client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice=voice,
            input=text[:1500]
        )

        return Response(
            content=speech.content,
            media_type="audio/mpeg"
        )

    except Exception as e:
        logger.exception("tts failed")

        raise HTTPException(
            status_code=500,
            detail=f"TTS failed: {e}"
        )


# ============================================================
# ASSESSMENTS
# ============================================================
ASSESSMENT_QUESTIONS = {
    "anxiety": [
        "I felt nervous, anxious, or on edge",
        "I couldn't stop worrying about things",
        "I had trouble relaxing",
        "I felt restless or unable to sit still",
        "I felt afraid something awful might happen",
    ],
    "stress": [
        "I felt overwhelmed by responsibilities",
        "I had trouble managing my time",
        "I felt tense or on edge",
        "I had difficulty switching off from work/study",
        "I felt pressured by others' expectations",
    ],
    "burnout": [
        "I feel emotionally drained from my responsibilities",
        "I feel cynical or detached from things I used to care about",
        "I struggle to find motivation",
        "I feel like nothing I do matters",
        "I am exhausted even after rest",
    ],
    "depression": [
        "I felt little interest or pleasure in doing things",
        "I felt down, depressed, or hopeless",
        "I had trouble sleeping or slept too much",
        "I felt tired or had little energy",
        "I had poor appetite or overate",
    ],
    "social_anxiety": [
        "I felt anxious in social situations",
        "I worried about being judged by others",
        "I avoided gatherings",
        "I felt self-conscious when speaking up",
        "I felt panic when meeting new people",
    ],
    "self_esteem": [
        "I felt good about myself",
        "I felt I had qualities to be proud of",
        "I treated myself with kindness",
        "I felt confident in my decisions",
        "I felt worthy of love and respect",
    ],
    "productivity": [
        "I completed what I planned to do",
        "I focused well without distractions",
        "I felt motivated to start tasks",
        "I managed my energy throughout the day",
        "I felt satisfied with my output",
    ],
    "wellbeing": [
        "I felt happy overall",
        "I felt connected to people I care about",
        "I felt my life has meaning",
        "I took care of my body and mind",
        "I felt grateful for things in my life",
    ],
}


@api.get("/assessments/questions")
async def get_questions(category: str):
    if category not in ASSESSMENT_QUESTIONS:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"category": category, "questions": ASSESSMENT_QUESTIONS[category], "scale": ["Not at all", "Several days", "More than half", "Nearly every day", "Always"]}


@api.get("/assessments/categories")
async def list_categories():
    return [{"key": k, "title": k.replace("_", " ").title(), "questions": len(v)} for k, v in ASSESSMENT_QUESTIONS.items()]


def _interpret(category: str, score: int, max_score: int):
    pct = score / max_score if max_score else 0
    # For self_esteem / productivity / wellbeing — higher score = better
    positive_axis = category in ("self_esteem", "productivity", "wellbeing")
    wellness = pct if positive_axis else 1 - pct
    if wellness >= 0.75:
        level = "great"
        feedback = "You're in a strong place. Keep nurturing what's working."
        recs = ["Share your wins in your journal", "Try a 10-min meditation to cement it"]
    elif wellness >= 0.5:
        level = "okay"
        feedback = "You're doing okay but there's room to grow."
        recs = ["Daily 5-min breathing exercise", "Track your mood for 7 days"]
    elif wellness >= 0.25:
        level = "concerning"
        feedback = "Things feel hard right now. You're not alone — small steps help."
        recs = ["Try the 4-7-8 breathing exercise", "Reach out to one trusted person", "Journal one feeling tonight"]
    else:
        level = "needs_support"
        feedback = "This is a tough patch. Please consider talking to a professional."
        recs = ["Visit /resources for hotlines", "Box breathing 3x today", "Be gentle with yourself"]
    return level, feedback, recs


@api.post("/assessments/submit")
async def submit_assessment(req: AssessmentSubmit, user_id: str = Depends(get_current_user_id)):
    if req.category not in ASSESSMENT_QUESTIONS:
        raise HTTPException(status_code=400, detail="Unknown category")
    qs = ASSESSMENT_QUESTIONS[req.category]
    if len(req.answers) != len(qs):
        raise HTTPException(status_code=400, detail="Answer count mismatch")
    score = sum(req.answers)
    max_score = len(qs) * 4
    level, feedback, recs = _interpret(req.category, score, max_score)
    result = AssessmentResult(
        user_id=user_id, category=req.category, score=score, max_score=max_score,
        level=level, feedback=feedback, recommendations=recs,
    )
    await db.assessments.insert_one(result.model_dump())
    await _award_xp(user_id, 20)
    return result


@api.get("/assessments/history")
async def assessment_history(user_id: str = Depends(get_current_user_id)):
    return await db.assessments.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(100)


# ============================================================
# SESSIONS (Breathing / Meditation)
# ============================================================
@api.post("/sessions")
async def log_session(payload: dict, user_id: str = Depends(get_current_user_id)):
    s = SessionLog(
        user_id=user_id,
        kind=payload.get("kind", "breathing"),
        type=payload.get("type", "box"),
        duration_seconds=int(payload.get("duration_seconds", 0)),
    )
    await db.sessions.insert_one(s.model_dump())
    await _update_streak(user_id)
    xp = max(5, s.duration_seconds // 60 * 5)
    await _award_xp(user_id, xp, badge=("first_meditation" if s.kind == "meditation" else "first_breath"))
    return s


@api.get("/sessions")
async def list_sessions(user_id: str = Depends(get_current_user_id)):
    return await db.sessions.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(200)


# ============================================================
# SLEEP
# ============================================================
@api.post("/sleep", response_model=SleepEntry)
async def log_sleep(req: SleepCreate, user_id: str = Depends(get_current_user_id)):
    entry = SleepEntry(user_id=user_id, hours=req.hours, quality=req.quality, note=req.note or "")
    await db.sleep.insert_one(entry.model_dump())
    await _award_xp(user_id, 10)
    return entry


@api.get("/sleep")
async def list_sleep(user_id: str = Depends(get_current_user_id), days: int = 30):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    return await db.sleep.find({"user_id": user_id, "timestamp": {"$gte": cutoff}}, {"_id": 0}).sort("timestamp", -1).to_list(200)


# ============================================================
# DASHBOARD
# ============================================================
@api.get("/dashboard")
async def dashboard(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = date.today().isoformat()
    week_cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    moods_week = await db.moods.find({"user_id": user_id, "timestamp": {"$gte": week_cutoff}}, {"_id": 0}).to_list(200)
    avg_mood = round(sum(m["score"] for m in moods_week) / len(moods_week), 1) if moods_week else 0

    journals = await db.journals.count_documents({"user_id": user_id, "timestamp": {"$gte": week_cutoff}})
    sessions = await db.sessions.count_documents({"user_id": user_id, "timestamp": {"$gte": week_cutoff}})
    habits = await db.habits.find({"user_id": user_id}, {"_id": 0}).to_list(200)
    todays_done = sum(1 for h in habits if today in h.get("completions", []))
    habit_completion = round(todays_done / len(habits) * 100, 0) if habits else 0

    sleep_week = await db.sleep.find({"user_id": user_id, "timestamp": {"$gte": week_cutoff}}, {"_id": 0}).to_list(50)
    avg_sleep = round(sum(s["hours"] for s in sleep_week) / len(sleep_week), 1) if sleep_week else 0
    avg_sleep_quality = round(sum(s["quality"] for s in sleep_week) / len(sleep_week), 1) if sleep_week else 0

    # Wellness score (0-100): blend mood, habits, sleep
    wellness = round(
        (avg_mood / 9 * 40) +
        (habit_completion * 0.3) +
        ((avg_sleep_quality / 5) * 30 if sleep_week else 15)
    )

    # stress: derived inversely from mood + assessment
    last_stress = await db.assessments.find_one({"user_id": user_id, "category": "stress"}, sort=[("timestamp", -1)])
    stress_level = round((last_stress["score"] / last_stress["max_score"]) * 100) if last_stress else max(0, 100 - avg_mood * 10)

    return {
        "user": _public_user(user),
        "wellness_score": wellness,
        "avg_mood": avg_mood,
        "mood_count_week": len(moods_week),
        "journal_count_week": journals,
        "session_count_week": sessions,
        "habit_completion_today": habit_completion,
        "habits_done_today": todays_done,
        "habits_total": len(habits),
        "avg_sleep_hours": avg_sleep,
        "avg_sleep_quality": avg_sleep_quality,
        "stress_level": stress_level,
        "streak_days": user.get("streak_days", 0),
        "xp": user.get("xp", 0),
        "level": user.get("level", 1),
        "level_name": LEVEL_NAMES[min(user.get("level", 1) - 1, len(LEVEL_NAMES) - 1)],
    }


@api.get("/insights")
async def insights(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id})
    week_cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    moods = await db.moods.find({"user_id": user_id, "timestamp": {"$gte": week_cutoff}}, {"_id": 0}).to_list(100)
    journals = await db.journals.find({"user_id": user_id, "timestamp": {"$gte": week_cutoff}}, {"_id": 0}).to_list(50)
    sleep = await db.sleep.find({"user_id": user_id, "timestamp": {"$gte": week_cutoff}}, {"_id": 0}).to_list(20)

    summary = {
        "name": user.get("name") if user else "friend",
        "streak_days": user.get("streak_days", 0) if user else 0,
        "recent_moods": [m["mood"] for m in moods[:10]],
        "avg_mood_score": round(sum(m["score"] for m in moods) / len(moods), 1) if moods else None,
        "journals_count": len(journals),
        "recent_sentiments": [j.get("sentiment") for j in journals if j.get("sentiment")][:5],
        "avg_sleep_hours": round(sum(s["hours"] for s in sleep) / len(sleep), 1) if sleep else None,
    }
    try:
        text = await generate_wellness_insight(summary)
    except Exception as e:
        logger.warning(f"insight failed: {e}")
        text = "Keep going — small daily moments compound into big wellness wins. Try a 2-min breathing exercise to reset."
    return {"insight": text, "summary": summary}


# ============================================================
# EMERGENCY
# ============================================================
@api.get("/emergency/resources")
async def emergency_resources():
    return {
        "hotlines": [
            {"name": "988 Suicide & Crisis Lifeline (US)", "number": "988", "url": "https://988lifeline.org/"},
            {"name": "Crisis Text Line (US/CA/UK/IE)", "number": "Text HOME to 741741", "url": "https://www.crisistextline.org/"},
            {"name": "iCall (India)", "number": "+91 9152987821", "url": "https://icallhelpline.org/"},
            {"name": "Samaritans (UK & ROI)", "number": "116 123", "url": "https://www.samaritans.org/"},
            {"name": "Lifeline (Australia)", "number": "13 11 14", "url": "https://www.lifeline.org.au/"},
        ],
        "tips": [
            "Take 3 slow, deep breaths — in for 4, hold 4, out for 6.",
            "Reach out to one trusted person right now.",
            "Move your body for 60 seconds — stretch, walk, anything.",
            "Write down what you're feeling without judgement.",
        ],
    }


# ============================================================
# COMMUNITY
# ============================================================
from community_service import ROOMS, generate_handle, ai_moderate
from resources_data import RESOURCES, CATEGORIES as RESOURCE_CATEGORIES
from spotify_service import search_playlists, list_moods as spotify_list_moods

ADMIN_EMAILS = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]


async def _require_admin(user_id: str = Depends(get_current_user_id)) -> dict:
    user = await db.users.find_one({"id": user_id})
    if not user or (user.get("email") or "").lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def _public_post(p: dict, current_user_id: Optional[str] = None) -> dict:
    reactions = p.get("reactions", {})
    return {
        "id": p["id"],
        "room_slug": p["room_slug"],
        "handle": p["handle"],
        "content": p["content"],
        "status": p.get("status", "active"),
        "ai_flagged": p.get("ai_flagged", False),
        "reactions": {k: len(v) for k, v in reactions.items()},
        "user_reactions": [k for k, v in reactions.items() if current_user_id and current_user_id in v],
        "report_count": p.get("report_count", 0),
        "is_own": current_user_id == p.get("user_id") if current_user_id else False,
        "timestamp": p["timestamp"],
    }


@api.get("/community/rooms")
async def list_rooms():
    out = []
    for r in ROOMS:
        cnt = await db.posts.count_documents({"room_slug": r["slug"], "status": "active"})
        out.append({**r, "post_count": cnt})
    return out


@api.get("/community/posts")
async def list_posts(room_slug: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    query = {"status": "active"}
    if room_slug:
        query["room_slug"] = room_slug
    cursor = db.posts.find(query, {"_id": 0}).sort("timestamp", -1).limit(100)
    posts = await cursor.to_list(100)
    return [_public_post(p, user_id) for p in posts]


@api.post("/community/posts")
async def create_post(req: PostCreate, user_id: str = Depends(get_current_user_id)):
    if not any(r["slug"] == req.room_slug for r in ROOMS):
        raise HTTPException(status_code=400, detail="Unknown room")
    content = (req.content or "").strip()
    if len(content) < 3:
        raise HTTPException(status_code=400, detail="Post too short")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Post too long (2000 char max)")

    # AI moderation
    mod = await ai_moderate(content)
    status_val = "hidden" if mod.get("flagged") and mod.get("severity") == "high" else "active"

    # Stable handle per user per room for thread continuity
    existing = await db.community_handles.find_one({"user_id": user_id, "room_slug": req.room_slug})
    if existing:
        handle = existing["handle"]
    else:
        handle = generate_handle()
        await db.community_handles.insert_one({"user_id": user_id, "room_slug": req.room_slug, "handle": handle})

    post = CommunityPost(
        user_id=user_id, room_slug=req.room_slug, handle=handle, content=content,
        status=status_val, ai_flagged=bool(mod.get("flagged")),
        ai_reason=mod.get("reason"), ai_severity=mod.get("severity"),
    )
    await db.posts.insert_one(post.model_dump())
    await _award_xp(user_id, 8)
    if status_val == "hidden":
        return {"hidden": True, "reason": "Your post was held for review by our moderation system."}
    return _public_post(post.model_dump(), user_id)


@api.post("/community/posts/{post_id}/react")
async def react_to_post(post_id: str, req: ReactionToggle, user_id: str = Depends(get_current_user_id)):
    if req.reaction not in ("heart", "hug", "growth"):
        raise HTTPException(status_code=400, detail="Invalid reaction")
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    reactions = post.get("reactions", {"heart": [], "hug": [], "growth": []})
    arr = reactions.get(req.reaction, [])
    if user_id in arr:
        arr.remove(user_id)
    else:
        arr.append(user_id)
    reactions[req.reaction] = arr
    await db.posts.update_one({"id": post_id}, {"$set": {"reactions": reactions}})
    return _public_post({**post, "reactions": reactions}, user_id)


@api.post("/community/posts/{post_id}/report")
async def report_post(post_id: str, req: ReportCreate, user_id: str = Depends(get_current_user_id)):
    existing = await db.post_reports.find_one({"post_id": post_id, "user_id": user_id})
    if existing:
        return {"ok": True, "already_reported": True}
    await db.post_reports.insert_one({"post_id": post_id, "user_id": user_id, "reason": req.reason or "", "timestamp": now_iso()})
    new_count = await db.post_reports.count_documents({"post_id": post_id})
    update = {"report_count": new_count}
    if new_count >= 3:
        update["status"] = "hidden"
    await db.posts.update_one({"id": post_id}, {"$set": update})
    return {"ok": True, "report_count": new_count}


@api.delete("/community/posts/{post_id}")
async def delete_post(post_id: str, user_id: str = Depends(get_current_user_id)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    user = await db.users.find_one({"id": user_id})
    is_admin = (user.get("email") or "").lower() in ADMIN_EMAILS if user else False
    if post["user_id"] != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.posts.update_one({"id": post_id}, {"$set": {"status": "removed"}})
    return {"ok": True}


# ---------- Admin moderation ----------
@api.get("/admin/moderation")
async def admin_moderation_queue(admin=Depends(_require_admin)):
    posts = await db.posts.find({
        "$or": [
            {"ai_flagged": True},
            {"report_count": {"$gte": 1}},
            {"status": "hidden"},
        ]
    }, {"_id": 0}).sort("timestamp", -1).to_list(200)
    return [{**_public_post(p, admin["id"]), "ai_reason": p.get("ai_reason"), "ai_severity": p.get("ai_severity"), "status": p.get("status")} for p in posts]


@api.post("/admin/moderation/{post_id}/action")
async def admin_action(post_id: str, payload: dict, admin=Depends(_require_admin)):
    action = (payload or {}).get("action")  # approve / remove
    if action == "approve":
        await db.posts.update_one({"id": post_id}, {"$set": {"status": "active", "ai_flagged": False}})
    elif action == "remove":
        await db.posts.update_one({"id": post_id}, {"$set": {"status": "removed"}})
    else:
        raise HTTPException(status_code=400, detail="Unknown action")
    return {"ok": True}


@api.get("/admin/stats")
async def admin_stats(admin=Depends(_require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "guests": await db.users.count_documents({"is_guest": True}),
        "posts_active": await db.posts.count_documents({"status": "active"}),
        "posts_hidden": await db.posts.count_documents({"status": "hidden"}),
        "posts_removed": await db.posts.count_documents({"status": "removed"}),
        "moods_total": await db.moods.count_documents({}),
        "journals_total": await db.journals.count_documents({}),
        "chat_messages_total": await db.chat_messages.count_documents({}),
    }


# ============================================================
# RESOURCES (curated library)
# ============================================================
@api.get("/resources")
async def resources(category: Optional[str] = None, type: Optional[str] = None, q: Optional[str] = None):
    items = list(RESOURCES)
    if category:
        items = [r for r in items if r["category"] == category]
    if type:
        items = [r for r in items if r["type"] == type]
    if q:
        ql = q.lower()
        items = [r for r in items if ql in r["title"].lower() or ql in r["description"].lower() or ql in r["source"].lower()]
    return {"items": items, "total": len(items)}


@api.get("/resources/categories")
async def resource_categories():
    return RESOURCE_CATEGORIES


# ============================================================
# SPOTIFY (mood-based playlists)
# ============================================================
@api.get("/spotify/moods")
async def spotify_moods():
    return spotify_list_moods()


@api.get("/spotify/playlists")
async def spotify_playlists(mood: str = "relaxed", limit: int = 12):
    items = await search_playlists(mood, limit=min(max(1, limit), 20))
    return {"mood": mood, "items": items}


# ============================================================
# Health
# ============================================================
@api.get("/")
async def root():
    return {"message": "Velora API", "version": "1.0"}


@api.get("/health")
async def health():
    return {"status": "ok", "timestamp": now_iso()}


# ============================================================
# Mount
# ============================================================
app.include_router(api)

@app.on_event("shutdown")
async def shutdown():
    client.close()
