# TransitOps — Test Plan

## 1. Testing Strategy Overview

### Testing Pyramid

```
                    ┌─────────┐
                    │  E2E    │  5%   (Critical flows only)
                    │  Tests  │
                   ┌┴─────────┴┐
                   │Integration │  25%  (API + DB)
                   │   Tests    │
                  ┌┴────────────┴┐
                  │   Unit Tests  │  70%  (Business logic)
                  │               │
                  └───────────────┘
```

### Coverage Targets

| Layer | Target | Tool |
|-------|--------|------|
| Backend Unit Tests | > 95% | pytest + pytest-cov |
| Backend Integration | > 90% | pytest + httpx (TestClient) |
| Frontend Unit | > 85% | Vitest + React Testing Library |
| Frontend Integration | > 80% | Vitest + MSW |
| E2E Critical Paths | 100% of critical flows | Playwright |
| **Overall** | **> 90%** | Combined |

### Testing Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Backend Unit/Integration | pytest 7.x | Test framework |
| Backend Async | pytest-asyncio | Async test support |
| Backend Coverage | pytest-cov | Coverage reporting |
| Backend HTTP | httpx | Async test client for FastAPI |
| Backend DB | SQLAlchemy + SQLite (in-memory) | Fast test DB |
| Backend Mocking | unittest.mock / pytest-mock | Service mocking |
| Frontend Unit | Vitest | Fast JS test runner |
| Frontend Components | @testing-library/react | Component testing |
| Frontend Mocking | MSW (Mock Service Worker) | API mocking |
| E2E | Playwright | Browser automation |
| Load Testing | Locust | Performance testing |

---

## 2. Unit Tests

### 2.1 Business Rules Unit Tests

#### Vehicle Rules Tests (`tests/unit/rules/test_vehicle_rules.py`)

```python
class TestVehicleRules:
    """Tests for BR-V001 through BR-V008"""
    
    # BR-V001: Registration Uniqueness
    def test_duplicate_registration_rejected()
    def test_unique_registration_allowed()
    def test_soft_deleted_vehicle_registration_reusable()
    
    # BR-V002: Retired Vehicle Exclusion
    def test_retired_vehicle_not_in_available_list()
    def test_retired_vehicle_cannot_be_dispatched()
    
    # BR-V003: In Shop Vehicle Exclusion
    def test_in_shop_vehicle_not_in_available_list()
    def test_in_shop_vehicle_cannot_be_dispatched()
    
    # BR-V004: On Trip Re-assignment Prevention
    def test_on_trip_vehicle_blocked_from_dispatch()
    def test_version_mismatch_raises_conflict()
    
    # BR-V005: Capacity Validation
    def test_zero_capacity_rejected()
    def test_negative_capacity_rejected()
    def test_positive_capacity_accepted()
    
    # BR-V006: Odometer Monotonic
    def test_odometer_increase_accepted()
    def test_odometer_decrease_rejected()
    def test_odometer_same_value_accepted()
    
    # BR-V007: Retirement Preconditions
    def test_cannot_retire_on_trip_vehicle()
    def test_cannot_retire_vehicle_with_active_maintenance()
    def test_can_retire_available_vehicle()
    
    # BR-V008: Soft Delete
    def test_vehicle_with_trips_soft_deleted()
    def test_vehicle_without_trips_can_be_hard_deleted()
```

#### Driver Rules Tests (`tests/unit/rules/test_driver_rules.py`)

```python
class TestDriverRules:
    """Tests for BR-D001 through BR-D005"""
    
    # BR-D001: Expired License Block
    def test_expired_license_blocked_from_dispatch()
    def test_license_expiring_today_blocked()
    def test_license_valid_tomorrow_allowed()
    def test_license_valid_in_30_days_shows_warning()
    
    # BR-D002: Suspended Driver Block
    def test_suspended_driver_cannot_be_dispatched()
    def test_available_driver_can_be_dispatched()
    
    # BR-D003: On Trip Prevention
    def test_on_trip_driver_blocked()
    def test_version_mismatch_on_driver_raises_conflict()
    
    # BR-D004: Safety Score
    def test_safety_score_clamped_at_0()
    def test_safety_score_clamped_at_100()
    def test_safety_score_deduction_on_incident()
    def test_default_safety_score_is_100()
    
    # BR-D005: License Expiry Alerts
    def test_30_day_warning_generated()
    def test_14_day_urgent_generated()
    def test_7_day_critical_generated()
    def test_no_alert_for_valid_license_beyond_30_days()
```

