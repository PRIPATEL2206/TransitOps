# TransitOps — Deployment Guide

## Deployment Architectures

### Option 1: Docker Compose (Single Server)

Best for: demos, small teams, development staging.

```
┌──────────────────────────────────────────┐
│              Single Server                 │
│                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Frontend │  │ Backend │  │   DB    │ │
│  │ (Next.js)│  │(FastAPI)│  │(Postgres)│ │
│  │  :3000   │  │  :8000  │  │  :5432  │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                           │
│  ┌─────────┐  ┌─────────┐               │
│  │  Redis  │  │  Nginx  │               │
│  │  :6379  │  │   :80   │               │
│  └─────────┘  └─────────┘               │
│                                           │
└──────────────────────────────────────────┘
```

### Option 2: Cloud Deployment (Production)

Best for: production, scalability, high availability.

```
┌──────────────────────────────────────────────────────────────┐
│                        Cloud Provider                          │
│                                                               │
│  ┌─────────────────┐                                        │
│  │  CDN / Vercel   │◄── Frontend (Next.js SSR)               │
│  └─────────────────┘                                        │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │  Load Balancer  │────►│  API Instances  │ (Auto-scale)   │
│  │                 │     │  FastAPI × 2-4  │               │
│  └─────────────────┘     └────────┬────────┘               │
│                                    │                         │
│                    ┌───────────────┼──────────────┐         │
│                    ▼               ▼              ▼         │
│           ┌──────────────┐ ┌────────────┐ ┌───────────┐   │
│           │ PostgreSQL   │ │   Redis    │ │   S3      │   │
│           │ (RDS/Cloud   │ │ (ElastiC.) │ │ (Backups) │   │
│           │  SQL)        │ │            │ │           │   │
│           └──────────────┘ └────────────┘ └───────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Docker Compose Deployment

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${API_URL:-http://localhost:8000/api/v1}
    environment:
      - NODE_ENV=production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL:-redis://redis:6379/0}
      - SECRET_KEY=${SECRET_KEY}
      - CORS_ORIGINS=${CORS_ORIGINS:-["http://localhost:3000"]}
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: transitops
      POSTGRES_USER: ${DB_USER:-transitops}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U transitops"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### Deployment Steps

```bash
# 1. Clone repository
git clone https://github.com/your-org/transitops.git
cd transitops

# 2. Create production environment
cp .env.example .env.production
nano .env.production  # Edit with production values

# 3. Generate secure secret key
echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env.production

# 4. Set database password
echo "DB_PASSWORD=$(openssl rand -base64 24)" >> .env.production

# 5. Build and deploy
docker-compose --env-file .env.production up --build -d

# 6. Run migrations
docker-compose exec backend alembic upgrade head

# 7. Create initial admin user
docker-compose exec backend python scripts/create_admin.py

# 8. Verify deployment
curl http://your-server/health
curl http://your-server/api/v1/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@transitops.io","password":"your-admin-password"}'
```

---

## Nginx Configuration

```nginx
# nginx/nginx.conf
upstream frontend {
    server frontend:3000;
}

upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name transitops.yourdomain.com;

    # Redirect to HTTPS in production
    # return 301 https://$host$request_uri;

    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for long-running exports
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Health check
    location /health {
        proxy_pass http://backend/health;
    }

    # API documentation
    location /docs {
        proxy_pass http://backend/docs;
    }

    location /redoc {
        proxy_pass http://backend/redoc;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Database Management

### Migrations

```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply all pending migrations
docker-compose exec backend alembic upgrade head

# Rollback last migration
docker-compose exec backend alembic downgrade -1

# Show migration history
docker-compose exec backend alembic history
```

### Backups

```bash
# Manual backup
docker-compose exec postgres pg_dump -U transitops transitops > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker-compose exec -T postgres psql -U transitops transitops < backup_20260712_093000.sql

# Automated daily backup (add to crontab)
0 2 * * * cd /opt/transitops && docker-compose exec -T postgres pg_dump -U transitops transitops | gzip > /backups/transitops_$(date +\%Y\%m\%d).sql.gz
```

---

## Monitoring

### Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Overall system health |
| `GET /health/db` | Database connectivity |
| `GET /health/redis` | Redis connectivity |

### Logging

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Metrics to Monitor

| Metric | Alert Threshold | Tool |
|--------|----------------|------|
| API response time (p95) | > 1000ms | Prometheus/Grafana |
| Error rate (5xx) | > 1% | Log aggregation |
| Database connections | > 80% pool | pg_stat_activity |
| Disk usage | > 80% | OS monitoring |
| Memory usage | > 85% | Docker stats |
| CPU usage | > 80% sustained | Docker stats |

---

## Security Hardening

### Production Checklist

- [ ] HTTPS enabled (TLS 1.3)
- [ ] SECRET_KEY is cryptographically random (32+ bytes)
- [ ] Database password is strong (24+ characters)
- [ ] CORS_ORIGINS restricted to actual frontend domain
- [ ] Rate limiting enabled
- [ ] Database not exposed to public internet
- [ ] Redis not exposed to public internet
- [ ] Docker images pinned to specific versions
- [ ] Non-root user in Docker containers
- [ ] Security headers configured in Nginx
- [ ] Backup encryption enabled
- [ ] Audit logs retained for 2+ years
- [ ] Dependency vulnerability scanning in CI

### Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## Scaling

### Horizontal Scaling (Backend)

```yaml
# Scale backend to 4 instances
docker-compose up --scale backend=4 -d
```

Requires session-less architecture (JWT) — already implemented.

### Database Scaling

| Scale Level | Approach |
|-------------|----------|
| 10K vehicles | Single PostgreSQL, proper indexing ✅ |
| 100K vehicles | Read replicas for analytics queries |
| 1M+ records | Table partitioning by date, connection pooling (PgBouncer) |

### Caching Strategy

| Data | Cache TTL | Invalidation |
|------|-----------|--------------|
| Dashboard KPIs | 5 minutes | On any status change |
| Vehicle list | 1 minute | On vehicle CRUD |
| Analytics charts | 15 minutes | Time-based expiry |
| User session | 24 hours | On logout/role change |

---

## Rollback Procedure

```bash
# 1. If migration failed
docker-compose exec backend alembic downgrade -1

# 2. If application update failed
docker-compose down
git checkout previous-tag
docker-compose up --build -d

# 3. If data corruption
docker-compose down
# Restore from backup
docker-compose exec -T postgres psql -U transitops transitops < latest_backup.sql
docker-compose up -d
```
