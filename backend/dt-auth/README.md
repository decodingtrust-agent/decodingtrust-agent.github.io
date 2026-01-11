# DecodingTrust Agent Auth Service

Authentication backend for DecodingTrust Agent Suite.

## Features

- User registration with email, username, and password
- JWT-based authentication (access + refresh tokens)
- Password hashing with bcrypt
- PostgreSQL database

## Quick Start

### Using Setup Script (Recommended)

```bash
./setup.sh
```

This will:
1. Create a Python virtual environment
2. Install all dependencies
3. Set up `.env` with a secure secret key
4. Create the database (if PostgreSQL is available)
5. Run migrations

Then start the server:
```bash
source venv/bin/activate
uvicorn src.app:app --reload --port 12000
```

### Using Docker

```bash
# Start PostgreSQL and the API
docker-compose up -d

# The API will be available at http://localhost:12000
```

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | Login and get tokens |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/logout` | POST | Logout (revoke refresh token) |
| `/api/v1/auth/me` | GET | Get current user (requires auth) |

### Request Examples

**Register:**
```json
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Login:**
```json
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/dt_auth` |
| `SECRET_KEY` | JWT signing key | `change-me-in-production` |
