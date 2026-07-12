# TransitOps — Architecture Document

## Table of Contents

1. [High Level Design](#1-high-level-design)
2. [Low Level Design](#2-low-level-design)
3. [Database ER Diagram](#3-database-er-diagram)
4. [Sequence Diagrams](#4-sequence-diagrams)
5. [Component Diagrams](#5-component-diagrams)
6. [State Transition Diagrams](#6-state-transition-diagrams)
7. [Technology Decisions & Tradeoffs](#7-technology-decisions--tradeoffs)

---

## 1. High Level Design

### System Architecture (3-Tier)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                     │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui │    │
│  │                                                                    │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │Dashboard│ │Vehicles │ │ Drivers │ │  Trips  │ │ Reports │  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │    │
│  │                                                                    │    │
│  │  State: React Query (TanStack Query) for server state caching     │    │
│  │  Auth: JWT stored in httpOnly cookie (via Next.js API route)      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / REST API
                                     │
┌────────────────────────────────────┼────────────────────────────────────┐
│                          API LAYER │                                      │
│                                    ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  FastAPI (Python 3.11+) — ASGI Server (Uvicorn)                   │   │
│  │                                                                    │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                  │   │
│  │  │   Router   │  │Middleware  │  │  Depends   │                  │   │
│  │  │  (Endpoints)│  │(Auth,CORS, │  │ (DI Layer) │                  │   │
│  │  │            │  │ Logging)   │  │            │                  │   │
│  │  └─────┬──────┘  └────────────┘  └─────┬──────┘                  │   │
│  │        │                                 │                         │   │
│  │        ▼                                 ▼                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                  │   │
│  │  │  Service   │  │  Business  │  │   Audit    │                  │   │
│  │  │   Layer    │◄─┤   Rules    │  │   Logger   │                  │   │
│  │  │            │  │   Engine   │  │            │                  │   │
│  │  └─────┬──────┘  └────────────┘  └────────────┘                  │   │
│  │        │                                                           │   │
│  │        ▼                                                           │   │
│  │  ┌────────────┐                                                   │   │
│  │  │ Repository │  (SQLAlchemy ORM / Async)                         │   │
│  │  │   Layer    │                                                   │   │
│  │  └─────┬──────┘                                                   │   │
│  │        │                                                           │   │
│  └────────┼──────────────────────────────────────────────────────────┘   │
│           │                                                               │
└───────────┼───────────────────────────────────────────────────────────────┘
            │ TCP/5432
            │
┌───────────┼───────────────────────────────────────────────────────────────┐
│           ▼          DATA LAYER                                            │
│                                                                            │
│  ┌────────────────┐      ┌────────────────┐                              │
│  │  PostgreSQL 15  │      │     Redis      │                              │
│  │                 │      │  (Cache/Queue) │                              │
│  │  • Vehicles     │      │                │                              │
│  │  • Drivers      │      │  • Dashboard   │                              │
│  │  • Trips        │      │    KPI cache   │                              │
│  │  • Maintenance  │      │  • Rate limit  │                              │
│  │  • Fuel/Expense │      │    counters    │                              │
│  │  • Audit Logs   │      │  • Session     │                              │
│  │                 │      │    blacklist   │                              │
│  └────────────────┘      └────────────────┘                              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | Next.js 14 (App Router) | SSR for SEO, API routes for BFF pattern, file-based routing |
| UI Components | shadcn/ui + Tailwind | Production-quality components, full customization, dark mode built-in |
| Backend Framework | FastAPI | Async, auto-docs (OpenAPI), Pydantic validation, Python ecosystem |
| Database | PostgreSQL 15 | ACID compliance critical for status transitions, JSONB for audit logs |
| ORM | SQLAlchemy 2.0 (async) | Mature, supports optimistic locking, excellent migration support |
| Cache | Redis | Dashboard KPI caching, rate limiting, token blacklist |
| Auth | JWT (access + refresh) | Stateless, scalable, industry standard |
| API Pattern | REST | Well-understood, tooling support, cacheable |
| Deployment | Docker Compose | Reproducible, single-command startup for hackathon demo |

### Communication Patterns

```
Frontend ──── REST/JSON ────► Backend API
Backend  ──── SQLAlchemy ───► PostgreSQL
Backend  ──── redis-py ─────► Redis
Frontend ──── WebSocket ────► Backend (future: real-time dashboard)
```

---

## 2. Low Level Design

### 2.1 Backend Layer Architecture (Clean Architecture)

```
┌──────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│                                                           │
│  app/api/v1/                                             │
│  ├── routes/                                             │
│  │   ├── auth.py          (login, refresh, logout)       │
│  │   ├── vehicles.py      (CRUD + status actions)        │
│  │   ├── drivers.py       (CRUD + compliance)            │
│  │   ├── trips.py         (CRUD + dispatch/complete)     │
│  │   ├── maintenance.py   (CRUD + close)                 │
│  │   ├── fuel_logs.py     (CRUD)                         │
│  │   ├── expenses.py      (CRUD + summary)               │
│  │   └── analytics.py     (KPIs, charts, export)         │
│  └── dependencies/                                        │
│      ├── auth.py          (get_current_user)             │
│      ├── database.py      (get_db_session)               │
│      └── permissions.py   (require_role)                 │
└──────────────────────┬───────────────────────────────────┘
                       │ Depends on
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                       │
│                                                           │
│  app/services/                                           │
│  ├── auth_service.py       (login, token management)     │
│  ├── vehicle_service.py    (business logic + rules)      │
│  ├── driver_service.py     (business logic + compliance) │
│  ├── trip_service.py       (dispatch logic + transitions)│
│  ├── maintenance_service.py (status automation)          │
│  ├── fuel_service.py       (logging + efficiency calc)   │
│  ├── expense_service.py    (categorization + totals)     │
│  ├── analytics_service.py  (KPIs + aggregations)         │
│  └── notification_service.py (alerts + emails)           │
│                                                           │
│  app/rules/                                              │
│  ├── vehicle_rules.py      (BR-V001 to BR-V008)         │
│  ├── driver_rules.py       (BR-D001 to BR-D005)         │
│  ├── trip_rules.py         (BR-T001 to BR-T005)         │
│  ├── maintenance_rules.py  (BR-M001 to BR-M004)         │
│  └── financial_rules.py    (BR-F001 to BR-F005)         │
└──────────────────────┬───────────────────────────────────┘
                       │ Depends on
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                            │
│                                                           │
│  app/models/                                             │
│  ├── user.py              (User, Role entities)          │
│  ├── vehicle.py           (Vehicle entity + status enum) │
│  ├── driver.py            (Driver entity + status enum)  │
│  ├── trip.py              (Trip entity + lifecycle enum) │
│  ├── maintenance.py       (MaintenanceLog entity)        │
│  ├── fuel_log.py          (FuelLog entity)               │
│  ├── expense.py           (Expense entity + categories)  │
│  └── audit_log.py         (AuditLog entity)              │
│                                                           │
│  app/schemas/                                            │
│  ├── vehicle_schema.py    (Pydantic request/response)    │
│  ├── driver_schema.py     (Pydantic request/response)    │
│  ├── trip_schema.py       (Pydantic request/response)    │
│  ├── maintenance_schema.py                               │
│  ├── fuel_schema.py                                      │
│  ├── expense_schema.py                                   │
│  └── analytics_schema.py                                 │
└──────────────────────┬───────────────────────────────────┘
                       │ Depends on
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                      │
│                                                           │
│  app/repositories/                                       │
│  ├── base_repository.py   (Generic CRUD operations)      │
│  ├── vehicle_repository.py (Vehicle-specific queries)    │
│  ├── driver_repository.py  (Driver-specific queries)     │
│  ├── trip_repository.py    (Trip-specific queries)       │
│  ├── maintenance_repository.py                           │
│  ├── fuel_repository.py                                  │
│  ├── expense_repository.py                               │
│  └── analytics_repository.py (Aggregation queries)       │
│                                                           │
│  app/core/                                               │
│  ├── config.py            (Settings from env vars)       │
│  ├── database.py          (Async engine + session)       │
│  ├── security.py          (JWT + bcrypt utilities)       │
│  ├── exceptions.py        (Custom exception hierarchy)   │
│  └── middleware.py        (CORS, logging, error handler) │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    PAGES (Next.js App Router)              │
│                                                           │
│  src/app/                                                │
│  ├── (auth)/                                             │
│  │   └── login/page.tsx                                  │
│  ├── (dashboard)/                                        │
│  │   ├── page.tsx              (Main dashboard)          │
│  │   ├── vehicles/                                       │
│  │   │   ├── page.tsx          (Vehicle list)            │
│  │   │   ├── [id]/page.tsx     (Vehicle detail)          │
│  │   │   └── new/page.tsx      (Create vehicle)          │
│  │   ├── drivers/                                        │
│  │   ├── trips/                                          │
│  │   ├── maintenance/                                    │
│  │   ├── fuel-logs/                                      │
│  │   ├── expenses/                                       │
│  │   └── reports/                                        │
│  └── api/                      (BFF routes)              │
│      └── auth/[...nextauth]/                             │
└──────────────────────┬───────────────────────────────────┘
                       │ Uses
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    FEATURE MODULES                         │
│                                                           │
│  src/features/                                           │
│  ├── auth/                                               │
│  │   ├── components/     (LoginForm, AuthGuard)          │
│  │   ├── hooks/          (useAuth, useUser)              │
│  │   └── api/            (authApi.ts)                    │
│  ├── vehicles/                                           │
│  │   ├── components/     (VehicleTable, VehicleForm...)  │
│  │   ├── hooks/          (useVehicles, useVehicle)       │
│  │   └── api/            (vehicleApi.ts)                 │
│  ├── drivers/                                            │
│  ├── trips/                                              │
│  ├── maintenance/                                        │
│  ├── analytics/                                          │
│  │   ├── components/     (KPICard, Charts)               │
│  │   └── hooks/          (useDashboard, useAnalytics)    │
│  └── shared/                                             │
│      ├── components/     (DataTable, StatusBadge, etc.)  │
│      ├── hooks/          (usePagination, useDebounce)    │
│      └── lib/            (api-client, formatters, utils) │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Dependency Injection Pattern

```python
# FastAPI's Depends() system serves as our DI container

# Level 1: Infrastructure dependencies
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

# Level 2: Repository dependencies
async def get_vehicle_repo(db: AsyncSession = Depends(get_db)) -> VehicleRepository:
    return VehicleRepository(db)

# Level 3: Service dependencies (with business rules)
async def get_trip_service(
    trip_repo: TripRepository = Depends(get_trip_repo),
    vehicle_repo: VehicleRepository = Depends(get_vehicle_repo),
    driver_repo: DriverRepository = Depends(get_driver_repo),
    audit_service: AuditService = Depends(get_audit_service),
) -> TripService:
    return TripService(trip_repo, vehicle_repo, driver_repo, audit_service)

# Level 4: Route handler
@router.post("/trips/{trip_id}/dispatch")
async def dispatch_trip(
    trip_id: UUID,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_user),
):
    return await service.dispatch(trip_id, current_user)
```

---

## 3. Database ER Diagram

```
┌─────────────────┐         ┌─────────────────┐
│      roles      │         │      users      │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────┤ id (PK)         │
│ name            │    1:M  │ email           │
│ permissions     │         │ password_hash   │
│ description     │         │ full_name       │
└─────────────────┘         │ role_id (FK)    │
                            │ is_active       │
                            │ last_login      │
                            │ created_at      │
                            │ updated_at      │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼─────────────────────┐
                    │ created_by     │ created_by           │ created_by
                    ▼                ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    vehicles     │    │     drivers     │    │   audit_logs    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ registration_no │    │ name            │    │ user_id (FK)    │
│ name            │    │ license_number  │    │ entity_type     │
│ type            │    │ license_category│    │ entity_id       │
│ max_load_cap    │    │ license_expiry  │    │ action          │
│ current_odometer│    │ contact_number  │    │ old_values      │
│ acquisition_cost│    │ safety_score    │    │ new_values      │
│ status          │    │ status          │    │ ip_address      │
│ region          │    │ version         │    │ created_at      │
│ version         │    │ is_deleted      │    └─────────────────┘
│ is_deleted      │    │ created_at      │
│ created_at      │    │ updated_at      │
│ updated_at      │    └────────┬────────┘
└────────┬────────┘             │
         │                      │
         │         ┌────────────┴────────────┐
         │         │                         │
         ▼         ▼                         │
┌─────────────────────────┐                  │
│         trips           │                  │
├─────────────────────────┤                  │
│ id (PK)                 │                  │
│ trip_number (UNIQUE)    │                  │
│ source                  │                  │
│ destination             │                  │
│ vehicle_id (FK) ────────┼──► vehicles.id   │
│ driver_id (FK)  ────────┼──► drivers.id    │
│ cargo_weight            │                  │
│ planned_distance        │                  │
│ actual_distance         │                  │
│ fuel_consumed           │                  │
│ final_odometer          │                  │
│ status                  │                  │
│ dispatched_at           │                  │
│ completed_at            │                  │
│ cancelled_at            │                  │
│ cancellation_reason     │                  │
│ created_by (FK) ────────┼──► users.id      │
│ created_at              │                  │
│ updated_at              │                  │
└────────┬────────────────┘                  │
         │                                   │
         │ 1:M                               │
         ▼                                   │
┌─────────────────────────┐                  │
│      fuel_logs          │                  │
├─────────────────────────┤                  │
│ id (PK)                 │                  │
│ vehicle_id (FK) ────────┼──► vehicles.id   │
│ trip_id (FK)    ────────┼──► trips.id      │
│ liters                  │                  │
│ cost                    │                  │
│ odometer_reading        │                  │
│ date                    │                  │
│ created_by (FK) ────────┼──► users.id      │
│ created_at              │                  │
└─────────────────────────┘                  │
                                             │
┌─────────────────────────┐                  │
│   maintenance_logs      │                  │
├─────────────────────────┤                  │
│ id (PK)                 │                  │
│ vehicle_id (FK) ────────┼──► vehicles.id   │
│ maintenance_type        │                  │
│ description             │                  │
│ cost                    │                  │
│ status                  │                  │
│ start_date              │                  │
│ end_date                │                  │
│ created_by (FK) ────────┼──► users.id      │
│ created_at              │                  │
│ updated_at              │                  │
└─────────────────────────┘                  │
                                             │
┌─────────────────────────┐                  │
│       expenses          │                  │
├─────────────────────────┤                  │
│ id (PK)                 │                  │
│ vehicle_id (FK) ────────┼──► vehicles.id   │
│ trip_id (FK)    ────────┼──► trips.id      │
│ category                │                  │
│ amount                  │                  │
│ description             │                  │
│ date                    │                  │
│ created_by (FK) ────────┼──► users.id      │
│ created_at              │                  │
└─────────────────────────┘                  │
                                             │
┌─────────────────────────┐                  │
│    notifications        │                  │
├─────────────────────────┤                  │
│ id (PK)                 │                  │
│ user_id (FK)    ────────┼──► users.id      │
│ type                    │                  │
│ title                   │                  │
│ message                 │                  │
│ severity                │                  │
│ is_read                 │                  │
│ entity_type             │                  │
│ entity_id              │                  │
│ created_at              │                  │
└─────────────────────────┘                  │
```

### Relationship Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| roles → users | 1:M | One role has many users |
| vehicles → trips | 1:M | One vehicle can have many trips |
| drivers → trips | 1:M | One driver can have many trips |
| vehicles → maintenance_logs | 1:M | One vehicle has many maintenance records |
| vehicles → fuel_logs | 1:M | One vehicle has many fuel entries |
| vehicles → expenses | 1:M | One vehicle can have many expenses |
| trips → fuel_logs | 1:M | One trip can have multiple fuel entries |
| trips → expenses | 1:M | One trip can have multiple expenses |
| users → audit_logs | 1:M | One user generates many audit entries |

---

## 4. Sequence Diagrams

### 4.1 Trip Dispatch Flow (Critical Path)

```
┌──────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌────────────┐    ┌────┐
│Client│    │API Router│    │TripService│    │VehicleRepo│    │DriverRepo  │    │ DB │
└──┬───┘    └────┬─────┘    └─────┬─────┘    └────┬─────┘    └─────┬──────┘    └─┬──┘
   │             │                 │                │                 │             │
   │ POST /trips/{id}/dispatch     │                │                 │             │
   │────────────►│                 │                │                 │             │
   │             │                 │                │                 │             │
   │             │ validate auth   │                │                 │             │
   │             │ check role      │                │                 │             │
   │             │                 │                │                 │             │
   │             │ dispatch(id)    │                │                 │             │
   │             │────────────────►│                │                 │             │
   │             │                 │                │                 │             │
   │             │                 │ BEGIN TRANSACTION                │             │
   │             │                 │─────────────────────────────────────────────►│
   │             │                 │                │                 │             │
   │             │                 │ get trip       │                 │             │
   │             │                 │────────────────────────────────────────────►│
   │             │                 │◄───────────────────────────────────────────│
   │             │                 │                │                 │             │
   │             │                 │ validate status = "Draft"        │             │
   │             │                 │                │                 │             │
   │             │                 │ get_with_lock(vehicle_id, version)│            │
   │             │                 │───────────────►│                 │             │
   │             │                 │                │ SELECT ... FOR UPDATE         │
   │             │                 │                │────────────────────────────►│
   │             │                 │                │◄───────────────────────────│
   │             │                 │◄──────────────│                 │             │
   │             │                 │                │                 │             │
   │             │                 │ validate vehicle.status = "Available"          │
   │             │                 │ validate cargo_weight ≤ max_capacity           │
   │             │                 │                │                 │             │
   │             │                 │ get_with_lock(driver_id, version)│             │
   │             │                 │────────────────────────────────►│             │
   │             │                 │                │                 │ SELECT...FOR│
   │             │                 │                │                 │────────────►│
   │             │                 │                │                 │◄───────────│
   │             │                 │◄───────────────────────────────│             │
   │             │                 │                │                 │             │
   │             │                 │ validate driver.status = "Available"           │
   │             │                 │ validate license_expiry > today  │             │
   │             │                 │                │                 │             │
   │             │                 │ UPDATE vehicle SET status="On Trip", ver+1     │
   │             │                 │───────────────►│                 │             │
   │             │                 │                │────────────────────────────►│
   │             │                 │                │                 │             │
   │             │                 │ UPDATE driver SET status="On Trip", ver+1      │
   │             │                 │────────────────────────────────►│             │
   │             │                 │                │                 │────────────►│
   │             │                 │                │                 │             │
   │             │                 │ UPDATE trip SET status="Dispatched"            │
   │             │                 │─────────────────────────────────────────────►│
   │             │                 │                │                 │             │
   │             │                 │ INSERT audit_log                 │             │
   │             │                 │─────────────────────────────────────────────►│
   │             │                 │                │                 │             │
   │             │                 │ COMMIT         │                 │             │
   │             │                 │─────────────────────────────────────────────►│
   │             │                 │                │                 │             │
   │             │ 200 OK (trip)   │                │                 │             │
   │             │◄────────────────│                │                 │             │
   │             │                 │                │                 │             │
   │ 200 OK      │                 │                │                 │             │
   │◄────────────│                 │                │                 │             │
```

### 4.2 Authentication Flow

```
┌──────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌────┐
│Client│    │API Router│    │AuthService│    │ Security │    │ DB │
└──┬───┘    └────┬─────┘    └─────┬─────┘    └────┬─────┘    └─┬──┘
   │             │                 │                │             │
   │ POST /auth/login              │                │             │
   │ {email, password}             │                │             │
   │────────────►│                 │                │             │
   │             │                 │                │             │
   │             │ authenticate()  │                │             │
   │             │────────────────►│                │             │
   │             │                 │                │             │
   │             │                 │ find user by email            │
   │             │                 │─────────────────────────────►│
   │             │                 │◄────────────────────────────│
   │             │                 │                │             │
   │             │                 │ verify_password│             │
   │             │                 │───────────────►│             │
   │             │                 │ bcrypt.verify  │             │
   │             │                 │◄──────────────│             │
   │             │                 │                │             │
   │             │                 │ create_tokens  │             │
   │             │                 │───────────────►│             │
   │             │                 │ JWT encode     │             │
   │             │                 │◄──────────────│             │
   │             │                 │                │             │
   │             │                 │ update last_login             │
   │             │                 │─────────────────────────────►│
   │             │                 │                │             │
   │             │ {access_token, refresh_token}    │             │
   │             │◄────────────────│                │             │
   │             │                 │                │             │
   │ 200 OK + tokens               │                │             │
   │◄────────────│                 │                │             │
```

### 4.3 Maintenance Creation Flow

```
┌──────┐    ┌───────────────┐    ┌─────────────────┐    ┌────┐
│Client│    │MaintenanceSvc │    │VehicleRepository│    │ DB │
└──┬───┘    └──────┬────────┘    └────────┬────────┘    └─┬──┘
   │               │                       │               │
   │ create({vehicle_id, type, cost})      │               │
   │──────────────►│                       │               │
   │               │                       │               │
   │               │ BEGIN TRANSACTION     │               │
   │               │───────────────────────────────────────►
   │               │                       │               │
   │               │ get vehicle           │               │
   │               │──────────────────────►│               │
   │               │                       │──────────────►│
   │               │◄──────────────────────│◄─────────────│
   │               │                       │               │
   │               │ validate: status ≠ "On Trip"          │
   │               │                       │               │
   │               │ INSERT maintenance_log│               │
   │               │───────────────────────────────────────►
   │               │                       │               │
   │               │ UPDATE vehicle SET status="In Shop"   │
   │               │──────────────────────►│               │
   │               │                       │──────────────►│
   │               │                       │               │
   │               │ INSERT audit_log      │               │
   │               │───────────────────────────────────────►
   │               │                       │               │
   │               │ COMMIT                │               │
   │               │───────────────────────────────────────►
   │               │                       │               │
   │ 201 Created   │                       │               │
   │◄──────────────│                       │               │
```

---

## 5. Component Diagrams

### 5.1 Backend Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FastAPI Application                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    MIDDLEWARE PIPELINE                         │    │
│  │                                                               │    │
│  │  Request → [CORS] → [RateLimit] → [Auth] → [Logging] → Route│    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │   Auth   │ │ Vehicle  │ │  Driver  │ │   Trip   │ │  Maint  │ │
│  │  Router  │ │  Router  │ │  Router  │ │  Router  │ │  Router │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │             │             │             │             │      │
│  ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼────┐ │
│  │   Auth   │ │ Vehicle  │ │  Driver  │ │   Trip   │ │  Maint  │ │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │             │             │             │             │      │
│       │             │             │             │             │      │
│  ┌────┴─────────────┴─────────────┴─────────────┴─────────────┴──┐ │
│  │                     BUSINESS RULES ENGINE                       │ │
│  │                                                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ Vehicle  │  │  Driver  │  │   Trip   │  │ Maintenance  │  │ │
│  │  │  Rules   │  │  Rules   │  │  Rules   │  │    Rules     │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      REPOSITORY LAYER                           │ │
│  │                                                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ Vehicle  │  │  Driver  │  │   Trip   │  │    Audit     │  │ │
│  │  │   Repo   │  │   Repo   │  │   Repo   │  │    Repo      │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      INFRASTRUCTURE                             │ │
│  │                                                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │SQLAlchemy│  │  Redis   │  │  Email   │  │  CSV/PDF     │  │ │
│  │  │  Engine  │  │  Client  │  │  Client  │  │  Generator   │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Frontend Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js Application                            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                       APP SHELL                               │    │
│  │                                                               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │    │
│  │  │  Sidebar │  │  Topbar  │  │ ThemeCtx │  │  AuthCtx   │  │    │
│  │  │Navigation│  │  Header  │  │(Dark/Lit)│  │(JWT State) │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      PAGE COMPONENTS                          │    │
│  │                                                               │    │
│  │  ┌───────────────┐   ┌───────────────┐   ┌──────────────┐  │    │
│  │  │   Dashboard   │   │  Vehicle Mgmt │   │ Driver Mgmt  │  │    │
│  │  │               │   │               │   │              │  │    │
│  │  │ • KPIGrid     │   │ • VehicleList │   │ • DriverList │  │    │
│  │  │ • ChartPanel  │   │ • VehicleForm │   │ • DriverForm │  │    │
│  │  │ • AlertFeed   │   │ • VehicleCard │   │ • Compliance │  │    │
│  │  │ • FilterBar   │   │ • StatusBadge │   │ • ScoreGauge │  │    │
│  │  └───────────────┘   └───────────────┘   └──────────────┘  │    │
│  │                                                               │    │
│  │  ┌───────────────┐   ┌───────────────┐   ┌──────────────┐  │    │
│  │  │  Trip Mgmt    │   │  Maintenance  │   │   Reports    │  │    │
│  │  │               │   │               │   │              │  │    │
│  │  │ • TripList    │   │ • MaintList   │   │ • Charts     │  │    │
│  │  │ • TripForm    │   │ • MaintForm   │   │ • DataTable  │  │    │
│  │  │ • TripTimeline│   │ • MaintClose  │   │ • ExportBtn  │  │    │
│  │  │ • DispatchBtn │   │ • VehicleLink │   │ • FilterPanel│  │    │
│  │  └───────────────┘   └───────────────┘   └──────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    SHARED COMPONENTS                           │    │
│  │                                                               │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │    │
│  │  │DataTable│ │FormField│ │  Modal  │ │  Toast  │           │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │    │
│  │  │  Badge  │ │Dropdown │ │DatePick │ │Skeleton │           │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     DATA LAYER                                │    │
│  │                                                               │    │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │  TanStack Query │  │   API Client │  │  Auth Store  │   │    │
│  │  │  (Cache/Fetch)  │  │  (Axios/Ky)  │  │   (Zustand)  │   │    │
│  │  └─────────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. State Transition Diagrams

### 6.1 Vehicle State Machine

```
                    ┌──────────────────────────────────────────┐
                    │           VEHICLE STATE MACHINE           │
                    └──────────────────────────────────────────┘

                              [Vehicle Created]
                                     │
                                     ▼
                            ┌─────────────────┐
                   ┌────────│   AVAILABLE     │◄────────────────┐
                   │        │                 │◄──────────┐     │
                   │        └────────┬────────┘           │     │
                   │                 │                     │     │
                   │    Trip         │    Maintenance      │     │
                   │  Dispatched     │    Created          │     │
                   │  [BR-T002]      │    [BR-M001]        │     │
                   │                 │                     │     │
                   │                 ▼                     │     │
                   │        ┌─────────────────┐           │     │
                   │        │    IN SHOP      │───────────┘     │
                   │        │                 │                  │
                   │        └─────────────────┘                  │
                   │         Maintenance Closed                  │
                   │         [BR-M002]                           │
                   │         (no other active maint              │
                   │          AND not Retired)                   │
                   │                                             │
                   ▼                                             │
          ┌─────────────────┐                                   │
          │    ON TRIP      │───────────────────────────────────┘
          │                 │   Trip Completed [BR-T002]
          └────────┬────────┘   OR Trip Cancelled [BR-T002]
                   │
                   │ Cannot transition directly to:
                   │ - In Shop (must complete trip first)
                   │ - Retired (must complete trip first)
                   │
                   │
          ┌────────▼────────┐
          │                 │    From Available only
          │    RETIRED      │◄── Manual action by Fleet Manager
          │   (TERMINAL)    │    [BR-V007: no active trips/maint]
          │                 │
          └─────────────────┘
          No transitions OUT of Retired

GUARDS:
  Available → On Trip:   vehicle.status == 'Available' && version check passes
  Available → In Shop:   maintenance record created for this vehicle
  Available → Retired:   no active trips, no active maintenance
  On Trip → Available:   trip completed or cancelled
  In Shop → Available:   last active maintenance closed && !retired
```

### 6.2 Driver State Machine

```
                    ┌──────────────────────────────────────────┐
                    │           DRIVER STATE MACHINE            │
                    └──────────────────────────────────────────┘

                              [Driver Created]
                                     │
                                     ▼
                            ┌─────────────────┐
               ┌────────────│   AVAILABLE     │◄────────────────┐
               │            │                 │◄──────────┐     │
               │            └────────┬────────┘           │     │
               │                     │                    │     │
               │     Trip            │    Manual          │     │
               │   Dispatched        │   (Safety Officer) │     │
               │                     │                    │     │
               ▼                     ▼                    │     │
      ┌─────────────────┐  ┌─────────────────┐           │     │
      │    ON TRIP      │  │   OFF DUTY      │───────────┘     │
      │                 │  │                 │  Manual          │
      └────────┬────────┘  └─────────────────┘  reactivation   │
               │                                                │
               │ Trip Completed                                 │
               │ OR Trip Cancelled                              │
               └────────────────────────────────────────────────┘

                            ┌─────────────────┐
               Available───►│   SUSPENDED     │
               (Safety      │                 │
                Officer     └────────┬────────┘
                action)              │
                                     │ Manual reinstatement
                                     │ (Safety Officer)
                                     │ safety_score reset to 60
                                     ▼
                            ┌─────────────────┐
                            │   AVAILABLE     │
                            └─────────────────┘

GUARDS:
  Available → On Trip:    trip dispatched with this driver
  On Trip → Available:    trip completed or cancelled
  Available → Suspended:  safety officer action (cannot if On Trip)
  Suspended → Available:  safety officer reinstatement
  Available → Off Duty:   manual toggle
  Off Duty → Available:   manual toggle

DISPATCH ELIGIBILITY:
  ALLOWED only from: Available
  BLOCKED from: On Trip, Off Duty, Suspended
  ADDITIONAL CHECK: license_expiry > CURRENT_DATE
```

### 6.3 Trip State Machine

```
                    ┌──────────────────────────────────────────┐
                    │            TRIP STATE MACHINE             │
                    └──────────────────────────────────────────┘

                              [Trip Created]
                                     │
                                     ▼
                            ┌─────────────────┐
                            │     DRAFT       │
                            │                 │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │ Dispatch       │                │ Cancel
                    │ [validates:    │                │ [no side effects]
                    │  BR-V002-004   │                │
                    │  BR-D001-003   │                │
                    │  BR-T001]      │                │
                    │                │                │
                    ▼                │                ▼
           ┌─────────────────┐      │       ┌─────────────────┐
           │   DISPATCHED    │      │       │   CANCELLED     │
           │                 │      │       │   (TERMINAL)    │
           └────────┬────────┘      │       └─────────────────┘
                    │               │
       ┌────────────┼──────────┐   │
       │ Complete   │          │   │
       │ [requires: │          │ Cancel
       │  odometer, │          │ [requires: reason]
       │  fuel]     │          │ [restores vehicle/driver]
       │            │          │
       ▼            │          ▼
┌─────────────────┐ │  ┌─────────────────┐
│   COMPLETED     │ │  │   CANCELLED     │
│   (TERMINAL)    │ │  │   (TERMINAL)    │
└─────────────────┘ │  └─────────────────┘
                    │
                    │
                    │ NOTE: No transitions FROM
                    │ Completed or Cancelled
                    │ (these are terminal states)
                    │

DISPATCH SIDE EFFECTS:
  • vehicle.status = "On Trip"
  • driver.status = "On Trip"
  • trip.dispatched_at = NOW()

COMPLETE SIDE EFFECTS:
  • vehicle.status = "Available"
  • vehicle.current_odometer = final_odometer
  • driver.status = "Available"
  • trip.completed_at = NOW()
  • auto-create fuel_log if fuel_consumed > 0

CANCEL (from Dispatched) SIDE EFFECTS:
  • vehicle.status = "Available"
  • driver.status = "Available"
  • trip.cancelled_at = NOW()
  • trip.cancellation_reason = provided reason

CANCEL (from Draft) SIDE EFFECTS:
  • trip.cancelled_at = NOW()
  • (no vehicle/driver changes — they weren't locked)
```

### 6.4 Maintenance State Machine

```
                    ┌──────────────────────────────────────────┐
                    │       MAINTENANCE STATE MACHINE           │
                    └──────────────────────────────────────────┘

                        [Maintenance Record Created]
                        [PRECONDITION: vehicle ≠ On Trip]
                                     │
                                     │ Side effect:
                                     │ vehicle.status = "In Shop"
                                     ▼
                            ┌─────────────────┐
                            │     ACTIVE      │
                            │                 │
                            └────────┬────────┘
                                     │
                                     │ Close action
                                     │ [auto-set end_date = today if null]
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   COMPLETED     │
                            │   (TERMINAL)    │
                            └─────────────────┘
                                     │
                                     │ Side effect (conditional):
                                     │ IF no other active maintenance for vehicle
                                     │   AND vehicle.status ≠ "Retired"
                                     │ THEN vehicle.status = "Available"
                                     │ ELSE keep current status
```

---

## 7. Technology Decisions & Tradeoffs

### 7.1 Why FastAPI over Django/Flask

| Factor | FastAPI | Django REST | Flask |
|--------|---------|-------------|-------|
| Async support | Native | Partial (3.1+) | Extension |
| Auto-documentation | Built-in OpenAPI | drf-spectacular | Manual |
| Validation | Pydantic (fast, typed) | Serializers | Manual/Marshmallow |
| Performance | High (Starlette/ASGI) | Moderate (WSGI) | Moderate |
| Learning curve | Low | High | Low |
| Type safety | Excellent | Moderate | Poor |
| Hackathon speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**Decision:** FastAPI — best balance of developer speed, runtime performance, and type safety for a hackathon.

### 7.2 Why Next.js over Vite+React

| Factor | Next.js | Vite+React |
|--------|---------|------------|
| Routing | File-based (zero config) | Manual (react-router) |
| SSR/SSG | Built-in | Additional setup |
| API routes | Built-in BFF pattern | Separate server needed |
| Auth handling | Middleware + API routes | Client-only |
| Build optimization | Automatic | Manual configuration |
| Deployment | Vercel one-click | More setup |

**Decision:** Next.js App Router — file-based routing and built-in API routes accelerate development; SSR gives instant perceived performance.

### 7.3 Why PostgreSQL over MySQL/SQLite

| Factor | PostgreSQL | MySQL | SQLite |
|--------|-----------|-------|--------|
| JSONB (audit logs) | Native, indexed | JSON (no index) | No |
| Enum types | Native | ENUM | No |
| Partial indexes | Yes | No | Partial |
| Row-level locking | MVCC (excellent) | InnoDB | File-level |
| Concurrent writes | Excellent | Good | Poor |
| GIS extensions | PostGIS | Limited | No |

**Decision:** PostgreSQL — JSONB for audit logs, native enums for status fields, excellent concurrency for dispatch operations.

### 7.4 Tradeoffs Accepted

| Tradeoff | Accepted Limitation | Reasoning |
|----------|-------------------|-----------|
| No WebSocket real-time | Dashboard refreshes on interval | Reduces complexity; real-time nice-to-have |
| No microservices | Monolithic backend | Appropriate for team size and hackathon timeline |
| No message queue | Synchronous processing | Simpler debugging; async can be added later |
| Single currency (INR) | No multi-currency | Reduces scope; 90% of use cases covered |
| No file uploads v1 | Document management deferred | Focus on core workflow first |
| Redis optional | Falls back to in-memory cache | Works without Redis for demo; Redis for production |

### 7.5 Future Roadmap (Post-Hackathon)

```
Phase 2 (Month 2):
├── WebSocket real-time dashboard updates
├── Document upload (insurance, registration certs)
├── PDF report generation
└── Email notification service (SendGrid/SES)

Phase 3 (Month 3):
├── Mobile responsive progressive web app (PWA)
├── Route optimization (Google Maps API)
├── GPS tracking integration
└── Multi-tenant architecture

Phase 4 (Month 4):
├── Machine learning: predictive maintenance model
├── Multi-currency support
├── Bulk operations (CSV import)
└── Advanced RBAC (field-level permissions)
```
