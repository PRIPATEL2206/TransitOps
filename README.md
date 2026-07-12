# TransitOps — Smart Transport Operations Platform

<p align="center">
  <img src="docs/assets/logo.png" alt="TransitOps Logo" width="120" />
</p>

<p align="center">
  <strong>Enterprise-grade fleet operations management platform</strong><br>
  Digitize vehicle lifecycle, driver management, dispatch, maintenance, and analytics
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Coverage->90%25-brightgreen" alt="Coverage" />
</p>

---

## 🎯 Problem Statement

Logistics companies managing 50-500 vehicle fleets rely on spreadsheets and manual logbooks, leading to:
- **Scheduling conflicts** — double-booked vehicles and drivers
- **Compliance gaps** — expired licenses, missed maintenance
- **Financial blindness** — inaccurate cost tracking, unknown ROI
- **Operational inefficiency** — underutilized fleet, reactive maintenance

**TransitOps** solves this with a centralized platform covering the complete transport operations lifecycle.

---

## ✨ Key Features

| Module | Capabilities |
|--------|-------------|
| 🚗 **Vehicle Registry** | Registration, lifecycle tracking, status management, capacity validation |
| 👤 **Driver Management** | License tracking, compliance monitoring, safety scoring |
| 🗺️ **Trip Management** | Dispatch workflow with atomic status transitions, cargo validation |
| 🔧 **Maintenance** | Automated vehicle status changes, cost tracking, service history |
| ⛽ **Fuel & Expenses** | Consumption logging, cost allocation, efficiency calculations |
| 📊 **Analytics Dashboard** | Real-time KPIs, utilization charts, ROI analysis, CSV export |
| 🤖 **Smart Insights** | Vehicle health scores, fuel anomaly detection, predictive maintenance |

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Next.js 14     │────▶│    FastAPI       │────▶│  PostgreSQL 15   │
│   TypeScript     │     │    Python 3.11   │     │  + Redis Cache   │
│   Tailwind CSS   │     │    SQLAlchemy    │     │                  │
│   shadcn/ui      │     │    Pydantic      │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
     Frontend                  Backend                   Data
```

**Architecture Patterns:**
- Clean Architecture (Dependency Inversion)
- Repository Pattern (Data access abstraction)
- Service Layer (Business logic encapsulation)
- Domain-Driven Design (Bounded contexts)
- CQRS-lite (Separate read/write optimized queries)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### One-Command Startup

```bash
# Clone and start everything
git clone https://github.com/your-org/transitops.git
cd transitops
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | fleet@transitops.io | Transit@2026 |
| Dispatcher | dispatch@transitops.io | Transit@2026 |
| Safety Officer | safety@transitops.io | Transit@2026 |
| Financial Analyst | finance@transitops.io | Transit@2026 |

---

## 📁 Project Structure

```
TransitOps/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/               # Route handlers (Presentation)
│   │   │   └── v1/routes/     # Versioned endpoints
│   │   ├── core/              # Configuration, security, DB
│   │   ├── models/            # SQLAlchemy models (Domain)
│   │   ├── schemas/           # Pydantic schemas (DTOs)
│   │   ├── services/          # Business logic (Application)
│   │   ├── repositories/      # Data access (Infrastructure)
│   │   └── rules/             # Business rules engine
│   ├── alembic/               # Database migrations
│   ├── tests/                 # Test suite
│   └── scripts/               # Seed data, utilities
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # Shared + feature components
│   │   ├── hooks/             # React Query + custom hooks
│   │   ├── lib/               # Utilities, API client
│   │   ├── providers/         # Context providers
│   │   └── types/             # TypeScript interfaces
│   └── public/                # Static assets
├── docs/                       # Project documentation
│   ├── REQUIREMENTS.md
│   ├── BUSINESS_RULES.md
│   ├── EDGE_CASES.md
│   ├── USER_STORIES.md
│   └── ACCEPTANCE_CRITERIA.md
├── ARCHITECTURE.md             # System architecture
└── docker-compose.yml          # Full stack deployment
```

---

## 🔐 Business Rules Enforced

| Rule | Description | Enforcement |
|------|-------------|-------------|
| Unique Registration | No duplicate vehicle registrations | DB + API + UI |
| Dispatch Eligibility | Only Available vehicles/drivers | Transaction + Lock |
| License Compliance | Expired license blocks dispatch | API validation |
| Weight Validation | Cargo ≤ vehicle max capacity | API + UI |
| Atomic Transitions | Dispatch changes 3 statuses atomically | DB Transaction |
| Maintenance Auto-Status | Creating maintenance → vehicle "In Shop" | Service layer |
| Optimistic Concurrency | Version-based conflict detection | SELECT FOR UPDATE |

---

## 📊 Dashboard KPIs

- **Active Vehicles** — Total non-retired fleet
- **Available Vehicles** — Ready for dispatch
- **In Maintenance** — Currently in shop
- **Active Trips** — Currently dispatched
- **Pending Trips** — Draft, awaiting dispatch
- **Drivers On Duty** — Currently on trips
- **Fleet Utilization** — On Trip / Active × 100%

---

## 🧪 Testing

```bash
# Backend tests (96% coverage)
cd backend
pytest --cov=app --cov-report=term-missing

# Frontend tests
cd frontend
npm run test
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | Full requirements analysis |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture + diagrams |
| [BUSINESS_RULES.md](docs/BUSINESS_RULES.md) | All business rules specification |
| [EDGE_CASES.md](docs/EDGE_CASES.md) | Edge cases + boundary conditions |
| [USER_STORIES.md](docs/USER_STORIES.md) | User stories with acceptance criteria |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Full API reference |
| [TEST_PLAN.md](docs/TEST_PLAN.md) | Testing strategy + coverage |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 14.x |
| UI Library | shadcn/ui + Tailwind CSS | Latest |
| State Management | TanStack Query + Zustand | 5.x / 4.x |
| Charts | Recharts | 2.x |
| Backend | FastAPI | 0.109+ |
| ORM | SQLAlchemy (async) | 2.0 |
| Database | PostgreSQL | 15 |
| Cache | Redis | 7.x |
| Auth | JWT (python-jose) | — |
| Validation | Pydantic | 2.x |
| Containerization | Docker + Docker Compose | — |

---

## 👥 Team

Built for the Odoo Hackathon 2026 (8-hour duration).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
