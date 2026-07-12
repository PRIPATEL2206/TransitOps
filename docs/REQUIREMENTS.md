# TransitOps — Requirements Analysis

## 1. Requirement Analysis

### 1.1 Problem Domain

Logistics companies operating vehicle fleets face critical operational challenges:

| Problem | Business Impact |
|---------|----------------|
| Manual spreadsheet tracking | Data inconsistency, version conflicts |
| No scheduling validation | Double-booking vehicles/drivers |
| Missed maintenance windows | Vehicle breakdowns, safety violations |
| Expired license oversight | Legal liability, regulatory fines |
| No cost visibility | Budget overruns, unprofitable routes |
| Fragmented data | Poor decision-making, no forecasting |

### 1.2 Solution Scope

TransitOps is a centralized transport operations platform covering:

1. **Asset Management** — Vehicle registry with lifecycle tracking
2. **Personnel Management** — Driver profiles with compliance monitoring
3. **Operations** — Trip creation, dispatch, and completion workflows
4. **Maintenance** — Scheduled and unscheduled maintenance tracking
5. **Financial** — Fuel logging, expense tracking, cost allocation
6. **Analytics** — KPIs, utilization metrics, and predictive insights

### 1.3 Stakeholder Analysis

| Stakeholder | Primary Concern | Key Interactions |
|-------------|----------------|------------------|
| Fleet Manager | Asset utilization, cost control | Vehicles, Maintenance, Reports |
| Dispatcher | Trip scheduling, resource allocation | Trips, Vehicles, Drivers |
| Safety Officer | Compliance, driver fitness | Drivers, Licenses, Safety Scores |
| Financial Analyst | Cost tracking, profitability | Expenses, Fuel, ROI Reports |
| System Admin | User management, access control | Users, Roles, Audit Logs |

---

## 2. Functional Requirements

### FR-01: Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01.1 | Email + password login with secure session management | P0 |
| FR-01.2 | Role-Based Access Control (RBAC) with granular permissions | P0 |
| FR-01.3 | Session expiry and token refresh mechanism | P0 |
| FR-01.4 | Protected routes — unauthenticated users redirected to login | P0 |
| FR-01.5 | Password reset flow via email | P1 |
| FR-01.6 | Audit trail for authentication events | P1 |

### FR-02: Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-02.1 | Display real-time KPI cards: Active Vehicles, Available Vehicles, In Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization % | P0 |
| FR-02.2 | Filter by vehicle type, status, region | P0 |
| FR-02.3 | Visual charts: utilization trends, cost breakdown, trip status distribution | P1 |
| FR-02.4 | Auto-refresh data at configurable intervals | P2 |

### FR-03: Vehicle Registry

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-03.1 | CRUD operations on vehicle records | P0 |
| FR-03.2 | Fields: Registration Number (unique), Name/Model, Type, Max Load Capacity (kg), Odometer (km), Acquisition Cost, Status | P0 |
| FR-03.3 | Status enum: Available, On Trip, In Shop, Retired | P0 |
| FR-03.4 | Prevent duplicate registration numbers (DB constraint + API validation) | P0 |
| FR-03.5 | Vehicle type categorization (Truck, Van, Sedan, Bus) | P0 |
| FR-03.6 | Search, filter, sort on all fields | P1 |
| FR-03.7 | Vehicle document attachment (insurance, registration cert) | P2 |

### FR-04: Driver Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-04.1 | CRUD operations on driver profiles | P0 |
| FR-04.2 | Fields: Name, License Number, License Category, License Expiry Date, Contact Number, Safety Score, Status | P0 |
| FR-04.3 | Status enum: Available, On Trip, Off Duty, Suspended | P0 |
| FR-04.4 | License expiry tracking with visual warnings | P0 |
| FR-04.5 | Safety Score calculation (0-100 scale) | P1 |
| FR-04.6 | License expiry email reminders (30, 14, 7 days before) | P2 |

