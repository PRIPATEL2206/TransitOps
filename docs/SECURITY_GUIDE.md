# TransitOps — Security Guide

## Security Architecture Overview

TransitOps implements defense-in-depth across all layers:

```
┌────────────────────────────────────────────────────────────┐
│  Layer 1: Network Security                                  │
│  • HTTPS/TLS 1.3 termination at load balancer              │
│  • Internal services not exposed to public internet         │
│  • Rate limiting at Nginx level                             │
├────────────────────────────────────────────────────────────┤
│  Layer 2: Application Security                              │
│  • JWT authentication (stateless, short-lived)              │
│  • Role-Based Access Control (RBAC)                         │
│  • Input validation (Pydantic strict mode)                  │
│  • SQL injection prevention (ORM parameterized queries)     │
├────────────────────────────────────────────────────────────┤
│  Layer 3: Data Security                                     │
│  • bcrypt password hashing (cost factor 12)                 │
│  • Sensitive fields encrypted at rest                       │
│  • Audit trail on all mutations                             │
│  • Soft delete (data preservation)                          │
├────────────────────────────────────────────────────────────┤
│  Layer 4: Infrastructure Security                           │
│  • Container isolation (non-root processes)                 │
│  • Secrets via environment variables (never in code)        │
│  • Database access restricted to backend service only       │
│  • Automated dependency vulnerability scanning              │
└────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication

### JWT Token Strategy

| Token | Purpose | Lifetime | Storage |
|-------|---------|----------|---------|
| Access Token | API authorization | 24 hours | Memory / httpOnly cookie |
| Refresh Token | Obtain new access token | 7 days | httpOnly cookie |

### Token Claims

```json
{
  "sub": "user-uuid",
  "email": "fleet@transitops.io",
  "role": "Fleet Manager",
  "permissions": ["vehicles:read", "vehicles:write", ...],
  "iat": 1720780200,
  "exp": 1720866600,
  "jti": "unique-token-id"
}
```

### Password Policy

- Minimum 8 characters
- Must contain: uppercase, lowercase, digit, special character
- Hashed with bcrypt (cost factor 12)
- Never stored in plaintext, never logged
- Password history not reusable (last 5)

### Refresh Token Rotation

```
1. Client sends refresh_token
2. Server validates and issues NEW access_token + NEW refresh_token
3. Old refresh_token is immediately invalidated
4. If old refresh_token is reused → ALL user tokens invalidated (breach detection)
```

---

## 2. Authorization (RBAC)

### Permission Matrix

| Permission | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|:-----------|:---:|:---:|:---:|:---:|
| `vehicles:read` | ✅ | ✅ | ✅ | ✅ |
| `vehicles:write` | ✅ | ❌ | ❌ | ❌ |
| `vehicles:delete` | ✅ | ❌ | ❌ | ❌ |
| `drivers:read` | ✅ | ✅ | ✅ | ✅ |
| `drivers:write` | ✅ | ❌ | ✅ | ❌ |
| `drivers:suspend` | ❌ | ❌ | ✅ | ❌ |
| `trips:read` | ✅ | ✅ | ✅ | ✅ |
| `trips:write` | ❌ | ✅ | ❌ | ❌ |
| `trips:dispatch` | ❌ | ✅ | ❌ | ❌ |
| `maintenance:read` | ✅ | ✅ | ✅ | ✅ |
| `maintenance:write` | ✅ | ❌ | ❌ | ❌ |
| `fuel_logs:read` | ✅ | ✅ | ✅ | ✅ |
| `fuel_logs:write` | ✅ | ✅ | ❌ | ❌ |
| `expenses:read` | ✅ | ✅ | ❌ | ✅ |
| `expenses:write` | ✅ | ✅ | ❌ | ✅ |
| `reports:read` | ✅ | ✅ | ✅ | ✅ |
| `reports:export` | ✅ | ❌ | ❌ | ✅ |
| `analytics:read` | ✅ | ✅ | ✅ | ✅ |
| `users:manage` | ❌ | ❌ | ❌ | ❌ |
| `audit:read` | ✅ | ❌ | ❌ | ❌ |

### Enforcement Points

```python
# Route-level (decorator pattern)
@router.post("/vehicles")
async def create_vehicle(
    data: VehicleCreate,
    current_user: User = Depends(require_permission("vehicles:write"))
):
    ...

# Service-level (for complex rules)
async def dispatch_trip(self, trip_id: UUID, user: User):
    if "trips:dispatch" not in user.permissions:
        raise InsufficientPermissions("Cannot dispatch trips")
    ...