#### Trip Rules Tests (`tests/unit/rules/test_trip_rules.py`)

```python
class TestTripRules:
    """Tests for BR-T001 through BR-T005"""
    
    # BR-T001: Cargo Weight
    def test_weight_under_capacity_allowed()
    def test_weight_equal_to_capacity_allowed()  # Boundary: inclusive
    def test_weight_over_capacity_rejected()
    def test_zero_weight_rejected()
    def test_negative_weight_rejected()
    
    # BR-T002: Lifecycle State Machine
    def test_draft_to_dispatched_valid()
    def test_draft_to_cancelled_valid()
    def test_dispatched_to_completed_valid()
    def test_dispatched_to_cancelled_valid()
    def test_completed_to_anything_invalid()
    def test_cancelled_to_anything_invalid()
    def test_draft_to_completed_invalid()  # Must dispatch first
    def test_dispatched_to_draft_invalid()  # Cannot revert
    
    # BR-T003: Source-Destination
    def test_same_source_destination_rejected()
    def test_case_insensitive_comparison()
    def test_whitespace_trimmed_comparison()
    def test_different_source_destination_allowed()
    
    # BR-T004: Trip Number Generation
    def test_trip_number_format_correct()
    def test_trip_number_unique()
    def test_trip_number_sequential()
    
    # BR-T005: Dispatch Atomicity
    def test_all_status_changes_in_single_transaction()
    def test_partial_failure_rolls_back_everything()
    def test_vehicle_locked_during_dispatch()
    def test_driver_locked_during_dispatch()
```

#### Maintenance Rules Tests (`tests/unit/rules/test_maintenance_rules.py`)

```python
class TestMaintenanceRules:
    """Tests for BR-M001 through BR-M004"""
    
    # BR-M001: Auto Status Change
    def test_creating_maintenance_sets_vehicle_in_shop()
    def test_vehicle_on_trip_blocks_maintenance_creation()
    
    # BR-M002: Closure Restoration
    def test_closing_last_maintenance_restores_available()
    def test_closing_with_other_active_keeps_in_shop()
    def test_closing_retired_vehicle_stays_retired()
    
    # BR-M003: Date Validation
    def test_end_date_before_start_date_rejected()
    def test_end_date_equal_start_date_allowed()
    def test_end_date_after_start_date_allowed()
    
    # BR-M004: On-Trip Block
    def test_cannot_create_maintenance_for_on_trip_vehicle()
    def test_can_create_maintenance_for_available_vehicle()
    def test_can_create_maintenance_for_in_shop_vehicle()
```

### 2.2 Service Layer Unit Tests

```python
# tests/unit/services/test_vehicle_service.py
class TestVehicleService:
    def test_create_vehicle_success()
    def test_create_vehicle_duplicate_registration()
    def test_update_vehicle_not_found()
    def test_update_vehicle_odometer_validation()
    def test_delete_vehicle_with_trips_soft_deletes()
    def test_get_available_vehicles_filters_correctly()
    def test_retire_vehicle_with_active_trip_fails()

# tests/unit/services/test_trip_service.py
class TestTripService:
    def test_create_trip_success()
    def test_dispatch_trip_full_validation_pass()
    def test_dispatch_trip_vehicle_unavailable()
    def test_dispatch_trip_driver_expired_license()
    def test_dispatch_trip_overweight()
    def test_dispatch_trip_concurrent_conflict()
    def test_complete_trip_success()
    def test_complete_trip_updates_odometer()
    def test_complete_trip_creates_fuel_log()
    def test_cancel_dispatched_trip_restores_statuses()
    def test_cancel_draft_trip_no_side_effects()
    def test_invalid_transition_rejected()

# tests/unit/services/test_analytics_service.py
class TestAnalyticsService:
    def test_fleet_utilization_calculation()
    def test_fleet_utilization_no_active_vehicles()
    def test_fuel_efficiency_calculation()
    def test_fuel_efficiency_zero_fuel()
    def test_vehicle_roi_calculation()
    def test_vehicle_roi_zero_acquisition_cost()
    def test_operational_cost_aggregation()
    def test_dashboard_kpis_correct_counts()
```

