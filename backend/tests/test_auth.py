"""Tests for JWT verification and admin-access enforcement in app.api.deps."""
from tests.conftest import auth_headers


def test_admin_endpoint_rejects_missing_token(client):
    response = client.get("/admin/me")
    assert response.status_code == 401


def test_admin_endpoint_rejects_invalid_token(client):
    response = client.get("/admin/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


def test_new_user_is_created_on_first_request(client):
    response = client.get("/admin/me", headers=auth_headers("user-1", "someone@example.com"))

    assert response.status_code == 200
    body = response.json()
    assert body["supabase_user_id"] == "user-1"
    assert body["email"] == "someone@example.com"
    assert body["is_admin"] is False


def test_email_in_admin_emails_is_auto_promoted(client):
    response = client.get("/admin/me", headers=auth_headers("admin-1", "admin@example.com"))

    assert response.status_code == 200
    assert response.json()["is_admin"] is True


def test_non_admin_gets_403_on_admin_only_routes(client):
    headers = auth_headers("user-2", "not-admin@example.com")
    response = client.get("/admin/assets", headers=headers)
    assert response.status_code == 403


def test_admin_can_access_admin_only_routes(client):
    headers = auth_headers("admin-2", "admin@example.com")
    response = client.get("/admin/assets", headers=headers)
    assert response.status_code == 200
