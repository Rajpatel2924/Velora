"""Pydantic models for Velora."""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
import uuid


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# -------------------- Auth --------------------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GuestRequest(BaseModel):
    name: Optional[str] = "Guest"


class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]


# -------------------- User --------------------
class OnboardingData(BaseModel):
    age_group: Optional[str] = None
    role: Optional[str] = None  # student / professional / other
    goals: List[str] = Field(default_factory=list)
    stress_level: Optional[int] = None  # 1-10
    sleep_quality: Optional[int] = None  # 1-10
    activities: List[str] = Field(default_factory=list)
    daily_goal_minutes: Optional[int] = 15


class User(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    email: Optional[str] = None
    is_guest: bool = False
    password_hash: Optional[str] = None
    avatar: Optional[str] = None
    onboarding: Optional[OnboardingData] = None
    onboarding_complete: bool = False
    xp: int = 0
    level: int = 1
    wellness_coins: int = 0
    streak_days: int = 0
    last_active_date: Optional[str] = None
    badges: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=now_iso)


# -------------------- Mood --------------------
class MoodCreate(BaseModel):
    mood: str  # happy, good, relaxed, neutral, sad, depressed, angry, anxious, burned_out
    note: Optional[str] = ""


class MoodEntry(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    mood: str
    score: int  # 1-9
    note: str = ""
    timestamp: str = Field(default_factory=now_iso)


# -------------------- Journal --------------------
class JournalCreate(BaseModel):
    content: str
    title: Optional[str] = None
    category: Optional[str] = "reflection"
    journal_type: str = "text"  # text / voice


class JournalEntry(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    title: Optional[str] = None
    content: str
    category: str = "reflection"
    journal_type: str = "text"
    sentiment: Optional[str] = None  # positive / neutral / negative
    sentiment_score: Optional[float] = None  # -1 to 1
    ai_insight: Optional[str] = None
    timestamp: str = Field(default_factory=now_iso)


# -------------------- Habit --------------------
class HabitCreate(BaseModel):
    title: str
    icon: Optional[str] = "sparkles"
    target_per_day: int = 1


class Habit(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    title: str
    icon: str = "sparkles"
    target_per_day: int = 1
    streak: int = 0
    longest_streak: int = 0
    last_completed_date: Optional[str] = None
    completions: List[str] = Field(default_factory=list)  # list of ISO dates
    created_at: str = Field(default_factory=now_iso)


# -------------------- Chat --------------------
class ChatMessageCreate(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatMessage(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    session_id: str
    role: str  # user / assistant
    content: str
    timestamp: str = Field(default_factory=now_iso)


# -------------------- Assessment --------------------
class AssessmentSubmit(BaseModel):
    category: str  # anxiety, stress, burnout, depression, social_anxiety, self_esteem, productivity, wellbeing
    answers: List[int]  # 0..4 each


class AssessmentResult(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    category: str
    score: int
    max_score: int
    level: str  # low / mild / moderate / high
    feedback: str
    recommendations: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=now_iso)


# -------------------- Breathing / Meditation --------------------
class SessionLog(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    kind: str  # breathing / meditation
    type: str  # box / 4-7-8 / calm / focus / sleep / anxiety
    duration_seconds: int
    timestamp: str = Field(default_factory=now_iso)


# -------------------- Sleep --------------------
class SleepCreate(BaseModel):
    hours: float
    quality: int  # 1-5
    note: Optional[str] = ""


class SleepEntry(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    hours: float
    quality: int
    note: str = ""
    timestamp: str = Field(default_factory=now_iso)


# -------------------- Onboarding submit --------------------
class OnboardingSubmit(BaseModel):
    name: Optional[str] = None
    data: OnboardingData


# -------------------- Community --------------------
class PostCreate(BaseModel):
    room_slug: str
    content: str


class ReactionToggle(BaseModel):
    reaction: str  # heart, hug, growth


class ReportCreate(BaseModel):
    reason: Optional[str] = ""


class CommunityPost(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    room_slug: str
    handle: str
    content: str
    status: str = "active"  # active, hidden, removed
    ai_flagged: bool = False
    ai_reason: Optional[str] = None
    ai_severity: Optional[str] = None
    reactions: Dict[str, List[str]] = Field(default_factory=lambda: {"heart": [], "hug": [], "growth": []})
    report_count: int = 0
    timestamp: str = Field(default_factory=now_iso)
