# TransitOps — Administration Guide

## 1. System Administration

### Initial Setup

After deploying TransitOps, complete these steps:

```bash
# 1. Run database migrations
docker-compose exec backend alembic upgrade head

# 2. Create the admin user
docker-compose exec backend python scripts/create_admin.py \
  --email admin@transitops.io \
  --password "SecureP@ss2026" \
  --name "System Admin"

# 3. Seed roles (if not already present)
docker-compose exec backend python scripts/seed_roles.py

# 4. Optionally load sample data (demo/dev only)
docker-compose exec backend python scripts/seed_data.py
```

### User Management

#### Creating Users

As System Admin, create users via the API or admin panel:

```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "password": "TempP@ss123",
    "full_name": "New User",
    "role_id": "<role-uuid>"
  }'
```

#### Role Assignment

| Role | When to Assign |
|------|---------------|
| Fleet Manager | Operations leads managing vehicles and maintenance |
| Dispatcher | Staff responsible for trip creation and dispatch |
| Safety Officer | Personnel monitoring driver compliance |
| Financial Analyst | Finance team tracking costs and profitability |
| System Admin | IT staff managing the platform itself |

#### Deactivating Users

```bash
# Deactivate (soft disable - preserves audit trail)
curl -X PUT http://localhost:8000/api/v1/users/{id} \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"is_active": false}'
```

Deactivated users:
- Cannot log in
- All active tokens invalidated immediately
- Historical data (audit logs, created trips) preserved
- Can be reactivated later

---

## 2. Database Administration

### Backup Schedule

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full backup | Daily at 2:00 AM | 30 days |
| WAL archiving | Continuous | 7 days |
| Point-in-time recovery | Continuous | 7 days |

### Backup Commands

```bash
# Manual full backup
docker-compose exec postgres pg_dump -U transitops -F c transitops > backup.dump

# Restore
docker-compose exec -T postgres pg_restore -U transitops -d transitops < backup.dump

# List tables and sizes
docker-compose exec postgres psql -U transitops -c "
  SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
  FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(tablename::text) DESC;
"
```

### Database Maintenance

```bash
# Analyze and vacuum (run weekly)
docker-compose exec postgres psql -U transitops -c "VACUUM ANALYZE;"

# Reindex (run monthly or after large deletes)
docker-compose exec postgres psql -U transitops -c "REINDEX DATABASE transitops;"

# Check active connections
docker-compose exec postgres psql -U transitops -c "
  SELECT pid, usename, application_name, state, query_start
  FROM pg_stat_activity WHERE datname = 'transitops';
"
```

### Migration Management

```bash
# Check current migration version
docker-compose exec backend alembic current

# View migration history
docker-compose exec backend alembic history --verbose

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "add_column_xyz"

# Apply pending migrations
docker-compose exec backend alembic upgrade head

# Rollback last migration
docker-compose exec backend alembic downgrade -1

# Rollback to specific version
docker-compose exec backend alembic downgrade <revision_id>
```

---

## 3. Monitoring & Health Checks

### Health Endpoints

```bash
# Full health check
curl http://localhost:8000/health
# Response: {"status":"healthy","database":"connected","redis":"connected","version":"1.0.0"}

# Database only
curl http://localhost:8000/health/db

# Redis only  
curl http://localhost:8000/health/redis
```

### Log Management

```bash
# View all service logs
docker-compose logs -f --tail=100

# Backend logs only
docker-compose logs -f backend

# Filter errors
docker-compose logs backend 2>&1 | grep -i error

# Log levels (set in .env)
LOG_LEVEL=DEBUG   # Development
LOG_LEVEL=INFO    # Production (default)
LOG_LEVEL=WARNING # Minimal logging
```

### Key Metrics to Monitor

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| API response time (p95) | < 500ms | 500-1000ms | > 1000ms |
| Error rate (5xx) | < 0.1% | 0.1-1% | > 1% |
| DB connection pool | < 60% | 60-80% | > 80% |
| Disk usage | < 60% | 60-80% | > 80% |
| Memory usage | < 70% | 70-85% | > 85% |
| Redis memory | < 200MB | 200-250MB | > 250MB |

---

## 4. Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL async connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |
| `SECRET_KEY` | — | JWT signing key (min 32 chars) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24h) | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed origins |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `BCRYPT_ROUNDS` | `12` | Password hash cost factor |
| `MAX_PAGE_SIZE` | `100` | Maximum items per page |
| `RATE_LIMIT_PER_MINUTE` | `100` | API rate limit |
| `CACHE_TTL_SECONDS` | `300` | Dashboard cache TTL |

### Changing Configuration

```bash
# Edit environment file
nano .env.production

# Restart services to pick up changes
docker-compose restart backend

# For SECRET_KEY changes: all users must re-login
docker-compose restart backend frontend
```

---

## 5. Audit Log Management

