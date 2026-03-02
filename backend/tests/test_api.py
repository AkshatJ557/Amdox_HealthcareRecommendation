import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Healthcare Recommendation System API"}

# Basic mock test for Auth
def test_login_no_user():
    response = client.post("/auth/login", data={"username": "test@test.com", "password": "password"})
    # Since DB is empty initially, should handle 404 or 400 smoothly
    assert response.status_code in [400, 404]