### 2.3 Schema Validation Tests

```python
# tests/unit/schemas/test_vehicle_schema.py
class TestVehicleSchema:
    def test_valid_vehicle_create()
    def test_invalid_registration_number_format()
    def test_negative_capacity_rejected()
    def test_invalid_vehicle_type_rejected()
    def test_optional_fields_default_correctly()

# tests/unit/schemas/test_trip_schema.py
class TestTripSchema:
    def test_valid_trip_create()
    def test_zero_cargo_weight_rejected()
    def test_zero_planned_distance_rejected()
    def test_complete_requires_odometer()
    def test_cancel_dispatched_requires_reason()
```

---

## 3. Integration Tests

### 3.1 API Integration Tests (Full Request Lifecycle)

```python
# tests/integration/test_auth_api.py
class TestAuthAPI:
    async def test_login_success_returns_tokens()
    async def test_login_invalid_credentials_401()
    async def test_refresh_token_rotation()
    async def test_protected_endpoint_without_token_401()
    async def test_protected_endpoint_with_expired_token_401()
    async def test_role_based_access_fleet_manager()
    async def test_role_based_access_dispatcher_denied()

# tests/integration/test_vehicle_api.py
class TestVehicleAPI:
    async def test_create_vehicle_full_flow()
    async def test_list_vehicles_paginated()
    async def test_list_vehicles_filtered_by_status()
    async def test_update_vehicle_odometer()
    async def test_duplicate_registration_409()
    async def test_delete_vehicle_soft()
    async def test_get_available_vehicles()

# tests/integration/test_trip_api.py
class TestTripAPI:
    """Critical path — tests the full dispatch workflow"""
    async def test_create_trip_draft()
    async def test_dispatch_trip_full_flow()
    async def test_dispatch_validates_vehicle_status()
    async def test_dispatch_validates_driver_license()
    async def test_dispatch_validates_cargo_weight()
    async def test_dispatch_concurrent_conflict()
    async def test_complete_trip_restores_statuses()
    async def test_complete_trip_updates_vehicle_odometer()
    async def test_cancel_dispatched_trip_restores()
    async def test_invalid_transition_rejected()
    
# tests/integration/test_maintenance_api.py
class TestMaintenanceAPI:
    async def test_create_maintenance_changes_vehicle_status()
    async def test_close_maintenance_restores_vehicle()
    async def test_close_with_other_active_keeps_in_shop()
    async def test_cannot_create_for_on_trip_vehicle()

# tests/integration/test_analytics_api.py
class TestAnalyticsAPI:
    async def test_dashboard_kpis_correct()
    async def test_fleet_utilization_calculation()
    async def test_csv_export_headers()
    async def test_csv_export_data_matches_filters()
```

### 3.2 Database Integration Tests

```python
# tests/integration/test_repositories.py
class TestVehicleRepository:
    async def test_create_and_retrieve()
    async def test_optimistic_lock_version_increment()
    async def test_optimistic_lock_conflict_detection()
    async def test_soft_delete_excludes_from_queries()
    async def test_pagination_correct_offset()
    async def test_filter_by_status()
    async def test_unique_constraint_violation()

class TestTripRepository:
    async def test_select_for_update_locks_vehicle()
    async def test_trip_number_auto_generation()
    async def test_join_loading_vehicle_driver()
```

---

