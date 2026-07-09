"""Integration tests for the admin asset/user/job-health endpoints."""
from datetime import datetime

from app.models.scheduler_run import SchedulerRun
from tests.conftest import auth_headers

ADMIN = auth_headers("admin-x", "admin@example.com")


def test_add_and_remove_tracked_stock(client):
    add = client.post("/admin/assets/stocks", json={"ticker": "wow.ax", "name": "Woolworths"}, headers=ADMIN)
    assert add.status_code == 201
    assert add.json() == {"ticker": "WOW.AX", "name": "Woolworths"}

    listed = client.get("/admin/assets", headers=ADMIN)
    assert {"ticker": "WOW.AX", "name": "Woolworths"} in listed.json()["stocks"]

    dup = client.post("/admin/assets/stocks", json={"ticker": "WOW.AX", "name": "Woolworths"}, headers=ADMIN)
    assert dup.status_code == 409

    removed = client.delete("/admin/assets/stocks/WOW.AX", headers=ADMIN)
    assert removed.status_code == 204

    listed_after = client.get("/admin/assets", headers=ADMIN)
    assert listed_after.json()["stocks"] == []


def test_remove_nonexistent_stock_is_404(client):
    response = client.delete("/admin/assets/stocks/NOTREAL.AX", headers=ADMIN)
    assert response.status_code == 404


def test_add_tracked_crypto_and_fx(client):
    crypto = client.post(
        "/admin/assets/crypto",
        json={"coingecko_id": "cardano", "symbol": "ada", "name": "Cardano"},
        headers=ADMIN,
    )
    assert crypto.status_code == 201
    assert crypto.json() == {"coingecko_id": "cardano", "symbol": "ADA", "name": "Cardano"}

    fx = client.post("/admin/assets/fx", json={"quote_currency": "cad"}, headers=ADMIN)
    assert fx.status_code == 201
    assert fx.json() == {"quote_currency": "CAD"}


def test_promote_and_demote_user(client):
    # Trigger profile creation for a non-admin user.
    client.get("/admin/me", headers=auth_headers("user-9", "user9@example.com"))
    users = client.get("/admin/users", headers=ADMIN).json()["items"]
    user_row = next(u for u in users if u["supabase_user_id"] == "user-9")
    assert user_row["is_admin"] is False

    promote = client.post(f"/admin/users/{user_row['id']}/promote", headers=ADMIN)
    assert promote.status_code == 200
    assert promote.json()["is_admin"] is True

    demote = client.post(f"/admin/users/{user_row['id']}/demote", headers=ADMIN)
    assert demote.status_code == 200
    assert demote.json()["is_admin"] is False


def test_promote_nonexistent_user_is_404(client):
    response = client.post("/admin/users/999999/promote", headers=ADMIN)
    assert response.status_code == 404


def test_admin_cannot_demote_self(client):
    me = client.get("/admin/me", headers=ADMIN).json()

    response = client.post(f"/admin/users/{me['id']}/demote", headers=ADMIN)

    assert response.status_code == 400


def test_job_run_now_and_history(client, mocker):
    fake_run = SchedulerRun(
        id=1,
        started_at=datetime(2026, 1, 1, 12, 0, 0),
        finished_at=datetime(2026, 1, 1, 12, 0, 5),
        stocks_stored=5,
        crypto_stored=3,
        fx_stored=5,
        success=True,
        triggered_by="manual",
    )
    trigger = mocker.patch("app.api.admin.run_snapshot_job", return_value=fake_run)

    run_response = client.post("/admin/jobs/run-now", headers=ADMIN)

    assert run_response.status_code == 200
    assert run_response.json()["triggered_by"] == "manual"
    trigger.assert_called_once_with(triggered_by="manual")


def test_job_history_lists_runs(client):
    response = client.get("/admin/jobs", headers=ADMIN)
    assert response.status_code == 200
    assert "items" in response.json()


def test_non_admin_forbidden_from_mutating_assets(client):
    non_admin = auth_headers("user-7", "user7@example.com")
    body = {"ticker": "ABC.AX", "name": "Abc"}
    response = client.post("/admin/assets/stocks", json=body, headers=non_admin)
    assert response.status_code == 403
