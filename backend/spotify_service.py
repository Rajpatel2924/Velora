"""Spotify mood-based playlists - curated iframe-embed approach.

Spotify restricted Client Credentials access to playlist search/fetch for newer apps
in late 2024 (403 'Active premium subscription required for the owner of the app').
Workaround: hand-curated public Spotify playlist IDs that work in the iframe player
without any API authentication.
"""
import os
import logging

logger = logging.getLogger("velora.spotify")

# Curated playlists — public, popular, embeddable.
# Each entry: id, name, description, mood (matches Velora mood keys), tags.
CURATED = [
    # HAPPY
    {"id": "37i9dQZF1DXdPec7aLTmlC", "name": "Happy Hits!",         "description": "Hits to boost your mood.",                       "mood": "happy",   "image_emoji": "😄"},
    {"id": "37i9dQZF1DX9XIFQuFvzM4", "name": "Feelin' Good",        "description": "Feel-good music — old & new.",                   "mood": "happy",   "image_emoji": "🌞"},
    {"id": "37i9dQZF1DWSf2RDTDayIx", "name": "Mood Booster",        "description": "Get happy with today's dose of feel-good songs.","mood": "happy",   "image_emoji": "💫"},

    # GOOD VIBES
    {"id": "37i9dQZF1DX0XUsuxWHRQd", "name": "RapCaviar",            "description": "Music from the streets.",                       "mood": "good",    "image_emoji": "🎶"},
    {"id": "37i9dQZF1DX1lVhptIYRda", "name": "Hot Country",          "description": "Today's biggest country hits.",                 "mood": "good",    "image_emoji": "🤠"},
    {"id": "37i9dQZF1DXcRXFNfZr7Tp", "name": "Just Good Music",      "description": "Songs to lift the day.",                        "mood": "good",    "image_emoji": "✨"},

    # CHILL / RELAXED
    {"id": "37i9dQZF1DX4WYpdgoIcn6", "name": "Chill Hits",           "description": "Kick back to the best new and recent chill hits.","mood": "relaxed", "image_emoji": "🌊"},
    {"id": "37i9dQZF1DWTvNyxOwkztu", "name": "lofi beats",            "description": "Lo-fi to study, work, or sleep to.",            "mood": "relaxed", "image_emoji": "🎧"},
    {"id": "37i9dQZF1DX3Ogo9pFvBkY", "name": "Ambient Chill",         "description": "Drift away on a cloud of ambient.",             "mood": "relaxed", "image_emoji": "☁️"},

    # NEUTRAL / AMBIENT
    {"id": "37i9dQZF1DWZqd5JICZI0u", "name": "Peaceful Piano",       "description": "Relax and indulge with peaceful piano.",        "mood": "neutral", "image_emoji": "🎹"},
    {"id": "37i9dQZF1DX4sWSpwq3LiO", "name": "Peaceful Meditation",  "description": "Quiet, gentle music to settle.",                "mood": "neutral", "image_emoji": "🧘"},
    {"id": "37i9dQZF1DX9uKNf5jGX6m", "name": "Stress Relief",        "description": "Music for tough moments.",                      "mood": "neutral", "image_emoji": "💆"},

    # SAD / TENDER
    {"id": "37i9dQZF1DX7qK8ma5wgG1", "name": "Sad Songs",            "description": "Cry it out with these gentle ballads.",         "mood": "sad",     "image_emoji": "🌧"},
    {"id": "37i9dQZF1DWVrtsSlLKzro", "name": "Sad Indie",            "description": "Indie to feel through.",                        "mood": "sad",     "image_emoji": "🌫"},
    {"id": "37i9dQZF1DWZUAeYvs88zc", "name": "Down in the Dumps",    "description": "When you just need to feel it.",                "mood": "sad",     "image_emoji": "💧"},

    # DEPRESSED / HEALING
    {"id": "37i9dQZF1DX3YSRoSdA634", "name": "Life Sucks",           "description": "Soundtrack for the hard days.",                 "mood": "depressed","image_emoji": "🩹"},
    {"id": "37i9dQZF1DWXe9gFZP0gtP", "name": "Hopecore",             "description": "Songs of hope and resilience.",                  "mood": "depressed","image_emoji": "🕯"},

    # ANGRY / RELEASE
    {"id": "37i9dQZF1DWXIcbzpLauPS", "name": "Adrenaline Workout",   "description": "Channel it out.",                               "mood": "angry",   "image_emoji": "🔥"},
    {"id": "37i9dQZF1DX76Wlfdnj7AP", "name": "Beast Mode",           "description": "Hard-hitting energy to release.",               "mood": "angry",   "image_emoji": "⚔️"},

    # ANXIOUS
    {"id": "37i9dQZF1DWZd79rJ6a7lp", "name": "Sleep",                "description": "Gentle ambient for restless minds.",            "mood": "anxious", "image_emoji": "🌙"},
    {"id": "37i9dQZF1DX1tuUiirhaT3", "name": "Acoustic Calm",         "description": "Soft acoustic to soothe.",                      "mood": "anxious", "image_emoji": "🎻"},
    {"id": "37i9dQZF1DWVV27DiNWxkR", "name": "Anti-Anxiety",          "description": "Music to ease the mind.",                       "mood": "anxious", "image_emoji": "🌬"},

    # BURNED OUT / REST
    {"id": "37i9dQZF1DWZeKCadgRdKQ", "name": "Deep Sleep",            "description": "Drift off into restful sleep.",                 "mood": "burned_out", "image_emoji": "💤"},
    {"id": "37i9dQZF1DX0SM0LYsmbMT", "name": "Sleep Tight",           "description": "Quiet your mind.",                              "mood": "burned_out", "image_emoji": "🛌"},

    # FOCUS
    {"id": "37i9dQZF1DWZeKCadgRdKQ", "name": "Deep Focus",            "description": "Keep calm and focus.",                          "mood": "focus",   "image_emoji": "🎯"},
    {"id": "37i9dQZF1DX8NTLI2TtZa6", "name": "Brain Food",            "description": "Sounds to fuel deep work.",                     "mood": "focus",   "image_emoji": "🧠"},
    {"id": "37i9dQZF1DX9sIqqvKsjG8", "name": "Coding Mode",           "description": "Concentration beats for coders.",               "mood": "focus",   "image_emoji": "💻"},

    # SLEEP
    {"id": "37i9dQZF1DWStLD3OejVoz", "name": "Sleepy Piano",           "description": "Drift off with gentle piano.",                  "mood": "sleep",   "image_emoji": "🎹"},
    {"id": "37i9dQZF1DXcoF7DAJM5cP", "name": "Calming Sleep Sounds",   "description": "Ambient nature soundscapes.",                   "mood": "sleep",   "image_emoji": "🌌"},

    # ENERGY
    {"id": "37i9dQZF1DXdxcBWuJkbcy", "name": "All Out 2010s",          "description": "Big nostalgia, big energy.",                    "mood": "energy",  "image_emoji": "⚡"},
    {"id": "37i9dQZF1DX76Wlfdnj7AP", "name": "Pump Up!",               "description": "High-energy to get you moving.",                "mood": "energy",  "image_emoji": "🚀"},
]


