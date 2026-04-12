"""Backend tests for PunchListJobs API"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """API health and root endpoint tests"""

    def test_root_operational(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "operational"
        print(f"Root response: {data}")

    def test_public_settings(self):
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200
        data = response.json()
        assert data.get("site_name") == "PunchListJobs"
        print(f"Public settings: {data}")


class TestAuth:
    """Authentication endpoint tests"""

    def test_login_superadmin(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "superadmin@punchlistjobs.com",
            "password": "SuperAdmin@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "superadmin"
        print(f"SuperAdmin login: {data['user']['email']}")

    def test_login_admin(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@punchlistjobs.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"

    def test_login_crew(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "crew1@punchlistjobs.com",
            "password": "Crew@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "crew"

    def test_login_contractor(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "contractor1@punchlistjobs.com",
            "password": "Contractor@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "contractor"

    def test_login_invalid_credentials(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401

    def test_get_me(self):
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "crew1@punchlistjobs.com",
            "password": "Crew@123"
        })
        token = login_resp.json()["access_token"]
        # Get current user
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        data = me_resp.json()
        assert data["email"] == "crew1@punchlistjobs.com"


class TestAdminEndpoints:
    """Admin-only endpoints"""

    @pytest.fixture(autouse=True)
    def superadmin_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "superadmin@punchlistjobs.com",
            "password": "SuperAdmin@123"
        })
        self.token = resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_admin_analytics(self):
        response = requests.get(f"{BASE_URL}/api/admin/analytics", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Admin analytics: {data}")

    def test_admin_users_list(self):
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or isinstance(data, dict)
        print(f"Admin users response type: {type(data)}")


class TestJobsEndpoints:
    """Jobs endpoint tests"""

    @pytest.fixture(autouse=True)
    def contractor_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "contractor1@punchlistjobs.com",
            "password": "Contractor@123"
        })
        self.token = resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_list_jobs(self):
        response = requests.get(f"{BASE_URL}/api/jobs", headers=self.headers)
        assert response.status_code == 200
        print(f"Jobs list status: {response.status_code}")