### FR-05: Trip Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05.1 | Create trip: source, destination, vehicle, driver, cargo weight, planned distance | P0 |
| FR-05.2 | Trip lifecycle: Draft → Dispatched → Completed → Cancelled | P0 |
| FR-05.3 | Validate cargo weight ≤ vehicle max capacity before dispatch | P0 |
| FR-05.4 | Only show Available vehicles and drivers in selection dropdowns | P0 |
| FR-05.5 | Auto-transition vehicle/driver status on dispatch/complete/cancel | P0 |
| FR-05.6 | Record actual distance, fuel consumed, and final odometer on completion | P0 |
| FR-05.7 | Trip cost calculation (fuel + tolls + other expenses) | P1 |

### FR-06: Maintenance Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-06.1 | Create maintenance records linked to vehicles | P0 |
| FR-06.2 | Auto-change vehicle status to "In Shop" on active maintenance creation | P0 |
| FR-06.3 | Restore vehicle to "Available" when maintenance is closed (unless Retired) | P0 |
| FR-06.4 | Track maintenance type, cost, start/end dates, description | P0 |
| FR-06.5 | Maintenance history per vehicle | P1 |

### FR-07: Fuel & Expense Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-07.1 | Record fuel logs: vehicle, liters, cost, date, odometer reading | P0 |
| FR-07.2 | Record general expenses: tolls, repairs, misc | P0 |
| FR-07.3 | Auto-compute total operational cost per vehicle (Fuel + Maintenance) | P0 |
| FR-07.4 | Expense categorization and tagging | P1 |

### FR-08: Reports & Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-08.1 | Fuel Efficiency = Distance / Fuel Consumed (km/L) | P0 |
| FR-08.2 | Fleet Utilization = On Trip Vehicles / Total Active Vehicles × 100 | P0 |
| FR-08.3 | Operational Cost per vehicle | P0 |
| FR-08.4 | Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost | P0 |
| FR-08.5 | CSV export of reports | P0 |
| FR-08.6 | PDF export of reports | P2 |

---

## 3. Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-01 | Performance | Dashboard load time | < 2 seconds |
| NFR-02 | Performance | API response time (95th percentile) | < 500ms |
| NFR-03 | Scalability | Support concurrent users | 50+ simultaneous |
| NFR-04 | Scalability | Vehicle registry capacity | 10,000+ vehicles |
| NFR-05 | Security | Password hashing | bcrypt with salt rounds ≥ 12 |
| NFR-06 | Security | JWT token expiry | 24 hours access, 7 days refresh |
| NFR-07 | Security | Input sanitization | All user inputs validated |
| NFR-08 | Availability | System uptime target | 99.5% |
| NFR-09 | Usability | Mobile responsive | All screens usable on 375px+ |
| NFR-10 | Usability | Dark mode support | System preference detection |
| NFR-11 | Accessibility | WCAG compliance | Level AA |
| NFR-12 | Maintainability | Test coverage | > 90% |
| NFR-13 | Data Integrity | Transaction isolation | Serializable for status transitions |
| NFR-14 | Audit | All mutations logged | User, timestamp, before/after |

---

## 4. Implicit Requirements

These are not explicitly stated but are necessary for a production-grade system:

| ID | Requirement | Rationale |
|----|-------------|-----------|
| IR-01 | Optimistic locking on vehicle/driver status changes | Prevent race conditions when two dispatchers try to assign the same vehicle |
| IR-02 | Pagination on all list endpoints | Performance with large datasets |
| IR-03 | Soft delete for vehicles and drivers | Maintain referential integrity for historical trips |
| IR-04 | Timezone-aware timestamps | Fleet operations may span multiple timezones |
| IR-05 | Idempotent status transitions | Network retries should not corrupt state |
| IR-06 | Database migrations versioning | Reproducible deployments |
| IR-07 | Request rate limiting | Prevent abuse, ensure fair usage |
| IR-08 | Input length limits | Prevent payload attacks |
| IR-09 | Graceful error messages | Never expose stack traces to clients |
| IR-10 | Data export GDPR compliance | Driver personal data handling |
| IR-11 | Odometer validation (monotonically increasing) | Prevent data entry errors |
| IR-12 | Vehicle cannot be retired while On Trip | Must complete trip first |

