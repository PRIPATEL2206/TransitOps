# TransitOps Backend API

Smart Transport Operations Platform - FastAPI Backend

## Architecture

- **Framework**: FastAPI (async)
- **Database**: PostgreSQL 15 with SQLAlchemy 2.0 (async)
- **Auth**: JWT (access + refresh tokens) via python-jose
- **Pattern**: Clean Architecture with Repository Pattern, Service Pattern, DDD, and RBAC

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app factory with middleware and routers
│   ├── core/
│   │   ├── config.py        # Settings (pydantic-settings, .env)
│   │   ├── database.py      # Async SQLAlchemy engine and session
│   │   ├── security.py      # JWT creation/verification, bcrypt hashing
│   │   ├── exceptions.py    # Custom exception hierarchy
│   │   └── middleware.py    # Request ID and audit middleware helpers
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── repositories/        # Data access layer (CRUD + domain queries)
│   ├── services/            # Business logic layer
│   ├── rules/               # Pure domain business rules
│   └── api/
│       └── v1/
│           ├── router.py    # Include all route modules
│           ├── deps.py      # FastAPI dependencies (auth, DB session, RBAC)
│           └── routes/      # Route handlers per domain
├── alembic/                 # Database migrations
├── scripts/
│   └── seed_data.py         # Development seed data
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Quick Start

### Using Docker Compose

```bash
# Start all services (API + PostgreSQL + Redis)
docker-compose up -d

# Run migrations and seed data
docker-compose --profile migrate up migrate

# View API logs
docker-compose logs -f api
```

### Local Development

```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate      # Linux/macOS
.venv\Scripts\activate         # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start PostgreSQL (or use Docker)
docker run -d \
  --name transitops_db \
  -e POSTGRES_USER=transitops \
  -e POSTGRES_PASSWORD=transitops_secret \
  -e POSTGRES_DB=transitops \
  -p 5432:5432 \
  postgres:15-alpine

# 4. Create .env file
cp .env.example .env   # edit with your values

# 5. Run database migrations
alembic upgrade head

# 6. Seed sample data
python scripts/seed_data.py

# 7. Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

Base URL: `http://localhost:8000/api/v1`

| Module        | Methods                                        |
|---------------|------------------------------------------------|
| Auth          | POST /login, /refresh, /logout, GET /me        |
| Vehicles      | CRUD + GET /available + POST /{id}/retire      |
| Drivers       | CRUD + GET /available + /expiring-licenses + POST /{id}/suspend,reinstate |
| Trips         | CRUD + POST /{id}/dispatch, /complete, /cancel |
| Maintenance   | CRUD + POST /{id}/close                        |
| Fuel Logs     | CRUD                                           |
| Expenses      | CRUD + POST /{id}/approve,reject + GET /summary |
| Analytics     | GET /dashboard, /fleet-utilization, /vehicle-roi, /driver-performance |

Interactive API docs: `http://localhost:8000/docs` (when DEBUG=true)

## Authentication

JWT Bearer tokens. Include in all requests:
```
Authorization: Bearer <access_token>
```

Demo credentials (after seeding):
- Admin: `admin@transitops.com` / `Admin@1234`
- Manager: `manager@transitops.com` / `Manager@1234`
- Dispatcher: `dispatcher@transitops.com` / `Dispatch@1234`

## Key Business Rules

- Vehicle registration numbers are unique (case-insensitive)
- Retired or In Shop vehicles cannot be dispatched
- Expired or Suspended drivers cannot be dispatched
- Driver/Vehicle already On Trip cannot be re-assigned
- Cargo weight must not exceed vehicle max capacity
- Trip dispatch atomically sets vehicle + driver to "On Trip" (SELECT FOR UPDATE)
- Trip completion atomically restores vehicle + driver to "Available" and updates odometer
- Cancelling a dispatched/in-progress trip restores vehicle + driver to "Available"
- Creating a maintenance log automatically sets vehicle to "In Shop"
- Closing a maintenance log conditionally restores vehicle to "Available" (if no remaining open logs)
- Optimistic locking via `version` column on Vehicle and Driver models

## Environment Variables

| Variable              | Default              | Description                    |
|-----------------------|----------------------|--------------------------------|
| POSTGRES_HOST         | localhost            | PostgreSQL host                |
| POSTGRES_PORT         | 5432                 | PostgreSQL port                |
| POSTGRES_USER         | transitops           | PostgreSQL user                |
| POSTGRES_PASSWORD     | transitops_secret    | PostgreSQL password            |
| POSTGRES_DB           | transitops           | Database name                  |
| REDIS_HOST            | localhost            | Redis host                     |
| REDIS_PORT            | 6379                 | Redis port                     |
| SECRET_KEY            | (auto-generated)     | JWT signing secret             |
| ACCESS_TOKEN_EXPIRE_MINUTES | 30           | Access token TTL               |
| REFRESH_TOKEN_EXPIRE_DAYS   | 7            | Refresh token TTL              |
| DEBUG                 | false                | Enable OpenAPI docs and verbose |
| LOG_LEVEL             | INFO                 | Logging level                  |

## Running Tests

```bash
pytest tests/ -v --cov=app --cov-report=term-missing
```