```

---

## 3. Input Validation & Sanitization

### Validation Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend | Zod schemas | Immediate user feedback |
| API | Pydantic v2 (strict mode) | Type coercion prevention |
| Database | CHECK constraints | Last line of defense |

### Common Attack Vectors Mitigated

| Attack | Mitigation |
|--------|-----------|
| SQL Injection | SQLAlchemy ORM (parameterized queries exclusively) |
| XSS | React auto-escaping + CSP headers |
| CSRF | SameSite cookie attribute + CSRF token |
| Path Traversal | No user-controlled file paths |
| Mass Assignment | Pydantic schemas whitelist allowed fields |
| Integer Overflow | Python's arbitrary precision + DB CHECK constraints |
| JSON Bomb | Max request body size (1 MB) |

### Input Length Limits

| Field | Max Length | Rationale |
|-------|-----------|-----------|
| Email | 255 chars | RFC 5321 |
| Name | 100 chars | Practical limit |
| Registration Number | 20 chars | Standard formats |
| Description/Notes | 1000 chars | Reasonable text |
| Address fields | 200 chars | Long addresses |
| Password | 128 chars | Bcrypt limit is 72 bytes |

---

## 4. Data Protection

### Sensitive Data Classification

| Data | Classification | Protection |
|------|---------------|------------|
| Passwords | Critical | bcrypt hash, never retrievable |
| JWT tokens | High | Short expiry, httpOnly, Secure flag |
| Email addresses | PII | Stored encrypted at rest |
| Phone numbers | PII | Stored encrypted at rest |
| License numbers | PII | Access restricted by role |
| Financial data | Confidential | Role-based access, audit logged |

### Audit Trail

Every data mutation creates an immutable audit record:

```json
{
  "id": "uuid",
  "user_id": "who-performed-action",
  "entity_type": "trip",
  "entity_id": "affected-record-uuid",
  "action": "STATUS_CHANGE",
  "old_values": { "status": "Draft" },
  "new_values": { "status": "Dispatched" },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2026-07-12T10:30:00Z"
}
```

**Audit records are:**
- Append-only (no UPDATE or DELETE allowed)
- Retained for minimum 2 years
- Indexed by entity for fast retrieval
- Include IP address for forensics

---

## 5. API Security

### Rate Limiting

```python
# Per-user limits
AUTH_ENDPOINTS: 20 requests/minute (prevents brute force)
READ_ENDPOINTS: 100 requests/minute
WRITE_ENDPOINTS: 50 requests/minute
EXPORT_ENDPOINTS: 10 requests/minute (prevents abuse)
```

### Security Headers

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### CORS Configuration

```python
CORS_ORIGINS = [
    "http://localhost:3000",        # Development
    "https://transitops.domain.com" # Production
]
CORS_METHODS = ["GET", "POST", "PUT", "DELETE"]
CORS_HEADERS = ["Authorization", "Content-Type"]
CORS_CREDENTIALS = True
```

---

## 6. Infrastructure Security

### Container Security

```dockerfile
# Non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Read-only filesystem where possible
# Minimal base image (alpine)
# No SSH, no debug tools in production
```

### Secret Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| DATABASE_URL | Environment variable | On password change |
| SECRET_KEY | Environment variable | Quarterly |
| Redis password | Environment variable | Quarterly |
| API keys (future) | Vault / AWS Secrets Manager | Monthly |

**Never committed to version control:**
- `.env` files (in `.gitignore`)
- Private keys
- Database credentials
- JWT signing keys

### Network Isolation

```
Public Internet → Nginx (port 80/443 only)
                     ↓
                  Frontend (internal network)
                  Backend (internal network)
                     ↓
                  PostgreSQL (internal only, port 5432)
                  Redis (internal only, port 6379)
```

---

## 7. Incident Response

### Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| P0 | Data breach, authentication bypass | Immediate (< 1 hour) | JWT key compromised |
| P1 | Privilege escalation, data exposure | < 4 hours | User accessing other user's data |
| P2 | DoS potential, information leakage | < 24 hours | Error messages exposing internals |
| P3 | Best practice violation | Next sprint | Missing rate limit on an endpoint |

### Response Procedures

**If JWT secret is compromised:**
1. Generate new SECRET_KEY immediately
2. Deploy updated configuration
3. All existing tokens immediately invalid (users must re-login)
4. Investigate audit logs for unauthorized access
5. Notify affected users if data accessed

**If database credentials exposed:**
1. Rotate database password immediately
2. Review audit logs for unauthorized queries
3. Check for data exfiltration (unusual query patterns)
4. Update all service configurations
5. Consider data breach notification if PII accessed

---

## 8. Compliance Considerations

### Data Handling

| Regulation | Relevant Data | Compliance Measure |
|-----------|---------------|-------------------|
| Data Protection | Driver PII (name, phone, license) | Encryption, access control, deletion capability |
| Financial Records | Expenses, fuel costs | Immutable audit trail, retention policy |
| Transport Regulations | License validity, vehicle safety | Automated compliance checks, alerts |

### Right to Deletion

- Driver personal data can be anonymized on request
- Replace PII with "Deleted User" identifiers
- Maintain referential integrity for trip history
- Audit logs retained (anonymized) per legal requirement

---

## 9. Security Testing

### Automated Checks (CI/CD)

```bash
# Dependency vulnerability scan
pip-audit                    # Python dependencies
npm audit                    # Node.js dependencies

# Static analysis
bandit -r backend/app/       # Python security linter
eslint --ext .ts,.tsx src/   # TypeScript security rules

# Secret detection
detect-secrets scan          # Prevent accidental commits
```

### Manual Review Checklist

- [ ] All API endpoints require authentication
- [ ] Role checks present on every write endpoint
- [ ] No raw SQL queries (ORM only)
- [ ] No sensitive data in error messages
- [ ] Passwords not logged anywhere
- [ ] File upload restrictions (if applicable)
- [ ] Rate limiting active on all public endpoints
- [ ] HTTPS enforced in production
