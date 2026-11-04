import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_returns_200():
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_returns_ok_status():
    response = client.get("/api/health")
    data = response.json()
    assert data["status"] == "ok"


def test_health_returns_version():
    response = client.get("/api/health")
    data = response.json()
    assert "version" in data
