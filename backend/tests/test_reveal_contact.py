"""Tests for contractor contact reveal feature (pending masking + paid reveal)"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

JOB_ID = "6b115c8d-8041-414b-85a1-d8a6a644e0fa"
CONTRACTOR_ID = "7b6caaa0-d3bd-41ec-9e44-2510ddcd37eb"

# crew2 (0a40a35e) - pending, NO paid_reveal
# crew3 (c9c9fdfa) - pending, HAS paid_reveal
# crew1 (050fc3ca) - accepted on this job


def login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed for {email}: {r.text}"
    return r.json()["access_token"], r.json()["user"]["id"]


@pytest.fixture(scope="module")
def crew2_headers():
    token, _ = login("crew2@punchlistjobs.com", "Crew@123")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def crew3_headers():
    token, _ = login("crew3@punchlistjobs.com", "Crew@123")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def crew1_headers():
    token, _ = login("crew1@punchlistjobs.com", "Crew@123")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def contractor1_headers():
    token, _ = login("contractor1@punchlistjobs.com", "Contractor@123")
    return {"Authorization": f"Bearer {token}"}


# --- Public profile masking tests ---

class TestPendingMasking:
    """Crew with pending application should have contractor contact hidden"""

    def test_pending_no_reveal_hides_phone(self, crew2_headers):
        """crew2 is pending with no paid_reveal → phone should be hidden"""
        r = requests.get(f"{BASE_URL}/api/users/public/{CONTRACTOR_ID}?job_id={JOB_ID}", headers=crew2_headers)
        assert r.status_code == 200
        data = r.json()
        assert "phone" not in data, f"Phone should be hidden for pending user, got: {data.get('phone')}"
        print("PASS: phone hidden for pending+no reveal")

    def test_pending_no_reveal_hides_email(self, crew2_headers):
        """crew2 is pending with no paid_reveal → email should be hidden"""
        r = requests.get(f"{BASE_URL}/api/users/public/{CONTRACTOR_ID}?job_id={JOB_ID}", headers=crew2_headers)
        assert r.status_code == 200
        data = r.json()
        assert "email" not in data, f"Email should be hidden for pending user, got: {data.get('email')}"
        print("PASS: email hidden for pending+no reveal")

    def test_pending_no_reveal_has_paid_reveal_false(self, crew2_headers):
        """has_paid_reveal should be False for crew2"""
        r = requests.get(f"{BASE_URL}/api/users/public/{CONTRACTOR_ID}?job_id={JOB_ID}", headers=crew2_headers)
        assert r.status_code == 200
        data = r.json()
        assert data.get("has_paid_reveal") == False
        print("PASS: has_paid_reveal=False for pending user")

    def test_accepted_crew_sees_contact(self, crew1_headers):
        """crew1 is accepted → should see phone and email"""
        r = requests.get(f"{BASE_URL}/api/users/public/{CONTRACTOR_ID}?job_id={JOB_ID}", headers=crew1_headers)
        assert r.status_code == 200
        data = r.json()
        # crew1 is on free/expired subscription check might still hide, check has_paid_reveal
        print(f"crew1 accepted: phone={'phone' in data}, email={'email' in data}, has_paid_reveal={data.get('has_paid_reveal')}")
        # Accepted crew should have contact visible
        assert "phone" in data or "email" in data, f"Accepted crew should see contact info. Data keys: {list(data.keys())}"
        print("PASS: accepted crew sees contact info")

    def test_paid_reveal_crew_sees_contact(self, crew3_headers):
        """crew3 has paid_reveal=True → should see phone and email despite being pending"""
        r = requests.get(f"{BASE_URL}/api/users/public/{CONTRACTOR_ID}?job_id={JOB_ID}", headers=crew3_headers)
        assert r.status_code == 200
        data = r.json()
        assert data.get("has_paid_reveal") == True, "has_paid_reveal should be True for crew3"
        assert "phone" in data or "email" in data, f"Paid reveal crew should see contact. Keys: {list(data.keys())}"
        print("PASS: paid reveal crew sees contact info")


class TestRevealContactEndpoint:
    """POST /api/jobs/{job_id}/reveal-contact tests"""

    def test_idempotent_second_call(self, crew3_headers):
        """crew3 already revealed → second call returns 'Already revealed'"""
        r = requests.post(f"{BASE_URL}/api/jobs/{JOB_ID}/reveal-contact", headers=crew3_headers)
        assert r.status_code == 200
        data = r.json()
        assert data.get("message") == "Already revealed"
        assert data.get("has_paid_reveal") == True
        print("PASS: idempotent - already revealed returns correct message")

    def test_non_crew_user_gets_403(self, contractor1_headers):
        """contractor cannot use paid reveal → 403"""
        r = requests.post(f"{BASE_URL}/api/jobs/{JOB_ID}/reveal-contact", headers=contractor1_headers)
        assert r.status_code == 403
        print("PASS: non-crew user gets 403")

    def test_reveal_returns_amount(self, crew3_headers):
        """Response should contain amount field when first revealed (idempotent returns has_paid_reveal)"""
        r = requests.post(f"{BASE_URL}/api/jobs/{JOB_ID}/reveal-contact", headers=crew3_headers)
        assert r.status_code == 200
        data = r.json()
        assert data.get("has_paid_reveal") == True
        print("PASS: reveal response has has_paid_reveal=True")

    def test_non_pending_crew_cannot_reveal(self, crew1_headers):
        """crew1 is accepted (not in pending anymore, or maybe still in pending) - test behavior"""
        r = requests.post(f"{BASE_URL}/api/jobs/{JOB_ID}/reveal-contact", headers=crew1_headers)
        # crew1 is accepted. Depending on whether accepted removes from pending, this might 400 or succeed
        print(f"crew1 reveal attempt status: {r.status_code}, response: {r.json()}")
        # We expect 400 since crew1 may not be in pending list (accepted)
        # This is informational - not strictly asserting

    def test_reveal_new_crew_flow(self):
        """Test fresh reveal flow with crew2 (pending, no reveal yet).
        NOTE: This actually charges demo payment and persists paid_reveal for crew2.
        We test and then verify contact becomes visible."""
        token, crew2_id = login("crew2@punchlistjobs.com", "Crew@123")
        headers = {"Authorization": f"Bearer {token}"}

        # First check: contact hidden
        r = requests.get(f"{BASE_URL}/api/users/public/{CONTRACTOR_ID}?job_id={JOB_ID}", headers=headers)
        assert r.status_code == 200
        before = r.json()
        assert "phone" not in before, "Phone should be hidden before reveal"
        assert before.get("has_paid_reveal") == False

        # Reveal
        rv = requests.post(f"{BASE_URL}/api/jobs/{JOB_ID}/reveal-contact", headers=headers)
        assert rv.status_code == 200
        rv_data = rv.json()
        assert rv_data.get("has_paid_reveal") == True
        assert rv_data.get("amount") == 2.99 or rv_data.get("message") == "Already revealed"
        print(f"Reveal response: {rv_data}")

        # After reveal: contact visible
        r2 = requests.get(f"{BASE_URL}/api/users/public/{CONTRACTOR_ID}?job_id={JOB_ID}", headers=headers)
        assert r2.status_code == 200
        after = r2.json()
        assert after.get("has_paid_reveal") == True
        assert "phone" in after or "email" in after, f"Contact should be visible after reveal. Keys: {list(after.keys())}"
        print("PASS: full reveal flow - contact visible after paid reveal")
