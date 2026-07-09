"""Integration test for /summary, with the underlying services mocked out."""
from app.schemas.summary import MarketSummary


def test_summary_endpoint_returns_service_output(client, mocker):
    fake_summary = MarketSummary(
        strongest_stock=None,
        weakest_stock=None,
        crypto_market_direction="bullish",
        crypto_average_change_pct=2.5,
        aud_strength_indicator="stable",
        aud_average_change_pct=0.1,
        generated_at="2026-01-01T00:00:00+00:00",
    )
    mocker.patch("app.api.summary.build_market_summary", return_value=fake_summary)

    response = client.get("/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["crypto_market_direction"] == "bullish"
    assert body["aud_strength_indicator"] == "stable"
