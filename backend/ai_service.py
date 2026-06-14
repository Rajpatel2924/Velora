import os
import json
import re
from anthropic import AsyncAnthropic

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

client = AsyncAnthropic(
    api_key=ANTHROPIC_API_KEY
)

CLAUDE_MODEL = "claude-sonnet-4-5"

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



async def stream_chat_response(session_id: str, prior_messages: list, user_text: str):

    messages = []

    for msg in prior_messages[-10:]:
        messages.append(
            {
                "role": msg["role"],
                "content": msg["content"]
            }
        )

    messages.append(
        {
            "role": "user",
            "content": user_text
        }
    )

    async with client.messages.stream(
        model=CLAUDE_MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:

        async for text in stream.text_stream:
            yield text

async def analyze_sentiment(text: str) -> dict:
    """Return {sentiment, score (-1..1), insight}."""

    prompt = f"""Analyze the emotional sentiment of this journal entry.

Respond ONLY with valid JSON:

{{
    "sentiment": "positive|neutral|negative",
    "score": 0.0,
    "insight": "short supportive insight"
}}

Journal entry:
\"\"\"{text[:2000]}\"\"\"
"""

    try:
        response = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=300,
            system="You are a sentiment analysis assistant. Respond with valid JSON only.",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        result = response.content[0].text.strip()

        # Extract JSON if Claude adds extra text
        match = re.search(r"\{.*\}", result, re.DOTALL)

        if not match:
            raise ValueError("No JSON found in response")

        data = json.loads(match.group(0))

        return {
            "sentiment": data.get("sentiment", "neutral"),
            "score": float(data.get("score", 0.0)),
            "insight": data.get("insight", "")
        }

    except Exception as e:
        print(f"Sentiment analysis error: {e}")

        return {
            "sentiment": "neutral",
            "score": 0.0,
            "insight": ""
        }


async def generate_wellness_insight(summary: dict) -> str:
    """Given a summary dict with recent mood, habits, sleep, streak — return a short insight."""

    prompt = f"""Based on this user's recent wellness data, write a warm 2-3 sentence insight with one actionable suggestion.

Be specific, empathetic, and Gen Z-friendly.
Avoid clinical tone.

Data:
{json.dumps(summary, indent=2)}
"""

    try:
        response = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=300,
            system="You are Velora, a wellness coach. Be warm, supportive, concise, and Gen Z-friendly.",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response.content[0].text.strip()

    except Exception as e:
        print(f"Wellness insight error: {e}")
        return "You've been showing up for yourself consistently. Consider taking a few minutes today to reflect on one small win and how it made you feel."
