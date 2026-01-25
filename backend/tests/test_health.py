"""Tests for health endpoint."""


def test_health_endpoint(client):
    """Test that health endpoint returns OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