---

## 5. Edge Cases

### Vehicle Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| V-1 | Two users try to dispatch the same vehicle simultaneously | First succeeds, second gets 409 Conflict with "Vehicle already on trip" |
| V-2 | Vehicle status changed to Retired while maintenance is active | Reject: must close maintenance first |
| V-3 | Odometer reading submitted lower than previous | Reject with validation error |
| V-4 | Vehicle registration number with special characters | Allow alphanumeric + hyphens only |
| V-5 | Deleting a vehicle with active trip history | Soft delete only; preserve historical data |
| V-6 | Maximum load capacity set to 0 or negative | Reject: must be positive integer |
| V-7 | Vehicle type changed while On Trip | Reject: cannot modify while active |

### Driver Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| D-1 | Driver's license expires during an active trip | Allow trip completion; flag in alerts |
| D-2 | Two dispatchers assign same driver simultaneously | First succeeds, second gets 409 Conflict |
| D-3 | Driver status changed to Suspended while On Trip | Reject: must complete or reassign trip first |
| D-4 | License expiry date set in the past during registration | Allow (they may be registering existing records) but mark as expired |
| D-5 | Driver with zero completed trips has undefined safety score | Default safety score = 100 (no incidents) |
| D-6 | Contact number format varies by country | Accept with flexible validation, store E.164 |

### Trip Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| T-1 | Cargo weight exactly equals max capacity | Allow (boundary is inclusive: weight ≤ max) |
| T-2 | Trip cancelled after partial delivery | Restore vehicle/driver to Available; log partial |
| T-3 | Trip created with source = destination | Reject: source and destination must differ |
| T-4 | Fuel consumed entered as 0 on completion | Allow (electric vehicle or tow scenario) |
| T-5 | Trip distance is 0 or negative | Reject: planned distance must be > 0 |
| T-6 | Multiple trips in Draft for same vehicle | Allow: only dispatched trips lock the vehicle |
| T-7 | Completing a trip that was never dispatched | Reject: must follow lifecycle Draft → Dispatched → Completed |

### Maintenance Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| M-1 | Maintenance created for vehicle already In Shop | Allow: multiple maintenance records can exist |
| M-2 | All maintenance records closed but vehicle was Retired | Keep status as Retired (retirement overrides) |
| M-3 | Maintenance end date before start date | Reject with validation error |
| M-4 | Maintenance cost is 0 | Allow (warranty-covered repairs) |

### Financial Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| F-1 | Fuel log with 0 liters | Reject: must be positive |
| F-2 | Expense without associated vehicle | Allow (general fleet expenses) |
| F-3 | ROI calculation when acquisition cost is 0 | Return infinity indicator or exclude from reports |
| F-4 | Fuel efficiency when fuel consumed is 0 | Return N/A instead of division by zero |

---

## 6. Business Validations

### Critical Business Rules (Must Never Be Violated)

