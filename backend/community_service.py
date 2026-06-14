"""Community platform service — anonymous posts, reactions, moderation."""
import os
import json
import re
import logging
from datetime import datetime, timezone
from typing import Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

logger = logging.getLogger("velora.community")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

ROOMS = [
    {"slug": "anxiety",       "title": "Anxiety Support",   "description": "Share what's weighing on you — judgement-free.",          "emoji": "💜"},
    {"slug": "college",       "title": "College Life",      "description": "Exams, dorm life, friendships, finding yourself.",        "emoji": "🎓"},
    {"slug": "career",        "title": "Career Stress",     "description": "Imposter syndrome, burnout, first jobs.",                 "emoji": "💼"},
    {"slug": "relationships", "title": "Relationships",     "description": "Family, friends, romance, situationships.",               "emoji": "💞"},
    {"slug": "self-growth",   "title": "Self Growth",       "description": "Wins, lessons, identity work, becoming.",                 "emoji": "🌱"},
    {"slug": "productivity",  "title": "Productivity",      "description": "Habits, focus, beating the scroll.",                      "emoji": "⚡"},
    {"slug": "motivation",    "title": "Motivation",        "description": "Borrow some, leave some. Mini pep talks.",                "emoji": "🔥"},
]


# Funky animal-color anonymous handles
ADJECTIVES = ["Quiet", "Brave", "Soft", "Gentle", "Bold", "Wild", "Calm", "Bright", "Cosmic", "Velvet", "Sleepy", "Lucky", "Misty", "Sunny", "Lunar"]
ANIMALS    = ["Otter", "Fox", "Owl", "Whale", "Lynx", "Wren", "Heron", "Moth", "Doe", "Fawn", "Crow", "Hare", "Eagle", "Seal", "Bear"]


def generate_handle() -> str:
    import random
    return f"{random.choice(ADJECTIVES)}{random.choice(ANIMALS)}{random.randint(10, 99)}"


async def ai_moderate(text: str) -> dict:
    """Returns {'flagged': bool, 'reason': str|None, 'severity': 'low'|'high'|None}.

    Uses Claude to spot harmful content (abuse, self-harm encouragement, hate, explicit content,
    spam). Self-harm CONFESSIONS by the poster should NOT be flagged — only ENCOURAGEMENT to others.
    """
    if not text or not text.strip():
        return {"flagged": False, "reason": None, "severity": None}

    prompt = f"""You are a content moderator for a Gen Z mental wellness community. The community welcomes raw emotional posts including users sharing they feel sad, anxious, hopeless, or are struggling — these are NOT to be flagged.

ONLY flag the post if it contains any of:
- Hateful slurs or targeted harassment toward groups or specific users
- Explicit sexual content
- Encouragement or instructions for self-harm or suicide directed at OTHERS
- Spam or promotional content
- Sharing of identifying personal information of OTHERS (doxxing)
- Threats of violence

If the user themselves expresses suicidal ideation, do NOT flag — they need support, not removal.

Respond with strict JSON: {{"flagged": boolean, "reason": "short reason or null", "severity": "low" or "high" or null}}.

Post to moderate:
\"\"\"{text[:1500]}\"\"\"

JSON only:"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id="mod-" + str(hash(text))[:8],
            system_message="You are a careful content moderation assistant. Reply with JSON only.",
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.DOTALL)
        if not m:
            return {"flagged": False, "reason": None, "severity": None}
        data = json.loads(m.group(0))
        return {
            "flagged": bool(data.get("flagged", False)),
            "reason": data.get("reason"),
            "severity": data.get("severity"),
        }
    except Exception as e:
        logger.warning(f"ai_moderate failed: {e}")
        return {"flagged": False, "reason": None, "severity": None}