## 4. Business Rule Tests (End-to-End Scenario Tests)

These test complete business scenarios as described in the problem statement:

```python
# tests/scenarios/test_full_workflow.py
class TestFullWorkflow:
    """
    Mirrors the Example Workflow from the problem statement:
    Steps 1-9 executed in sequence.
    """
    
    async def test_complete_workflow():
        """
        Step 1: Register vehicle 'Van-05' capacity 500 kg → Available
        Step 2: Register driver 'Alex' with valid license
        Step 3: Create trip with cargo 450 kg
        Step 4: System validates 450 <= 500, dispatch allowed
        Step 5: Vehicle and Driver status → On Trip
        Step 6: Complete trip with odometer + fuel
        Step 7: Vehicle and Driver status → Available
        Step 8: Create maintenance (Oil Change) → Vehicle In Shop
        Step 9: Verify reports updated (cost, efficiency)
        """
        
    async def test_overweight_rejection_workflow():
        """Register vehicle 500kg, try trip 600kg → rejected"""
        
    async def test_double_booking_prevention():
        """Dispatch vehicle, try to dispatch again → conflict"""
        
    async def test_expired_license_workflow():
        """Register driver with expired license, try dispatch → blocked"""
        
    async def test_maintenance_blocks_dispatch():
        """Create maintenance → vehicle In Shop → cannot dispatch"""
        
    async def test_retirement_workflow():
        """Use vehicle → complete trip → retire → cannot dispatch"""
```

---

## 5. Security Tests

```python
# tests/security/test_authentication.py
class TestAuthSecurity:
    async def test_password_not_stored_in_plaintext()
    async def test_bcrypt_cost_factor_minimum_12()
    async def test_jwt_contains_no_sensitive_data()
    async def test_refresh_token_single_use()
    async def test_expired_token_rejected()
    async def test_malformed_token_rejected()
    async def test_token_from_deactivated_user_rejected()

# tests/security/test_authorization.py
class TestAuthorization:
    async def test_fleet_manager_can_create_vehicle()
    async def test_dispatcher_cannot_create_vehicle()
    async def test_safety_officer_can_suspend_driver()
    async def test_financial_analyst_cannot_modify_trips()
    async def test_unauthenticated_cannot_access_any_resource()

# tests/security/test_input_validation.py
class TestInputSecurity:
    async def test_sql_injection_in_search_param()
    async def test_xss_in_vehicle_name()
    async def test_oversized_payload_rejected()
    async def test_special_characters_in_registration()
    async def test_negative_numeric_fields()
    async def test_future_date_handling()
    async def test_extremely_long_strings()

# tests/security/test_rate_limiting.py
class TestRateLimiting:
    async def test_login_rate_limited_after_20_attempts()
    async def test_api_rate_limited_after_100_per_minute()
    async def test_rate_limit_per_user_not_global()
```

---

## 6. Frontend Tests

### 6.1 Component Unit Tests

```typescript
// tests/components/VehicleForm.test.tsx
describe('VehicleForm', () => {
  it('renders all required fields')
  it('validates registration number format')
  it('rejects negative capacity')
  it('shows error on duplicate registration')
  it('submits valid form data')
  it('shows loading state during submission')
})

// tests/components/TripForm.test.tsx
describe('TripForm', () => {
  it('only shows Available vehicles in dropdown')
  it('only shows Available drivers with valid license')
  it('shows max capacity when vehicle selected')
  it('validates cargo weight against capacity')
  it('rejects same source and destination')
  it('submits valid trip')
})

// tests/components/KPICards.test.tsx
describe('KPICards', () => {
  it('renders all 7 KPI cards')
  it('shows correct values from API data')
  it('shows loading skeletons before data loads')
  it('handles zero values gracefully')
  it('formats percentages correctly')
})

// tests/components/StatusBadge.test.tsx
describe('StatusBadge', () => {
  it('renders green for Available')
  it('renders blue for On Trip')
  it('renders amber for In Shop')
  it('renders red for Retired/Suspended')
})
```