```
RULE BR-001: Vehicle Registration Uniqueness
  WHEN creating or updating vehicle
  THEN registration_number MUST be unique across all non-deleted vehicles
  ENFORCE AT: Database constraint + API validation layer

RULE BR-002: Dispatch Vehicle Eligibility
  WHEN selecting vehicle for trip dispatch
  THEN vehicle.status MUST be "Available"
  REJECT IF: status IN ("On Trip", "In Shop", "Retired")

RULE BR-003: Dispatch Driver Eligibility
  WHEN selecting driver for trip dispatch
  THEN driver.status MUST be "Available"
  AND driver.license_expiry > CURRENT_DATE
  REJECT IF: status IN ("On Trip", "Off Duty", "Suspended")
  REJECT IF: license_expiry <= CURRENT_DATE

RULE BR-004: Cargo Weight Validation
  WHEN dispatching trip
  THEN trip.cargo_weight MUST be <= vehicle.max_load_capacity
  REJECT IF: cargo_weight > max_load_capacity

RULE BR-005: Dispatch Status Transition
  WHEN trip transitions from Draft to Dispatched
  THEN SET vehicle.status = "On Trip"
  AND SET driver.status = "On Trip"

RULE BR-006: Completion Status Transition
  WHEN trip transitions from Dispatched to Completed
  THEN SET vehicle.status = "Available"
  AND SET driver.status = "Available"
  AND UPDATE vehicle.odometer = trip.final_odometer

RULE BR-007: Cancellation Status Restoration
  WHEN trip transitions from Dispatched to Cancelled
  THEN SET vehicle.status = "Available"
  AND SET driver.status = "Available"

RULE BR-008: Maintenance Auto-Status
  WHEN maintenance record created with status "Active"
  THEN SET vehicle.status = "In Shop"

RULE BR-009: Maintenance Closure
  WHEN maintenance record closed
  IF vehicle has no other active maintenance records
  AND vehicle.status != "Retired"
  THEN SET vehicle.status = "Available"

RULE BR-010: Trip Lifecycle Enforcement
  VALID TRANSITIONS:
    Draft → Dispatched (requires validation of BR-002, BR-003, BR-004)
    Draft → Cancelled (no side effects)
    Dispatched → Completed (requires final_odometer, fuel_consumed)
    Dispatched → Cancelled (triggers BR-007)
  INVALID: Any other transition
```

---

## 7. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Race condition on vehicle/driver assignment | High | High | Optimistic locking with version column; DB-level serializable transaction |
| Data inconsistency after failed status transition | Medium | Critical | Wrap all status changes in atomic transactions; rollback on partial failure |
| Unauthorized access to financial data | Medium | High | RBAC enforcement at API layer; field-level access control |
| License expiry missed | High | Medium | Automated daily job checking expiry; push notifications 30/14/7 days out |
| Fuel data manipulation | Low | Medium | Audit log on all fuel entries; anomaly detection on consumption patterns |
| System overload during peak dispatch hours | Medium | Medium | Database connection pooling; query optimization; caching for dashboard |
| Single point of failure on auth | Low | Critical | Stateless JWT; no session server dependency |
| Data loss | Low | Critical | Automated backups; point-in-time recovery; WAL-level replication |

---

## 8. User Personas

### Persona 1: Rajesh Kumar — Fleet Manager

- **Age:** 42 | **Experience:** 15 years in logistics
- **Tech Comfort:** Moderate; uses Excel daily, comfortable with web apps
- **Goals:** Maximize fleet utilization, minimize downtime, control costs
- **Pain Points:** Currently manages 200 vehicles on 3 different spreadsheets; loses track of maintenance schedules
- **Key Workflows:** Morning dashboard review → identify idle vehicles → check upcoming maintenance → review cost reports
- **Success Metric:** Fleet utilization > 80%, maintenance compliance 100%

### Persona 2: Priya Sharma — Dispatcher

- **Age:** 28 | **Experience:** 3 years in dispatch operations
- **Tech Comfort:** High; uses multiple SaaS tools
- **Goals:** Assign trips quickly without scheduling conflicts
- **Pain Points:** Has accidentally double-booked drivers; cargo weight violations caught too late
- **Key Workflows:** Receive trip request → select vehicle (check capacity) → select driver (check availability) → dispatch
- **Success Metric:** Zero double-bookings, 100% on-time dispatch

### Persona 3: Amit Patel — Safety Officer

- **Age:** 35 | **Experience:** 8 years in transport safety
- **Tech Comfort:** Moderate
- **Goals:** Ensure all drivers have valid licenses; monitor safety compliance
- **Pain Points:** No automated alerts for expiring licenses; manual tracking of incidents
- **Key Workflows:** Review driver compliance dashboard → check expiring licenses → flag suspended drivers → review safety scores
- **Success Metric:** Zero expired-license dispatches, safety score improvement trend

### Persona 4: Meera Desai — Financial Analyst

