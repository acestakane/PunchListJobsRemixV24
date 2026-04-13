"""Tests for contact reveal feature - hiding phone/email and paid reveal flow"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

def login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed for {email}: {r.text}"
    return r.json()["access_token"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

class TestContactReveal:
    """Contact reveal feature tests"""

    @pytest.fixture(scope="class")
    def crew1_token(self):
        return login("crew1@punchlistjobs.com", "Crew@123")

    @pytest.fixture(scope="class")
    def crew2_token(self):
        return login("crew2@punchlistjobs.com", "Crew@123")

    @pytest.fixture(scope="class")
    def contractor1_token(self):
        return login("contractor1@punchlistjobs.com", "Contractor@123")

    @pytest.fixture(scope="class")
    def test_job_id(self, contractor1_token):
        """Get a job posted by contractor1"""
        r = requests.get(f"{BASE_URL}/api/jobs", headers=auth_headers(contractor1_token))
        assert r.status_code == 200
        jobs = r.json()
        contractor_jobs = [j for j in jobs if j.get("contractor_id")]
        assert len(contractor_jobs) > 0, "No jobs found"
        return contractor_jobs[0]["id"]

    def test_crew1_hidden_contact_no_reveal(self, crew1_token, test_job_id):
        """Contact must be hidden (no phone/email) when no reveal exists"""
        job_r = requests.get(f"{BASE_URL}/api/jobs/{test_job_id}", headers=auth_headers(crew1_token))
        assert job_r.status_code == 200
        job = job_r.json()
        contractor_id = job.get("contractor_id")
        assert contractor_id

        crew_accepted = job.get("crew_accepted", [])
        paid_reveals = job.get("paid_reveals", [])

        me_r = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers(crew1_token))
        crew1_id = me_r.json()["id"]

        if crew1_id not in crew_accepted and crew1_id not in paid_reveals:
            profile_r = requests.get(
                f"{BASE_URL}/api/users/public/{contractor_id}?job_id={test_job_id}",
                headers=auth_headers(crew1_token)
            )
            assert profile_r.status_code == 200
            data = profile_r.json()
            assert "phone" not in data, f"Phone should be hidden, got: {data.get('phone')}"
            assert "email" not in data, f"Email should be hidden, got: {data.get('email')}"
            assert data.get("has_paid_reveal") == False
            print(f"PASS: Contact hidden for crew1 on job {test_job_id}")
        else:
            print(f"SKIP: crew1 already accepted/revealed on job {test_job_id}")

    def test_reveal_contact_endpoint(self, crew2_token, test_job_id):
        """POST reveal-contact should succeed and return has_paid_reveal=True"""
        r = requests.post(f"{BASE_URL}/api/jobs/{test_job_id}/reveal-contact", headers=auth_headers(crew2_token))
        assert r.status_code == 200
        data = r.json()
        assert data.get("has_paid_reveal") == True
        print(f"PASS: Reveal result: {data}")

    def test_contact_visible_after_reveal(self, crew2_token, test_job_id):
        """After reveal, phone and email should appear in public profile"""
        job_r = requests.get(f"{BASE_URL}/api/jobs/{test_job_id}", headers=auth_headers(crew2_token))
        contractor_id = job_r.json().get("contractor_id")

        profile_r = requests.get(
            f"{BASE_URL}/api/users/public/{contractor_id}?job_id={test_job_id}",
            headers=auth_headers(crew2_token)
        )
        assert profile_r.status_code == 200
        data = profile_r.json()
        assert "phone" in data or "email" in data, f"Contact still hidden after reveal: {data}"
        assert data.get("has_paid_reveal") == True
        print(f"PASS: Contact visible after reveal")

    def test_idempotency_no_double_charge(self, crew2_token, test_job_id):
        """Calling reveal again returns Already revealed"""
        r = requests.post(f"{BASE_URL}/api/jobs/{test_job_id}/reveal-contact", headers=auth_headers(crew2_token))
        assert r.status_code == 200
        data = r.json()
        assert data.get("has_paid_reveal") == True
        assert "Already revealed" in data.get("message", ""), f"Expected idempotent response, got: {data}"
        print(f"PASS: Idempotency confirmed")

    def test_contractor_cannot_use_reveal(self, contractor1_token, test_job_id):
        """Contractor should get 403 on reveal-contact"""
        r = requests.post(f"{BASE_URL}/api/jobs/{test_job_id}/reveal-contact", headers=auth_headers(contractor1_token))
        assert r.status_code == 403
        print(f"PASS: Contractor correctly blocked")
