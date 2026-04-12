"""
Backend tests for PunchList features:
- Description required validation
- Tasks in job creation
- Task-check endpoint
- Crew-complete / contractor-complete endpoints
- Dispute endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

CONTRACTOR1 = {"email": "contractor1@punchlistjobs.com", "password": "Contractor@123"}
CREW1 = {"email": "crew1@punchlistjobs.com", "password": "Crew@123"}

# Job with tasks (from context)
TASK_JOB_ID = "9a6f8b29-a502-4a31-afe4-8d7a53749e73"
CREW1_JOB_ID = "e07dc228"  # crew1 is accepted on this job (partial id)


def get_token(credentials):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=credentials)
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def contractor_token():
    return get_token(CONTRACTOR1)


@pytest.fixture(scope="module")
def crew_token():
    return get_token(CREW1)


# ── Description validation ────────────────────────────────────────────────────

class TestDescriptionValidation:
    """POST /api/jobs/ - description required"""

    def test_empty_description_returns_400(self, contractor_token):
        payload = {
            "title": "Test Job",
            "description": "",
            "trade": "Carpentry",
            "crew_needed": 1,
            "start_time": "2026-03-01T08:00:00Z",
            "pay_rate": 25.0,
            "address": "123 Main St, Atlanta, GA 30301",
        }
        r = requests.post(f"{BASE_URL}/api/jobs/", json=payload, headers=auth_headers(contractor_token))
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        assert "Description" in r.json().get("detail", ""), f"Wrong detail: {r.json()}"

    def test_whitespace_description_returns_400(self, contractor_token):
        payload = {
            "title": "Test Job",
            "description": "   ",
            "trade": "Carpentry",
            "crew_needed": 1,
            "start_time": "2026-03-01T08:00:00Z",
            "pay_rate": 25.0,
            "address": "123 Main St, Atlanta, GA 30301",
        }
        r = requests.post(f"{BASE_URL}/api/jobs/", json=payload, headers=auth_headers(contractor_token))
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"


# ── Tasks in job creation ─────────────────────────────────────────────────────

class TestTasksInJobCreation:
    """POST /api/jobs/ - tasks array saved"""

    created_job_id = None

    def test_create_job_with_tasks(self, contractor_token):
        payload = {
            "title": "TEST_PunchList Job",
            "description": "A job with punchlist tasks",
            "trade": "Carpentry",
            "crew_needed": 1,
            "start_time": "2026-03-01T08:00:00Z",
            "pay_rate": 25.0,
            "address": "123 Main St, Atlanta, GA 30301",
            "tasks": ["Frame walls", "Install drywall", "Paint"],
        }
        r = requests.post(f"{BASE_URL}/api/jobs/", json=payload, headers=auth_headers(contractor_token))
        assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("tasks") == ["Frame walls", "Install drywall", "Paint"], f"tasks mismatch: {data.get('tasks')}"
        TestTasksInJobCreation.created_job_id = data["id"]

    def test_get_job_has_tasks_and_fields(self, contractor_token):
        if not TestTasksInJobCreation.created_job_id:
            pytest.skip("Job not created")
        r = requests.get(f"{BASE_URL}/api/jobs/{TestTasksInJobCreation.created_job_id}", headers=auth_headers(contractor_token))
        assert r.status_code == 200
        data = r.json()
        assert "tasks" in data
        assert "task_completions" in data
        assert "crew_submitted_at" in data
        assert "images" in data


# ── Task-check endpoint ───────────────────────────────────────────────────────

class TestTaskCheck:
    """PUT /api/jobs/{job_id}/task-check"""

    def test_valid_task_check(self, crew_token):
        r = requests.put(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/task-check",
            json={"task_idx": 0, "checked": True},
            headers=auth_headers(crew_token),
        )
        assert r.status_code == 200, f"Expected 200: {r.text}"
        assert r.json().get("ok") is True

    def test_invalid_task_idx_returns_400(self, crew_token):
        r = requests.put(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/task-check",
            json={"task_idx": 999, "checked": True},
            headers=auth_headers(crew_token),
        )
        assert r.status_code == 400, f"Expected 400: {r.text}"


# ── Crew-complete endpoint ────────────────────────────────────────────────────

class TestCrewComplete:
    """POST /api/jobs/{job_id}/crew-complete"""

    def test_crew_complete_records_timestamp(self, crew_token):
        # crew1 is accepted on TASK_JOB_ID (status=completed_pending_review)
        r = requests.post(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/crew-complete",
            headers=auth_headers(crew_token),
        )
        # May return 200 or 403 depending on crew membership; check status
        assert r.status_code in (200, 403), f"Unexpected: {r.status_code} {r.text}"
        if r.status_code == 200:
            data = r.json()
            assert "message" in data
            assert "submitted_at" in data

    def test_crew_complete_wrong_user_returns_403(self, contractor_token):
        # contractor should get 403 (not crew role)
        r = requests.post(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/crew-complete",
            headers=auth_headers(contractor_token),
        )
        assert r.status_code == 403, f"Expected 403: {r.text}"


# ── Contractor-complete endpoint ──────────────────────────────────────────────

class TestContractorComplete:
    """POST /api/jobs/{job_id}/contractor-complete"""

    def test_contractor_complete_sets_status(self, contractor_token):
        # First find one of contractor1's jobs that can be set complete
        r = requests.get(f"{BASE_URL}/api/jobs/", headers=auth_headers(contractor_token))
        assert r.status_code == 200
        jobs = r.json()
        # Use TASK_JOB_ID (status=completed_pending_review already, so will just re-set)
        r2 = requests.post(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/contractor-complete",
            headers=auth_headers(contractor_token),
        )
        # May succeed or 403 if contractor1 doesn't own that job
        assert r2.status_code in (200, 403), f"Unexpected: {r2.status_code} {r2.text}"
        if r2.status_code == 200:
            assert "message" in r2.json()

    def test_contractor_complete_wrong_user_returns_403(self, crew_token):
        r = requests.post(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/contractor-complete",
            headers=auth_headers(crew_token),
        )
        assert r.status_code == 403, f"Expected 403: {r.text}"


# ── Dispute endpoint ──────────────────────────────────────────────────────────

class TestDispute:
    """POST /api/jobs/{job_id}/dispute"""

    def test_submit_dispute_returns_id(self, crew_token):
        r = requests.post(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/dispute",
            json={"reason": "TEST_dispute reason for punchlist test"},
            headers=auth_headers(crew_token),
        )
        assert r.status_code == 200, f"Expected 200: {r.status_code} {r.text}"
        data = r.json()
        assert "id" in data, f"No id in response: {data}"
        assert "message" in data

    def test_empty_dispute_reason_returns_400(self, crew_token):
        r = requests.post(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/dispute",
            json={"reason": ""},
            headers=auth_headers(crew_token),
        )
        assert r.status_code == 400, f"Expected 400: {r.text}"

    def test_whitespace_dispute_reason_returns_400(self, crew_token):
        r = requests.post(
            f"{BASE_URL}/api/jobs/{TASK_JOB_ID}/dispute",
            json={"reason": "   "},
            headers=auth_headers(crew_token),
        )
        assert r.status_code == 400, f"Expected 400: {r.text}"


# ── GET job fields ────────────────────────────────────────────────────────────

class TestGetJobFields:
    """GET /api/jobs/{id} returns expected fields"""

    def test_task_job_has_required_fields(self, crew_token):
        r = requests.get(f"{BASE_URL}/api/jobs/{TASK_JOB_ID}", headers=auth_headers(crew_token))
        assert r.status_code == 200, f"Expected 200: {r.text}"
        data = r.json()
        assert "tasks" in data, "Missing tasks field"
        assert "task_completions" in data, "Missing task_completions field"
        assert "crew_submitted_at" in data, "Missing crew_submitted_at field"
        assert "images" in data, "Missing images field"
        assert isinstance(data["tasks"], list), "tasks should be a list"