- **Age:** 31 | **Experience:** 5 years in operations finance
- **Tech Comfort:** High; power Excel user, familiar with BI tools
- **Goals:** Track operational costs, identify unprofitable routes, optimize fuel spend
- **Pain Points:** Data scattered across systems; manual cost allocation takes days
- **Key Workflows:** Monthly cost review → per-vehicle ROI analysis → fuel trend identification → generate export for management
- **Success Metric:** Cost visibility within 24 hours, fuel waste reduced 10%

---

## 9. Database Design

### Entity Relationship Summary

```
Users ──────── Roles (M:1)
Vehicles ───── Trips (1:M)
Vehicles ───── MaintenanceLogs (1:M)
Vehicles ───── FuelLogs (1:M)
Vehicles ───── Expenses (1:M)
Drivers ────── Trips (1:M)
Trips ─────── FuelLogs (1:M)
Trips ─────── Expenses (1:M)
```

### Table Definitions

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(100) | NOT NULL |
| role_id | UUID | FK → roles.id |
| is_active | BOOLEAN | DEFAULT true |
| last_login | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### roles
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(50) | UNIQUE, NOT NULL |
| permissions | JSONB | NOT NULL |
| description | TEXT | NULLABLE |

#### vehicles
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| registration_number | VARCHAR(20) | UNIQUE, NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| type | ENUM | ('Truck','Van','Sedan','Bus') |
| max_load_capacity | DECIMAL(10,2) | NOT NULL, CHECK > 0 |
| current_odometer | DECIMAL(12,2) | DEFAULT 0, CHECK >= 0 |
| acquisition_cost | DECIMAL(12,2) | NOT NULL, CHECK >= 0 |
| status | ENUM | ('Available','On Trip','In Shop','Retired') |
| region | VARCHAR(50) | NULLABLE |
| version | INTEGER | DEFAULT 1 (optimistic lock) |
| is_deleted | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### drivers
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| license_number | VARCHAR(50) | UNIQUE, NOT NULL |
| license_category | VARCHAR(20) | NOT NULL |
| license_expiry | DATE | NOT NULL |
| contact_number | VARCHAR(20) | NOT NULL |
| safety_score | DECIMAL(5,2) | DEFAULT 100.00, CHECK 0-100 |
| status | ENUM | ('Available','On Trip','Off Duty','Suspended') |
| version | INTEGER | DEFAULT 1 (optimistic lock) |
| is_deleted | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### trips
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| trip_number | VARCHAR(20) | UNIQUE, auto-generated |
| source | VARCHAR(200) | NOT NULL |
| destination | VARCHAR(200) | NOT NULL |
| vehicle_id | UUID | FK → vehicles.id |
| driver_id | UUID | FK → drivers.id |
| cargo_weight | DECIMAL(10,2) | NOT NULL, CHECK > 0 |
| planned_distance | DECIMAL(10,2) | NOT NULL, CHECK > 0 |
| actual_distance | DECIMAL(10,2) | NULLABLE |
| fuel_consumed | DECIMAL(10,2) | NULLABLE |
| final_odometer | DECIMAL(12,2) | NULLABLE |
| status | ENUM | ('Draft','Dispatched','Completed','Cancelled') |
| dispatched_at | TIMESTAMP | NULLABLE |
| completed_at | TIMESTAMP | NULLABLE |
| cancelled_at | TIMESTAMP | NULLABLE |
| cancellation_reason | TEXT | NULLABLE |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### maintenance_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| vehicle_id | UUID | FK → vehicles.id, NOT NULL |
| maintenance_type | VARCHAR(50) | NOT NULL |
| description | TEXT | NULLABLE |
| cost | DECIMAL(10,2) | DEFAULT 0, CHECK >= 0 |
| status | ENUM | ('Active','Completed') |
| start_date | DATE | NOT NULL |
| end_date | DATE | NULLABLE |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### fuel_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| vehicle_id | UUID | FK → vehicles.id, NOT NULL |
| trip_id | UUID | FK → trips.id, NULLABLE |
| liters | DECIMAL(8,2) | NOT NULL, CHECK > 0 |
| cost | DECIMAL(10,2) | NOT NULL, CHECK > 0 |
| odometer_reading | DECIMAL(12,2) | NOT NULL |
| date | DATE | NOT NULL |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### expenses
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| vehicle_id | UUID | FK → vehicles.id, NULLABLE |
| trip_id | UUID | FK → trips.id, NULLABLE |
| category | ENUM | ('Fuel','Maintenance','Toll','Insurance','Other') |
| amount | DECIMAL(10,2) | NOT NULL, CHECK > 0 |
| description | TEXT | NULLABLE |
| date | DATE | NOT NULL |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### audit_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | UUID | NOT NULL |
| action | ENUM | ('CREATE','UPDATE','DELETE','STATUS_CHANGE') |
| old_values | JSONB | NULLABLE |
| new_values | JSONB | NULLABLE |
| ip_address | VARCHAR(45) | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Indexes

