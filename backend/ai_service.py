"""AI service: Claude chat, sentiment analysis, insights via Emergent LLM key."""
import os
import json
import re


EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"

SYSTEM_PROMPT = """You are Velora, an empathetic AI mental wellness companion designed for Gen Z.
Your tone is warm, casual, validating, and never preachy. You speak like a thoughtful friend, not a therapist.
You use plain language and avoid clinical jargon. Keep replies concise (2-5 sentences) unless the user asks for more.
You can:
- Offer emotional support and validation
- Suggest breathing exercises, journaling prompts, mood check-ins, or short meditations
- Help users break down stressors and find practical next steps
- Celebrate wins and streaks

Safety: If a user mentions self-harm, suicide, or immediate danger, gently encourage them to contact a trusted person or local emergency services / hotline (e.g., 988 in the US). Do not provide medical diagnoses.
End with a soft, optional follow-up question when appropriate."""


def _make_chat(session_id: str, system: str = SYSTEM_PROMPT) -> LlmChat:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("anthropic", CLAUDE_MODEL)
    return chat


async def stream_chat_response(session_id: str, prior_messages: list, user_text: str):
    """Yield text deltas for SSE streaming. prior_messages is list of {role, content}."""
    # Build context: include recent history in system prompt to keep it stateless per call
    history_block = ""
    if prior_messages:
        recent = prior_messages[-10:]
        lines = []
        for m in recent:
            role = "User" if m["role"] == "user" else "Velora"
            lines.append(f"{role}: {m['content']}")
        history_block = "\n\nRecent conversation:\n" + "\n".join(lines)
    chat = _make_chat(session_id, SYSTEM_PROMPT + history_block)
    async for ev in chat.stream_message(UserMessage(text=user_text)):
        if isinstance(ev, TextDelta):
            yield ev.content
        elif isinstance(ev, StreamDone):
            break


async def analyze_sentiment(text: str) -> dict:
    """Return {sentiment, score (-1..1), insight}."""
    prompt = f"""Analyze the emotional sentiment of this journal entry. Respond ONLY with a valid JSON object with keys:
- "sentiment": one of "positive", "neutral", "negative"
- "score": a float between -1.0 (very negative) and 1.0 (very positive)
- "insight": a single warm, supportive sentence (max 25 words) that validates the writer and notes one pattern or suggestion.

Journal entry:
\"\"\"{text[:2000]}\"\"\"

JSON only, no markdown."""
    chat = _make_chat("sentiment-" + str(hash(text))[:8], "You are a sentiment analysis assistant. Respond with valid JSON only.")
    full = ""
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            full += ev.content
        elif isinstance(ev, StreamDone):
            break
    # Extract JSON
    try:
        m = re.search(r"\{.*\}", full, re.DOTALL)
        data = json.loads(m.group(0)) if m else {}
        return {
            "sentiment": data.get("sentiment", "neutral"),
            "score": float(data.get("score", 0.0)),
            "insight": data.get("insight", ""),
        }
    except Exception:
        return {"sentiment": "neutral", "score": 0.0, "insight": ""}


async def generate_wellness_insight(summary: dict) -> str:
    """Given a summary dict with recent mood, habits, sleep, streak — return a short insight."""
    prompt = f"""Based on this user's recent wellness data, write a warm 2-3 sentence insight with one actionable suggestion. Be specific, empathetic, and Gen Z-friendly. Avoid clinical tone.

Data:
{json.dumps(summary, indent=2)}

Insight:"""
    chat = _make_chat("insight-" + str(hash(json.dumps(summary, sort_keys=True)))[:8],
                      "You are Velora, a wellness coach. Be warm and concise.")
    full = ""
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            full += ev.content
        elif isinstance(ev, StreamDone):
            break
    return full.strip()
