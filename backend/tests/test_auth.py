"""Tests for auth endpoints."""
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import init_db

init_db()
client = TestClient(app)


def test_register():
    uid = uuid.uuid4().hex[:8]
    email = f"test_{uid}@example.com"
    response = client.post("/api/auth/register", json={
        "email": email,
        "password": "testpassword123",
        "full_name": "Test User"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert "id" in data


def test_login():
    uid = uuid.uuid4().hex[:8]
    email = f"login_{uid}@example.com"
    # Register first
    client.post("/api/auth/register", json={
        "email": email,
        "password": "testpassword123",
        "full_name": "Login Test"
    })
    # Then login
    response = client.post("/api/auth/login", json={
        "email": email,
        "password": "testpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_me():
    uid = uuid.uuid4().hex[:8]
    email = f"me_{uid}@example.com"
    # Register and login
    client.post("/api/auth/register", json={
        "email": email,
        "password": "testpassword123",
        "full_name": "Me Test"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": "testpassword123"
    })
    token = login_resp.json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email


def test_login_wrong_password():
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