```sql
CREATE INDEX idx_vehicles_status ON vehicles(status) WHERE is_deleted = false;
CREATE INDEX idx_vehicles_type ON vehicles(type) WHERE is_deleted = false;
CREATE INDEX idx_drivers_status ON drivers(status) WHERE is_deleted = false;
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_created_at ON trips(created_at);
CREATE INDEX idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

---

## 10. API Design

### Base URL: `/api/v1`

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Authenticate user, return JWT |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Invalidate refresh token |
| GET | /auth/me | Get current user profile |

### Vehicle Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /vehicles | List vehicles (paginated, filtered) | Fleet Manager, Dispatcher |
| POST | /vehicles | Create vehicle | Fleet Manager |
| GET | /vehicles/{id} | Get vehicle details | All authenticated |
| PUT | /vehicles/{id} | Update vehicle | Fleet Manager |
| DELETE | /vehicles/{id} | Soft-delete vehicle | Fleet Manager |
| GET | /vehicles/{id}/history | Vehicle trip/maintenance history | Fleet Manager |
| GET | /vehicles/available | List available for dispatch | Dispatcher |

### Driver Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /drivers | List drivers (paginated, filtered) | All authenticated |
| POST | /drivers | Create driver | Fleet Manager, Safety Officer |
| GET | /drivers/{id} | Get driver details | All authenticated |
| PUT | /drivers/{id} | Update driver | Fleet Manager, Safety Officer |
| DELETE | /drivers/{id} | Soft-delete driver | Fleet Manager |
| GET | /drivers/available | List available for dispatch | Dispatcher |
| GET | /drivers/{id}/performance | Driver performance metrics | Safety Officer |

### Trip Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /trips | List trips (paginated, filtered) | All authenticated |
| POST | /trips | Create trip (Draft) | Dispatcher |
| GET | /trips/{id} | Get trip details | All authenticated |
| PUT | /trips/{id} | Update trip (Draft only) | Dispatcher |
| POST | /trips/{id}/dispatch | Dispatch trip | Dispatcher |
| POST | /trips/{id}/complete | Complete trip | Dispatcher |
| POST | /trips/{id}/cancel | Cancel trip | Dispatcher, Fleet Manager |

### Maintenance Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /maintenance | List maintenance records | Fleet Manager |
| POST | /maintenance | Create maintenance record | Fleet Manager |
| GET | /maintenance/{id} | Get maintenance details | Fleet Manager |
| PUT | /maintenance/{id} | Update maintenance | Fleet Manager |
| POST | /maintenance/{id}/close | Close maintenance record | Fleet Manager |

### Fuel & Expense Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /fuel-logs | List fuel logs | All authenticated |
| POST | /fuel-logs | Create fuel log | Dispatcher, Fleet Manager |
| GET | /expenses | List expenses | Financial Analyst, Fleet Manager |
| POST | /expenses | Create expense | All authenticated |
| GET | /expenses/summary | Expense summary by category/period | Financial Analyst |

### Analytics Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /analytics/dashboard | Dashboard KPIs | All authenticated |
| GET | /analytics/fleet-utilization | Fleet utilization over time | Fleet Manager |
| GET | /analytics/fuel-efficiency | Fuel efficiency per vehicle | Fleet Manager, Financial Analyst |
| GET | /analytics/cost-breakdown | Cost breakdown by category | Financial Analyst |
| GET | /analytics/vehicle-roi | ROI per vehicle | Financial Analyst |
| GET | /analytics/driver-performance | Driver performance rankings | Safety Officer |
| GET | /reports/export/csv | Export report as CSV | All authenticated |

### API Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VEHICLE_ON_TRIP",
    "message": "Cannot dispatch: vehicle is already on an active trip",
    "details": {
      "vehicle_id": "uuid",
      "current_status": "On Trip"
    }
  }
}
```

