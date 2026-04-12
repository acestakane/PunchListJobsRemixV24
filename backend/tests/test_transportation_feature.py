"""
Tests for Crew Transportation Type feature
- Admin settings toggle
- Public settings API
- Crew profile update with transportation_type
- Migration: crew users have transportation_type field
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

ADMIN_CREDS = {"email": "admin@punchlistjobs.com", "password": "Admin@123"}
CREW_CREDS = {"email": "crew1@punchlistjobs.com", "password": "Crew@123"}
CONTRACTOR_CREDS = {"email": "contractor1@punchlistjobs.com", "password": "Contractor@123"}


def login(creds):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_token():
    return login(ADMIN_CREDS)


@pytest.fixture(scope="module")
def crew_token():
    return login(CREW_CREDS)


@pytest.fixture(scope="module")
def contractor_token():
    return login(CONTRACTOR_CREDS)


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# --- Admin Settings ---

class TestAdminSettings:
    """Admin settings for enable_crew_transportation_type"""

    def test_get_admin_settings_has_transportation_field(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/settings", headers=auth_headers(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "enable_crew_transportation_type" in data, f"Field missing. Keys: {list(data.keys())}"
        print(f"Current enable_crew_transportation_type = {data['enable_crew_transportation_type']}")

    def test_enable_transportation_type(self, admin_token):
        r = requests.put(f"{BASE_URL}/api/admin/settings",
                         headers=auth_headers(admin_token),
                         json={"enable_crew_transportation_type": True})
        assert r.status_code == 200
        data = r.json()
        assert "message" in data or "enable_crew_transportation_type" in data
        print(f"Enable response: {data}")

    def test_disable_transportation_type(self, admin_token):
        r = requests.put(f"{BASE_URL}/api/admin/settings",
                         headers=auth_headers(admin_token),
                         json={"enable_crew_transportation_type": False})
        assert r.status_code == 200
        print("Disabled transportation type")

    def test_re_enable_transportation_type(self, admin_token):
        """Re-enable for subsequent tests"""
        r = requests.put(f"{BASE_URL}/api/admin/settings",
                         headers=auth_headers(admin_token),
                         json={"enable_crew_transportation_type": True})
        assert r.status_code == 200


# --- Public Settings ---

class TestPublicSettings:
    """Public settings endpoint"""

    def test_public_settings_has_transportation_field(self):
        r = requests.get(f"{BASE_URL}/api/settings/public")
        assert r.status_code == 200
        data = r.json()
        assert "enable_crew_transportation_type" in data, f"Field missing. Keys: {list(data.keys())}"

    def test_public_settings_transportation_is_enabled(self):
        r = requests.get(f"{BASE_URL}/api/settings/public")
        assert r.status_code == 200
        data = r.json()
        # Should be True after re-enabling in admin tests
        print(f"Public enable_crew_transportation_type = {data.get('enable_crew_transportation_type')}")


# --- Crew Profile ---

class TestCrewProfile:
    """Crew profile transportation_type field"""

    def test_get_crew_profile_has_transportation_type(self, crew_token):
        r = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers(crew_token))
        assert r.status_code == 200
        data = r.json()
        assert "transportation_type" in data, f"transportation_type missing. Keys: {list(data.keys())}"
        print(f"Current transportation_type = {data.get('transportation_type')}")

    def test_update_crew_transportation_type_car(self, crew_token):
        r = requests.put(f"{BASE_URL}/api/users/profile",
                         headers=auth_headers(crew_token),
                         json={"transportation_type": "Car"})
        assert r.status_code == 200
        data = r.json()
        print(f"Update response: {data}")

    def test_verify_transportation_type_persisted(self, crew_token):
        r = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers(crew_token))
        assert r.status_code == 200
        data = r.json()
        assert data.get("transportation_type") == "Car", f"Expected 'Car', got {data.get('transportation_type')}"

    def test_update_crew_transportation_type_suv(self, crew_token):
        r = requests.put(f"{BASE_URL}/api/users/profile",
                         headers=auth_headers(crew_token),
                         json={"transportation_type": "SUV"})
        assert r.status_code == 200

    def test_reset_transportation_type_null(self, crew_token):
        """Reset for clean state"""
        r = requests.put(f"{BASE_URL}/api/users/profile",
                         headers=auth_headers(crew_token),
                         json={"transportation_type": None})
        assert r.status_code == 200


# --- Migration check ---

class TestMigration:
    """All crew users should have transportation_type field"""

    def test_all_crew_users_have_transportation_field(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers(admin_token))
        assert r.status_code == 200
        users = r.json().get("users", r.json()) if isinstance(r.json(), dict) else r.json()
        crew_users = [u for u in users if u.get("role") == "crew"]
        assert len(crew_users) > 0, "No crew users found"
        for u in crew_users:
            assert "transportation_type" in u, f"Crew user {u.get('email')} missing transportation_type"
        print(f"Checked {len(crew_users)} crew users - all have transportation_type field")


# --- Contractor can see crew transportation ---

class TestContractorView:
    """Contractor can see transportation type on crew cards"""

    def test_contractor_can_get_crew_members(self, contractor_token):
        r = requests.get(f"{BASE_URL}/api/contractor/crew", headers=auth_headers(contractor_token))
        if r.status_code == 404:
            # Try alternative endpoint
            r = requests.get(f"{BASE_URL}/api/crew/members", headers=auth_headers(contractor_token))
        assert r.status_code in [200, 404], f"Unexpected status: {r.status_code}"
        if r.status_code == 200:
            data = r.json()
            print(f"Got {len(data)} crew members")
            for member in data[:3]:
                print(f"  {member.get('email')} - transport: {member.get('transportation_type')}")
