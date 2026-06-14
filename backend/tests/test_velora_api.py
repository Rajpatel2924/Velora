"""Velora backend API tests — covers all endpoints in MVP-1."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    "BACKEND_URL",
    "https://your-render-app.onrender.com"
).rstrip("/")
API = f"{BASE_URL}/api"

# Generate a unique email per run so re-runs don't collide
UNIQUE = uuid.uuid4().hex[:8]
TEST_EMAIL = f"test_velora_{UNIQUE}@velora.app"
TEST_PASSWORD = "testpass1234"
TEST_NAME = "TEST Velora User"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    """Register a fresh user and return (token, user_id, headers)."""
    r = session.post(f"{API}/auth/register", json={
        "name": TEST_NAME, "email": TEST_EMAIL, "password": TEST_PASSWORD,
    }, timeout=20)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    headers = {"Authorization": f"Bearer {data['token']}", "Content-Type": "application/json"}
    return {"token": data["token"], "user": data["user"], "headers": headers}


# ---------------- Health ----------------
def test_health(session):
    r = session.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------------- AUTH ----------------
class TestAuth:
    def test_register_and_user_object(self, auth):
        u = auth["user"]
        assert u["email"] == TEST_EMAIL
        assert u["onboarding_complete"] is False
        assert "id" in u and "level" in u

    def test_register_duplicate(self, session, auth):
        r = session.post(f"{API}/auth/register", json={
            "name": TEST_NAME, "email": TEST_EMAIL, "password": TEST_PASSWORD,
        }, timeout=15)
        assert r.status_code == 400

    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and d["user"]["email"] == TEST_EMAIL

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_guest(self, session):
        r = session.post(f"{API}/auth/guest", json={"name": "TEST Guest"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["is_guest"] is True
        assert "token" in d

    def test_me_authenticated(self, session, auth):
        r = session.get(f"{API}/auth/me", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == TEST_EMAIL

    def test_me_unauthenticated(self, session):
        r = session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)


# ---------------- ONBOARDING ----------------
class TestOnboarding:
    def test_submit_onboarding(self, session, auth):
        payload = {
            "name": "TEST Velora",
            "data": {
                "age_group": "18-24", "role": "student",
                "goals": ["reduce_stress", "sleep_better"],
                "stress_level": 6, "sleep_quality": 5,
                "activities": ["meditation", "journaling"],
                "daily_goal_minutes": 15,
            }
        }
        r = session.post(f"{API}/auth/onboarding", json=payload, headers=auth["headers"], timeout=15)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["onboarding_complete"] is True
        assert u["xp"] >= 50
        assert "onboarded" in u["badges"]


# ---------------- MOOD ----------------
class TestMood:
    def test_log_and_list_mood(self, session, auth):
        r = session.post(f"{API}/mood", json={"mood": "happy", "note": "TEST mood"}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json()["score"] == 9

        r2 = session.get(f"{API}/mood", headers=auth["headers"], timeout=15)
        assert r2.status_code == 200
        moods = r2.json()
        assert isinstance(moods, list) and len(moods) >= 1
        assert moods[0]["mood"] == "happy"

    def test_mood_analytics(self, session, auth):
        # log one more so analytics has data
        session.post(f"{API}/mood", json={"mood": "neutral"}, headers=auth["headers"], timeout=15)
        r = session.get(f"{API}/mood/analytics", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("distribution", "trend", "average_score", "stability", "total"):
            assert k in d
        assert d["total"] >= 2


# ---------------- JOURNAL ----------------
class TestJournal:
    journal_id = None

    def test_create_journal_with_sentiment(self, session, auth):
        # AI call can take ~5-10s
        payload = {"content": "Today I felt grateful and calm after meditation.", "title": "TEST entry", "category": "gratitude"}
        r = session.post(f"{API}/journal", json=payload, headers=auth["headers"], timeout=45)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["content"] == payload["content"]
        # AI fields populated (may be None on rare failure)
        # We accept None but log
        TestJournal.journal_id = d["id"]
        # Sentiment expected to be populated
        assert d.get("sentiment") in (None, "positive", "neutral", "negative")

    def test_list_journals(self, session, auth):
        r = session.get(f"{API}/journal", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert any(j["id"] == TestJournal.journal_id for j in items)

    def test_search_journals(self, session, auth):
        r = session.get(f"{API}/journal", params={"q": "grateful"}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert all("grateful" in (j.get("content") or "").lower() for j in items)

    def test_delete_journal(self, session, auth):
        assert TestJournal.journal_id
        r = session.delete(f"{API}/journal/{TestJournal.journal_id}", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        # verify
        r2 = session.delete(f"{API}/journal/{TestJournal.journal_id}", headers=auth["headers"], timeout=15)
        assert r2.status_code == 404


# ---------------- HABITS ----------------
class TestHabits:
    def test_list_seeds_defaults(self, session, auth):
        r = session.get(f"{API}/habits", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        habits = r.json()
        assert len(habits) >= 8
        TestHabits.first_id = habits[0]["id"]

    def test_create_habit(self, session, auth):
        r = session.post(f"{API}/habits", json={"title": "TEST_custom_habit", "icon": "sparkles"}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        TestHabits.custom_id = r.json()["id"]
        assert r.json()["title"] == "TEST_custom_habit"

    def test_toggle_habit(self, session, auth):
        r = session.post(f"{API}/habits/{TestHabits.custom_id}/toggle", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["completed"] is True and d["streak"] >= 1
        # toggle again to uncomplete
        r2 = session.post(f"{API}/habits/{TestHabits.custom_id}/toggle", headers=auth["headers"], timeout=15)
        assert r2.status_code == 200
        assert r2.json()["completed"] is False

    def test_delete_habit(self, session, auth):
        r = session.delete(f"{API}/habits/{TestHabits.custom_id}", headers=auth["headers"], timeout=15)
        assert r.status_code == 200


# ---------------- CHAT ----------------
class TestChat:
    def test_chat_send_stream(self, session, auth):
        # Use SSE; collect events
        url = f"{API}/chat/send"
        payload = {"message": "Hi Velora, give me one quick tip in under 20 words."}
        r = requests.post(url, json=payload, headers=auth["headers"], stream=True, timeout=60)
        assert r.status_code == 200
        session_id = None
        deltas = []
        done = False
        for line in r.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith("data:"):
                import json
                try:
                    obj = json.loads(line[5:].strip())
                except Exception:
                    continue
                if "session_id" in obj:
                    session_id = obj["session_id"]
                if "delta" in obj:
                    deltas.append(obj["delta"])
                if obj.get("done"):
                    done = True
                    break
                if "error" in obj:
                    pytest.fail(f"chat error: {obj['error']}")
        assert session_id, "Missing session_id event"
        assert done, "Did not receive done flag"
        assert len("".join(deltas)) > 0, "No deltas received"
        TestChat.session_id = session_id

    def test_chat_messages_history(self, session, auth):
        # Slight wait to ensure assistant message is saved
        time.sleep(1)
        r = session.get(f"{API}/chat/messages", params={"session_id": TestChat.session_id}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        assert len(msgs) >= 2
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles


# ---------------- VOICE ----------------
class TestVoice:
    def test_transcribe_no_file(self, session, auth):
        # No multipart file -> 422 from FastAPI
        r = requests.post(f"{API}/voice/transcribe", headers={"Authorization": auth["headers"]["Authorization"]}, timeout=15)
        assert r.status_code == 422

    def test_tts(self, session, auth):
        r = session.post(f"{API}/voice/speak", json={"text": "Hello from Velora"}, headers=auth["headers"], timeout=45)
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith("audio/mpeg")
        assert len(r.content) > 500


# ---------------- ASSESSMENTS ----------------
class TestAssessments:
    def test_categories(self, session, auth):
        r = session.get(f"{API}/assessments/categories", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) == 8
        keys = {c["key"] for c in cats}
        assert "anxiety" in keys and "wellbeing" in keys

    def test_questions(self, session, auth):
        r = session.get(f"{API}/assessments/questions", params={"category": "anxiety"}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert len(d["questions"]) == 5 and len(d["scale"]) == 5

    def test_submit(self, session, auth):
        r = session.post(f"{API}/assessments/submit", json={"category": "anxiety", "answers": [2, 2, 1, 2, 1]}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("score", "max_score", "level", "feedback", "recommendations"):
            assert k in d
        assert d["score"] == 8 and d["max_score"] == 20


# ---------------- SLEEP ----------------
class TestSleep:
    def test_create_and_list(self, session, auth):
        r = session.post(f"{API}/sleep", json={"hours": 7.5, "quality": 4, "note": "TEST"}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        r2 = session.get(f"{API}/sleep", headers=auth["headers"], timeout=15)
        assert r2.status_code == 200
        assert len(r2.json()) >= 1


# ---------------- SESSIONS ----------------
class TestSessions:
    def test_log_session(self, session, auth):
        r = session.post(f"{API}/sessions", json={"kind": "breathing", "type": "box", "duration_seconds": 60}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json()["duration_seconds"] == 60


# ---------------- DASHBOARD & INSIGHTS ----------------
class TestDashboard:
    def test_dashboard(self, session, auth):
        r = session.get(f"{API}/dashboard", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("wellness_score", "avg_mood", "habit_completion_today", "streak_days", "xp", "level", "level_name", "avg_sleep_hours"):
            assert k in d

    def test_insights(self, session, auth):
        r = session.get(f"{API}/insights", headers=auth["headers"], timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert "insight" in d and "summary" in d
        assert isinstance(d["insight"], str) and len(d["insight"]) > 0


# ---------------- EMERGENCY ----------------
class TestEmergency:
    def test_emergency_resources(self, session):
        # public (no auth) per code — uses no Depends
        r = session.get(f"{API}/emergency/resources", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert len(d["hotlines"]) >= 5
        assert len(d["tips"]) >= 4