### 6.2 Hook Tests

```typescript
// tests/hooks/useVehicles.test.ts
describe('useVehicles', () => {
  it('fetches vehicles list')
  it('handles pagination')
  it('applies filters')
  it('invalidates cache on mutation')
  it('handles network error')
})

// tests/hooks/useAuth.test.ts
describe('useAuth', () => {
  it('stores tokens on login success')
  it('clears tokens on logout')
  it('refreshes token when expired')
  it('redirects to login on auth failure')
})
```

---

## 7. Performance Tests

```python
# tests/performance/locustfile.py
class TransitOpsUser(HttpUser):
    """Simulates realistic user behavior"""
    
    wait_time = between(1, 3)
    
    @task(3)
    def view_dashboard(self):
        """Most common action"""
        self.client.get("/api/v1/analytics/dashboard")
    
    @task(2)
    def list_vehicles(self):
        self.client.get("/api/v1/vehicles?page=1&per_page=20")
    
    @task(2)
    def list_trips(self):
        self.client.get("/api/v1/trips?status=Dispatched")
    
    @task(1)
    def create_and_dispatch_trip(self):
        """Critical write path"""
        # Create trip
        trip = self.client.post("/api/v1/trips", json={...})
        # Dispatch
        self.client.post(f"/api/v1/trips/{trip.json()['id']}/dispatch")

# Performance targets:
# - Dashboard: < 200ms at 50 concurrent users
# - Vehicle list: < 300ms at 50 concurrent users  
# - Trip dispatch: < 500ms at 20 concurrent users
# - System stable at 100 concurrent users for 10 minutes
```

---

## 8. Test Execution Plan

### CI/CD Pipeline Stages

```yaml
stages:
  - lint:        # ESLint, Ruff, mypy (< 1 min)
  - unit:        # Unit tests (< 2 min)
  - integration: # API + DB tests (< 5 min)
  - e2e:         # Playwright critical paths (< 10 min)
  - security:    # Security test suite (< 3 min)
  - performance: # Load tests (< 5 min, non-blocking)
```

### Running Tests Locally

```bash
# Backend
cd backend
pytest tests/unit -v --cov=app --cov-report=html
pytest tests/integration -v
pytest tests/scenarios -v
pytest tests/security -v

# Frontend
cd frontend
npm run test              # Vitest unit + component tests
npm run test:coverage     # With coverage report
npm run test:e2e          # Playwright E2E

# Full suite
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Test Data Strategy

| Approach | Used For | Implementation |
|----------|----------|----------------|
| Factories | Unit tests | pytest-factoryboy with realistic data |
| Fixtures | Integration tests | Pre-loaded database state per test module |
| Seed script | E2E / Demo | scripts/seed_data.py with deterministic data |
| Generated | Performance | Faker library for realistic scale testing |

---

## 9. Test Coverage Report Format

```
Name                                    Stmts   Miss  Cover
-----------------------------------------------------------
app/services/trip_service.py              120      2    98%
app/services/vehicle_service.py            85      1    99%
app/services/driver_service.py             72      3    96%
app/services/maintenance_service.py        45      0   100%
app/services/analytics_service.py          68      4    94%
app/rules/trip_rules.py                    55      0   100%
app/rules/vehicle_rules.py                 40      0   100%
app/rules/driver_rules.py                  35      1    97%
app/repositories/vehicle_repository.py     60      3    95%
app/repositories/trip_repository.py        75      2    97%
-----------------------------------------------------------
TOTAL                                    1250     45    96%
```

---

## 10. Defect Severity Classification

| Severity | Definition | Example | Response Time |
|----------|-----------|---------|---------------|
| P0 - Critical | System unusable, data corruption | Dispatch creates inconsistent state | Immediate fix |
| P1 - High | Feature broken, no workaround | Login fails, export broken | Same day |
| P2 - Medium | Feature degraded, workaround exists | Chart doesn't render on mobile | Next sprint |
| P3 - Low | Cosmetic, minor UX issue | Badge color slightly off | Backlog |