---

## 11. UI Design

### Screen Inventory

| Screen | Components | Responsive Breakpoints |
|--------|-----------|----------------------|
| Login | Form, validation, error states | Single-column on mobile |
| Dashboard | KPI cards, charts, filters | Cards stack on mobile, 2-col tablet, 4-col desktop |
| Vehicle List | Data table, search, filters, pagination | Card view on mobile |
| Vehicle Form | Multi-field form, validation | Single-column on mobile |
| Driver List | Data table, license warnings | Card view on mobile |
| Driver Form | Multi-field form, date picker | Single-column on mobile |
| Trip List | Status badges, actions | Card view on mobile |
| Trip Form | Dropdowns (filtered), weight validation | Stepped form on mobile |
| Trip Detail | Timeline, status actions | Single-column stack |
| Maintenance List | Status filters, vehicle link | Card view on mobile |
| Fuel Logs | Table with totals | Card view on mobile |
| Reports | Charts, export buttons | Full-width charts on mobile |

### Design System

- **Typography:** Inter (headings), system sans-serif (body)
- **Colors:** Blue-600 primary, Amber-500 warning, Red-500 danger, Green-500 success
- **Spacing:** 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- **Shadows:** sm, md, lg for elevation hierarchy
- **Border Radius:** 6px default, 8px cards, 12px modals
- **Dark Mode:** HSL-based color system with CSS variables

---

## 12. Security Design

### Authentication Architecture

```
Client → Login Request → API Gateway → Auth Service → DB (verify hash)
                                                    ↓
                                              JWT (access + refresh)
                                                    ↓
Client ← JWT Tokens ← API Gateway ← Auth Service
```

### Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Transport | HTTPS/TLS 1.3 | Nginx termination |
| Auth | bcrypt password hashing | Cost factor 12 |
| Auth | JWT with short-lived access tokens | 24h access, 7d refresh |
| Auth | Refresh token rotation | Single-use, invalidate on reuse |
| API | Rate limiting | 100 req/min per user, 20 req/min for auth |
| API | Input validation | Pydantic schemas with strict types |
| API | SQL injection prevention | SQLAlchemy ORM (parameterized queries) |
| API | XSS prevention | Output encoding, CSP headers |
| Data | Field-level encryption | PII fields (contact numbers) |
| Data | Audit logging | Immutable append-only log |
| Frontend | CSRF protection | SameSite cookies + CSRF token |
| Frontend | Secure headers | X-Frame-Options, X-Content-Type-Options |
| Infra | Secrets management | Environment variables, never in code |
| Infra | Dependency scanning | Automated CVE checks in CI |

### RBAC Permission Matrix

| Resource | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|----------|:---:|:---:|:---:|:---:|
| Vehicles CRUD | ✅ | Read | Read | Read |
| Drivers CRUD | ✅ | Read | ✅ | Read |
| Trips CRUD | Read | ✅ | Read | Read |
| Maintenance | ✅ | Read | Read | Read |
| Fuel Logs | ✅ | ✅ | Read | Read |
| Expenses | Read | ✅ | — | ✅ |
| Reports | ✅ | Read | Read | ✅ |
| User Management | — | — | — | — |
| Audit Logs | Read | — | — | — |

(System Admin has full access to all resources including User Management)