### Viewing Audit Logs

```bash
# Via API (Fleet Manager or Admin only)
curl http://localhost:8000/api/v1/audit-logs?entity_type=trip&action=STATUS_CHANGE \
  -H "Authorization: Bearer <token>"

# Direct database query
docker-compose exec postgres psql -U transitops -c "
  SELECT al.created_at, u.email, al.entity_type, al.action, 
         al.old_values->>'status' as old_status,
         al.new_values->>'status' as new_status
  FROM audit_logs al JOIN users u ON al.user_id = u.id
  ORDER BY al.created_at DESC LIMIT 20;
"
```

### Audit Retention Policy

- Audit logs are **immutable** — no UPDATE or DELETE operations permitted
- Retention: 2 years minimum (configurable)
- Archival: Logs older than 6 months can be moved to cold storage
- Export: Monthly audit reports can be generated for compliance

---

## 6. Performance Tuning

### Database Optimization

```sql
-- Check slow queries (queries > 1 second)
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 second'
AND state = 'active';

-- Check index usage
SELECT relname, seq_scan, idx_scan, 
       CASE WHEN seq_scan + idx_scan > 0 
            THEN round(100.0 * idx_scan / (seq_scan + idx_scan), 1)
            ELSE 0 END AS idx_ratio
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Check table bloat
SELECT tablename, 
       pg_size_pretty(pg_total_relation_size(tablename::text)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::text) DESC;
```

### Redis Cache Management

```bash
# Check cache statistics
docker-compose exec redis redis-cli INFO stats

# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Flush cache (if stale data suspected)
docker-compose exec redis redis-cli FLUSHDB

# Monitor real-time commands (debug only)
docker-compose exec redis redis-cli MONITOR
```

### Scaling the Backend

```bash
# Scale to multiple instances (behind load balancer)
docker-compose up --scale backend=4 -d

# Each instance uses:
# - ~100MB RAM
# - 1 DB connection pool (5 connections by default)
# - Shared Redis for cache and rate limiting
```

---

## 7. Troubleshooting

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 500 errors on all requests | Database connection failed | Check PostgreSQL is running, verify DATABASE_URL |
| Login fails for all users | SECRET_KEY changed | If key rotated, all tokens are invalid — expected behavior |
| Slow dashboard | Cache expired + many records | Check Redis connectivity; consider increasing CACHE_TTL |
| "Connection refused" from frontend | Backend not running | `docker-compose up -d backend` |
| Migrations fail | Schema conflict | Check `alembic current`, resolve conflicts manually |
| Disk full | Logs or DB growing | Clean old Docker logs: `docker system prune`; archive old audit logs |

### Recovery Procedures

**Database connection issues:**
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Restart PostgreSQL
docker-compose restart postgres

# Check connection limit
docker-compose exec postgres psql -U transitops -c "SHOW max_connections;"
```

**Application crash loop:**
```bash
# Check recent logs for error
docker-compose logs --tail=50 backend

# Restart cleanly
docker-compose down
docker-compose up -d

# If migration issue, check current state
docker-compose exec backend alembic current
docker-compose exec backend alembic upgrade head
```

---

## 8. Scheduled Tasks

### Daily Tasks (Automated)

| Task | Schedule | Purpose |
|------|----------|---------|
| License expiry check | 6:00 AM | Generate notifications for expiring licenses |
| Health score calculation | 6:30 AM | Update vehicle health scores |
| Fuel anomaly detection | 7:00 AM | Flag unusual consumption patterns |
| Database VACUUM | 2:00 AM | Maintain database performance |
| Backup | 2:30 AM | Full database backup |

### Setting Up Cron Jobs

```bash
# On the host machine
crontab -e

# Add these entries:
0 2 * * * cd /opt/transitops && docker-compose exec -T postgres pg_dump -U transitops transitops | gzip > /backups/transitops_$(date +\%Y\%m\%d).sql.gz
30 2 * * * cd /opt/transitops && docker-compose exec -T postgres psql -U transitops -c "VACUUM ANALYZE;"
0 6 * * * cd /opt/transitops && docker-compose exec -T backend python scripts/check_license_expiry.py
```

---

## 9. Upgrading TransitOps

### Standard Upgrade Process

```bash
# 1. Pull latest code
cd /opt/transitops
git pull origin main

# 2. Build new images
docker-compose build

# 3. Apply database migrations
docker-compose exec backend alembic upgrade head

# 4. Restart with new images (zero-downtime with multiple instances)
docker-compose up -d --no-deps backend frontend

# 5. Verify health
curl http://localhost:8000/health

# 6. Check logs for errors
docker-compose logs --tail=20 backend
```

### Rollback

```bash
# 1. Rollback code
git checkout <previous-tag>

# 2. Rollback migration (if needed)
docker-compose exec backend alembic downgrade -1

# 3. Restart with previous version
docker-compose up --build -d
```