def list_moods() -> list:
    return [
        {"key": "happy",      "label": "Happy",         "emoji": "😄"},
        {"key": "good",       "label": "Good Vibes",    "emoji": "😊"},
        {"key": "relaxed",    "label": "Chill",         "emoji": "😌"},
        {"key": "neutral",    "label": "Ambient",       "emoji": "🧘"},
        {"key": "sad",        "label": "Tender",        "emoji": "😔"},
        {"key": "depressed",  "label": "Healing",       "emoji": "🌧"},
        {"key": "angry",      "label": "Release",       "emoji": "😡"},
        {"key": "anxious",    "label": "Anxiety Relief","emoji": "😰"},
        {"key": "burned_out", "label": "Rest",          "emoji": "🌙"},
        {"key": "focus",      "label": "Focus",         "emoji": "🎯"},
        {"key": "sleep",      "label": "Sleep",         "emoji": "💤"},
        {"key": "energy",     "label": "Energy",        "emoji": "⚡"},
    ]


async def search_playlists(mood: str, limit: int = 12) -> list:
    """Return curated playlists matching a mood. No Spotify API call required."""
    items = [p for p in CURATED if p["mood"] == mood]
    if not items:
        # fall back to relaxed
        items = [p for p in CURATED if p["mood"] == "relaxed"]
    out = []
    for p in items[:limit]:
        out.append({
            "id": p["id"],
            "name": p["name"],
            "description": p["description"],
            "image_emoji": p.get("image_emoji"),
            "image": None,  # cover not fetchable without API; iframe handles it
            "url": f"https://open.spotify.com/playlist/{p['id']}",
            "embed_url": f"https://open.spotify.com/embed/playlist/{p['id']}?utm_source=velora&theme=0",
        })
    return out
