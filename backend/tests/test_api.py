import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from app.main import app

def test_read_main():
    with patch("app.main.connect_to_mongo", new_callable=AsyncMock), \
         patch("app.main.close_mongo_connection", new_callable=AsyncMock):
        with TestClient(app) as client:
            response = client.get("/")
            assert response.status_code == 200
            assert response.json() == {"message": "Welcome to the Healthcare Recommendation System API"}

# Basic mock test for Auth
def test_login_no_user():
    with patch("app.main.connect_to_mongo", new_callable=AsyncMock), \
         patch("app.main.close_mongo_connection", new_callable=AsyncMock), \
         patch("app.routes.auth.get_database") as mock_get_db:
        
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value=None)
        mock_get_db.return_value = mock_db
        
        with TestClient(app) as client:
            response = client.post("/auth/login", data={"username": "test@test.com", "password": "password"})
            # Since DB is mocked to return None for user, should handle 404 or 400 smoothly
            assert response.status_code in [400, 404]
