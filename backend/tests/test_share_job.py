"""Tests for Share Approved Jobs feature — GET /api/jobs/{job_id}/share"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test job IDs from review_request
JOB_OPEN = "6b115c8d-8041-414b-85a1-d8a6a644e0fa"   # contractor1's job, open
JOB_CREW1_ACCEPTED = "e07dc228-5720-4ae8-aa1a-9b3b19af02cb"  # crew1 accepted


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestShareEndpoint:
    """GET /api/jobs/{job_id}/share — no auth required"""

    def test_share_returns_200_no_auth(self, client):
        r = client.get(f"{BASE_URL}/api/jobs/{JOB_OPEN}/share")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_share_fields_present(self, client):
        r = client.get(f"{BASE_URL}/api/jobs/{JOB_OPEN}/share")
        assert r.status_code == 200
        d = r.json()
        for field in ["id", "title", "description", "pay_rate", "crew_needed", "crew_accepted_count", "is_full", "status", "city", "state"]:
            assert field in d, f"Missing field: {field}"

    def test_share_no_sensitive_fields(self, client):
        r = client.get(f"{BASE_URL}/api/jobs/{JOB_OPEN}/share")
        assert r.status_code == 200
        d = r.json()
        for bad_field in ["address", "email", "phone", "lat", "lng", "location", "contractor_id", "contractor_email", "contractor_phone"]:
            assert bad_field not in d, f"Sensitive field exposed: {bad_field}"

    def test_share_crew1_accepted_job(self, client):
        r = client.get(f"{BASE_URL}/api/jobs/{JOB_CREW1_ACCEPTED}/share")
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == JOB_CREW1_ACCEPTED

    def test_share_404_unknown_job(self, client):
        r = client.get(f"{BASE_URL}/api/jobs/nonexistent-job-id-xyz/share")
        assert r.status_code == 404

    def test_share_city_state_present(self, client):
        r = client.get(f"{BASE_URL}/api/jobs/{JOB_OPEN}/share")
        assert r.status_code == 200
        d = r.json()
        # city/state should be strings (can be empty if not set)
        assert isinstance(d["city"], str)
        assert isinstance(d["state"], str)

    def test_share_is_full_and_crew_counts(self, client):
        r = client.get(f"{BASE_URL}/api/jobs/{JOB_OPEN}/share")
        assert r.status_code == 200
        d = r.json()
        expected_full = d["crew_accepted_count"] >= d["crew_needed"]
        assert d["is_full"] == expected_full
