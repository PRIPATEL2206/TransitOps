# TransitOps — Installation Guide

## Prerequisites

### Required Software

| Software | Version | Purpose | Download |
|----------|---------|---------|----------|
| Docker Desktop | 4.x+ | Container runtime | [docker.com](https://docker.com) |
| Docker Compose | 2.x+ | Multi-container orchestration | Included with Docker Desktop |
| Node.js | 18.17+ | Frontend development | [nodejs.org](https://nodejs.org) |
| Python | 3.11+ | Backend development | [python.org](https://python.org) |
| PostgreSQL | 15+ | Database (if running locally) | [postgresql.org](https://postgresql.org) |
| Git | 2.x+ | Version control | [git-scm.com](https://git-scm.com) |

### Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 2 GB free | 5 GB free |
| Network | Internet (for package downloads) | — |

---

## Installation Methods

### Method 1: Docker Compose (Recommended for Demo)

This is the fastest way to get the full system running.

```bash
# 1. Clone the repository
git clone https://github.com/your-org/transitops.git
cd transitops

# 2. Create environment file
cp .env.example .env

# 3. Build and start all services
docker-compose up --build -d

# 4. Run database migrations
docker-compose exec backend alembic upgrade head

# 5. Seed sample data
docker-compose exec backend python scripts/seed_data.py

# 6. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs (Swagger): http://localhost:8000/docs
# API Docs (ReDoc): http://localhost:8000/redoc
```

**Stopping the system:**
```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop + remove volumes (reset data)
```

---

### Method 2: Local Development Setup

For active development with hot-reload.

#### Step 1: Database Setup

```bash
# Option A: Use Docker for just PostgreSQL + Redis
docker-compose up postgres redis -d

# Option B: Install PostgreSQL locally
# Create database
createdb transitops
createuser transitops_user -P  # Set password: transitops_pass
```

#### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (create .env in backend/)
cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://transitops_user:transitops_pass@localhost:5432/transitops
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:3000"]
EOF

# Run database migrations
alembic upgrade head

# Seed sample data
python scripts/seed_data.py

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables (create .env.local)
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
EOF

# Start development server
npm run dev

# Access: http://localhost:3000
```

---

### Method 3: Production Deployment

```bash
# 1. Set production environment variables
export DATABASE_URL=postgresql+asyncpg://user:pass@prod-db:5432/transitops
export REDIS_URL=redis://prod-redis:6379/0
export SECRET_KEY=$(openssl rand -hex 32)
export CORS_ORIGINS='["https://transitops.yourdomain.com"]'

# 2. Build production images
docker-compose -f docker-compose.prod.yml build

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (asyncpg) |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection string |
| `SECRET_KEY` | Yes | — | JWT signing key (min 32 characters) |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` | Access token TTL (24h) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token TTL |
| `CORS_ORIGINS` | No | `["http://localhost:3000"]` | Allowed origins (JSON array) |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `BCRYPT_ROUNDS` | No | `12` | Password hash cost factor |

### Frontend (.env.local)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | — | Backend API base URL |

---

## Verification Steps

After installation, verify the system is working:

```bash
# 1. Check backend health
curl http://localhost:8000/health
# Expected: {"status": "healthy", "database": "connected", "redis": "connected"}

# 2. Check API docs load
# Open: http://localhost:8000/docs

# 3. Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "fleet@transitops.io", "password": "Transit@2026"}'
# Expected: {"access_token": "...", "refresh_token": "...", "token_type": "bearer"}

# 4. Check frontend loads
# Open: http://localhost:3000
# Expected: Login page renders

# 5. Verify sample data
curl http://localhost:8000/api/v1/vehicles \
  -H "Authorization: Bearer <token_from_step_3>"
# Expected: List of seeded vehicles
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `connection refused :5432` | PostgreSQL not running | `docker-compose up postgres -d` |
| `relation does not exist` | Migrations not run | `alembic upgrade head` |
| `CORS error in browser` | Origin not in allowed list | Add frontend URL to `CORS_ORIGINS` |
| `401 Unauthorized` | Token expired or invalid | Re-login, check `SECRET_KEY` matches |
| `npm install` fails | Node version too old | Update to Node 18+ |
| Port already in use | Another service on port | Change port in `.env` or stop other service |
| `docker build` fails | Insufficient disk space | `docker system prune` |

### Reset Everything

```bash
# Nuclear option: reset all data and rebuild
docker-compose down -v
docker system prune -af
docker-compose up --build -d
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed_data.py
```
