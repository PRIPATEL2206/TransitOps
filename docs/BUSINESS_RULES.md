# TransitOps — Business Rules Specification

## Overview

This document defines all business rules governing the TransitOps platform. Rules are categorized by domain, assigned severity levels, and mapped to enforcement points.

**Severity Levels:**
- 🔴 **Critical** — Violation causes data corruption or safety risk; must be enforced at DB + API + UI
- 🟡 **Important** — Violation causes operational issues; enforced at API + UI
- 🟢 **Advisory** — Violation is suboptimal but not harmful; enforced at UI (warning)

---

## 1. Vehicle Rules

### BR-V001: Registration Number Uniqueness 🔴

```
RULE: vehicle.registration_number MUST be unique across all non-deleted vehicles
SCOPE: CREATE, UPDATE
ENFORCEMENT:
  - Database: UNIQUE constraint on registration_number WHERE is_deleted = false
  - API: Check existence before insert, return 409 Conflict
  - UI: Real-time availability check on blur
ERROR: "A vehicle with registration number '{value}' already exists"
```

### BR-V002: Retired Vehicle Dispatch Exclusion 🔴

```
RULE: Vehicles with status = "Retired" MUST NOT appear in dispatch selection
SCOPE: TRIP.CREATE, TRIP.DISPATCH
ENFORCEMENT:
  - API: Filter query WHERE status = 'Available' for dispatch dropdown
  - API: Validate vehicle.status = 'Available' before dispatch action
  - UI: Only show Available vehicles in selector
ERROR: "Vehicle '{reg_number}' is retired and cannot be dispatched"
```

### BR-V003: In Shop Vehicle Dispatch Exclusion 🔴

```
RULE: Vehicles with status = "In Shop" MUST NOT appear in dispatch selection
SCOPE: TRIP.CREATE, TRIP.DISPATCH
ENFORCEMENT:
  - API: Filter query WHERE status = 'Available' for dispatch dropdown
  - API: Validate vehicle.status = 'Available' before dispatch action
  - UI: Only show Available vehicles in selector; show "In Maintenance" badge
ERROR: "Vehicle '{reg_number}' is currently in maintenance and cannot be dispatched"
```

### BR-V004: On Trip Vehicle Re-assignment Prevention 🔴

```
RULE: Vehicles with status = "On Trip" MUST NOT be assigned to another trip
SCOPE: TRIP.DISPATCH
ENFORCEMENT:
  - API: Validate vehicle.status = 'Available' with optimistic lock
  - DB: Version check on UPDATE (optimistic concurrency)
  - UI: Real-time status display, disable if not Available
ERROR: "Vehicle '{reg_number}' is already on an active trip"
RACE CONDITION HANDLING:
  - Use SELECT ... FOR UPDATE or version-based optimistic locking
  - Return 409 Conflict on version mismatch
```

### BR-V005: Maximum Load Capacity Positive Value 🟡

```
RULE: vehicle.max_load_capacity MUST be > 0
SCOPE: CREATE, UPDATE
ENFORCEMENT:
  - DB: CHECK constraint (max_load_capacity > 0)
  - API: Pydantic validator Field(gt=0)
  - UI: Min value = 0.01, step = 0.01
ERROR: "Maximum load capacity must be a positive number"
```

### BR-V006: Odometer Monotonically Increasing 🟡

```
RULE: Any odometer update MUST be >= current value
SCOPE: UPDATE, TRIP.COMPLETE, FUEL_LOG.CREATE
ENFORCEMENT:
  - API: Compare new value against current_odometer
  - UI: Show current reading, validate min value
ERROR: "Odometer reading ({new}) cannot be less than current ({current})"
EXCEPTION: Fleet Manager can override with reason (audit logged)
```

### BR-V007: Vehicle Retirement Preconditions 🟡

```
RULE: Vehicle cannot be retired if:
  - Currently On Trip (must complete/cancel trip first)
  - Has active maintenance (must close maintenance first)
SCOPE: STATUS_CHANGE to Retired
ENFORCEMENT:
  - API: Check no active trips, no active maintenance
ERROR: "Cannot retire vehicle: {reason}"
```

### BR-V008: Soft Delete Preservation 🟢

```
RULE: Vehicles with trip history MUST be soft-deleted, never hard-deleted
SCOPE: DELETE
ENFORCEMENT:
  - API: Check trip count; if > 0, set is_deleted = true
  - DB: ON DELETE RESTRICT on trips.vehicle_id
```

---

## 2. Driver Rules

### BR-D001: Expired License Dispatch Block 🔴

```
RULE: Drivers with license_expiry <= CURRENT_DATE CANNOT be assigned to trips
SCOPE: TRIP.DISPATCH
ENFORCEMENT:
  - API: Check driver.license_expiry > CURRENT_DATE at dispatch time
  - API: Filter available drivers list to exclude expired licenses
  - UI: Show expiry warning badge, disable expired drivers in selector
ERROR: "Driver '{name}' has an expired license (expired: {date}). Cannot assign to trip."
EDGE CASE: License expires DURING trip → allow completion, create alert
```

### BR-D002: Suspended Driver Block 🔴

```
RULE: Drivers with status = "Suspended" CANNOT be assigned to trips
SCOPE: TRIP.DISPATCH
ENFORCEMENT:
  - API: Validate driver.status = 'Available'
  - UI: Only show Available drivers in dispatch selector
ERROR: "Driver '{name}' is suspended and cannot be assigned to trips"
```

### BR-D003: On Trip Driver Re-assignment Prevention 🔴

```
RULE: Drivers with status = "On Trip" MUST NOT be assigned to another trip
SCOPE: TRIP.DISPATCH
ENFORCEMENT:
  - API: Validate driver.status = 'Available' with optimistic lock
  - DB: Version check on UPDATE
  - UI: Real-time status display
ERROR: "Driver '{name}' is already on an active trip"
```

### BR-D004: Safety Score Bounds 🟡

```
RULE: driver.safety_score MUST be between 0.00 and 100.00
SCOPE: UPDATE, CALCULATE
ENFORCEMENT:
  - DB: CHECK constraint (safety_score >= 0 AND safety_score <= 100)
  - API: Clamp values to valid range
CALCULATION:
  base_score = 100
  deductions:
    - Late delivery: -2 per instance
    - Incident reported: -10 per instance
    - License warning ignored: -5
  additions:
    - 100 trips without incident: +5
    - On-time delivery streak (50+): +3
  safety_score = CLAMP(base_score + adjustments, 0, 100)
```

### BR-D005: License Expiry Alert Thresholds 🟢

```
RULE: System MUST alert when driver license approaches expiry
THRESHOLDS:
  - 30 days: 🟡 Warning notification
  - 14 days: 🟠 Urgent notification + email
  - 7 days: 🔴 Critical notification + email + dashboard alert
  - 0 days (expired): 🔴 Block from dispatch (BR-D001)
```

---

## 3. Trip Rules

### BR-T001: Cargo Weight Validation 🔴

```
RULE: trip.cargo_weight MUST be <= vehicle.max_load_capacity
SCOPE: TRIP.CREATE, TRIP.DISPATCH
ENFORCEMENT:
  - API: Load vehicle, compare weights
  - UI: Show max capacity when vehicle selected, validate on input
ERROR: "Cargo weight ({weight} kg) exceeds vehicle capacity ({max} kg)"
BOUNDARY: Weight EQUAL to max is ALLOWED (inclusive)
```

### BR-T002: Trip Lifecycle State Machine 🔴

```
VALID TRANSITIONS:
  Draft → Dispatched
    REQUIRES: Vehicle available, Driver available, License valid, Weight valid
    EFFECTS: vehicle.status = "On Trip", driver.status = "On Trip"
    
  Draft → Cancelled
    REQUIRES: None
    EFFECTS: None (no vehicle/driver assigned at Draft stage)
    
  Dispatched → Completed
    REQUIRES: final_odometer, fuel_consumed (can be 0 for EV)
    EFFECTS: vehicle.status = "Available", driver.status = "Available"
              vehicle.odometer = final_odometer
    
  Dispatched → Cancelled
    REQUIRES: cancellation_reason (mandatory)
    EFFECTS: vehicle.status = "Available", driver.status = "Available"

INVALID TRANSITIONS (reject with 422):
  - Completed → anything
  - Cancelled → anything  
  - Dispatched → Draft
  - Draft → Completed (must dispatch first)
```

### BR-T003: Source-Destination Differentiation 🟡

```
RULE: trip.source MUST NOT equal trip.destination
SCOPE: TRIP.CREATE, TRIP.UPDATE
ENFORCEMENT:
  - API: Case-insensitive comparison after trim
  - UI: Validation on submit
ERROR: "Source and destination cannot be the same"
```

### BR-T004: Trip Number Auto-Generation 🟡

```
RULE: trip.trip_number is auto-generated and immutable
FORMAT: "TRP-{YYYYMMDD}-{sequential_4digit}"
EXAMPLE: "TRP-20260712-0001"
SCOPE: TRIP.CREATE
ENFORCEMENT:
  - API: Generate on creation, not user-editable
  - DB: UNIQUE constraint
```

### BR-T005: Dispatch Atomicity 🔴

```
RULE: Trip dispatch MUST be atomic — vehicle status, driver status, and trip status 
      change together or not at all
SCOPE: TRIP.DISPATCH
ENFORCEMENT:
  - API: Single database transaction wrapping all three updates
  - DB: Transaction isolation level SERIALIZABLE for this operation
ROLLBACK: If any status update fails, ALL changes are rolled back
```

---

## 4. Maintenance Rules

### BR-M001: Active Maintenance Auto-Status 🔴

```
RULE: Creating a maintenance record with status "Active" automatically 
      sets vehicle.status to "In Shop"
SCOPE: MAINTENANCE.CREATE
ENFORCEMENT:
  - API: In same transaction as maintenance creation
  - PRECONDITION: Vehicle must NOT be On Trip
ERROR (precondition): "Cannot create maintenance for vehicle currently on trip. 
                       Complete or cancel the trip first."
```

### BR-M002: Maintenance Closure Status Restoration 🔴

```
RULE: Closing a maintenance record restores vehicle.status to "Available"
      UNLESS vehicle is Retired OR has other active maintenance records
SCOPE: MAINTENANCE.CLOSE
ENFORCEMENT:
  - API: Check for other active records for same vehicle
  - API: Check vehicle.status != "Retired"
LOGIC:
  IF vehicle has other active maintenance records:
    Keep status = "In Shop"
  ELSE IF vehicle.status == "Retired":
    Keep status = "Retired" (retirement is permanent)
  ELSE:
    Set vehicle.status = "Available"
```

### BR-M003: Date Validation 🟡

```
RULE: maintenance.end_date MUST be >= maintenance.start_date (when provided)
SCOPE: CREATE, UPDATE, CLOSE
ENFORCEMENT:
  - API: Date comparison validation
  - UI: End date picker minimum = start date
ERROR: "End date cannot be before start date"
```

### BR-M004: On-Trip Vehicle Maintenance Block 🟡

```
RULE: Cannot create maintenance for a vehicle with status "On Trip"
SCOPE: MAINTENANCE.CREATE
ENFORCEMENT:
  - API: Check vehicle.status before creation
ERROR: "Vehicle is currently on trip. Wait for trip completion before scheduling maintenance."
```

---

## 5. Financial Rules

### BR-F001: Fuel Log Positive Values 🟡

```
RULE: fuel_log.liters and fuel_log.cost MUST be > 0
SCOPE: FUEL_LOG.CREATE
ENFORCEMENT:
  - DB: CHECK constraints
  - API: Pydantic Field(gt=0)
  - UI: Min value validation
```

### BR-F002: Operational Cost Calculation 🟡

```
RULE: Total Operational Cost per vehicle = SUM(fuel_costs) + SUM(maintenance_costs)
FORMULA:
  operational_cost(vehicle_id, period) = 
    SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = ? AND date BETWEEN ? AND ?
    + SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = ?
SCOPE: ANALYTICS, REPORTS
ENFORCEMENT:
  - API: Computed on demand (not stored)
  - CACHE: 5-minute TTL for dashboard
```

### BR-F003: Vehicle ROI Calculation 🟡

```
RULE: ROI = (Revenue - (Maintenance_Cost + Fuel_Cost)) / Acquisition_Cost
FORMULA:
  revenue = SUM(trip_revenue) for vehicle  [if revenue tracking enabled]
           OR estimated_revenue = completed_trips × avg_revenue_per_trip
  costs = SUM(fuel_costs) + SUM(maintenance_costs)
  roi = (revenue - costs) / acquisition_cost
EDGE CASES:
  - acquisition_cost = 0: Return "N/A" (prevent division by zero)
  - No revenue data: Show cost-only metrics
SCOPE: ANALYTICS
```

### BR-F004: Fuel Efficiency Calculation 🟡

```
RULE: Fuel Efficiency = Total Distance / Total Fuel Consumed (km/L)
FORMULA:
  efficiency(vehicle_id) = 
    SUM(actual_distance from completed trips) / SUM(fuel_consumed from completed trips)
EDGE CASES:
  - fuel_consumed = 0: Return "N/A"
  - No completed trips: Return "No data"
  - Electric vehicles: Show "EV" indicator
SCOPE: ANALYTICS, VEHICLE DETAIL
```

### BR-F005: Fleet Utilization Calculation 🟡

```
RULE: Fleet Utilization = (Vehicles On Trip / Total Active Vehicles) × 100
FORMULA:
  active_vehicles = COUNT(*) WHERE status IN ('Available', 'On Trip') AND is_deleted = false
  on_trip = COUNT(*) WHERE status = 'On Trip' AND is_deleted = false
  utilization = (on_trip / active_vehicles) × 100
EDGE CASES:
  - active_vehicles = 0: Return 0%
  - All vehicles on trip: Return 100%
NOTE: "In Shop" and "Retired" vehicles excluded from both numerator and denominator
```

---

## 6. Status Transition Rules (State Machines)

### Vehicle Status Transitions

```
         ┌─────────────────────────────────────┐
         │                                     │
         ▼                                     │
    ┌──────────┐   Trip Dispatched    ┌──────────┐
    │ Available │──────────────────────▶│ On Trip  │
    │          │◀──────────────────────│          │
    └──────────┘   Trip Complete/      └──────────┘
         │         Cancel                    │
         │                                   │ (BLOCKED)
         │  Maintenance Created              ▼
         │                              Cannot create
         ▼                              maintenance
    ┌──────────┐                        while on trip
    │ In Shop  │
    │          │
    └──────────┘
         │
         │  Maintenance Closed
         │  (no other active)
         ▼
    ┌──────────┐
    │ Available │──────────────────────▶┌──────────┐
    │          │     Manual retire      │ Retired  │
    └──────────┘                        │          │
                                        └──────────┘
                                        (TERMINAL - no transitions out)
```

### Driver Status Transitions

```
    ┌──────────┐   Trip Dispatched    ┌──────────┐
    │ Available │──────────────────────▶│ On Trip  │
    │          │◀──────────────────────│          │
    └──────────┘   Trip Complete/      └──────────┘
         │         Cancel
         │
         │  Manual status change
         ▼
    ┌──────────┐                      ┌──────────┐
    │ Off Duty │                      │Suspended │
    │          │                      │          │
    └──────────┘                      └──────────┘
         │                                   │
         │  Manual status change             │  Manual reinstatement
         ▼                                   ▼
    ┌──────────┐                      ┌──────────┐
    │ Available │◀─────────────────────│ Available │
    └──────────┘                      └──────────┘
```

### Trip Status Transitions

```
    ┌──────────┐                      ┌──────────┐
    │  Draft   │──────────────────────▶│Dispatched│
    │          │   Dispatch            │          │
    └──────────┘   (validates BR-T001, └──────────┘
         │          BR-V002-V004,           │     │
         │          BR-D001-D003)           │     │
         │                                  │     │
         │  Cancel (no side effects)        │     │  Cancel (restore statuses)
         ▼                                  │     ▼
    ┌──────────┐                            │  ┌──────────┐
    │Cancelled │◀───────────────────────────┘  │Cancelled │
    │          │                               │          │
    └──────────┘                               └──────────┘
                                                    
                        ┌──────────┐
                        │Dispatched│
                        │          │
                        └──────────┘
                              │
                              │  Complete (requires final data)
                              ▼
                        ┌──────────┐
                        │Completed │
                        │          │
                        └──────────┘
                        (TERMINAL)
```

---

## 7. Cross-Cutting Business Rules

### BR-X001: Audit Trail 🟡

```
RULE: All create, update, delete, and status change operations MUST be audit logged
FIELDS: user_id, entity_type, entity_id, action, old_values, new_values, timestamp, ip
RETENTION: 2 years minimum
IMMUTABILITY: Audit records cannot be modified or deleted
```

### BR-X002: Optimistic Concurrency Control 🔴

```
RULE: Status changes on vehicles and drivers use version-based optimistic locking
IMPLEMENTATION:
  UPDATE vehicles SET status = ?, version = version + 1 
  WHERE id = ? AND version = ?
  IF affected_rows = 0: RAISE ConflictError("Resource was modified by another user")
```

### BR-X003: Cascading Validation on Dispatch 🔴

```
RULE: Dispatch action MUST validate ALL of the following in a single transaction:
  1. Trip is in Draft status
  2. Vehicle status is Available (with version lock)
  3. Driver status is Available (with version lock)
  4. Driver license not expired
  5. Cargo weight ≤ vehicle max capacity
  6. Source ≠ Destination
FAILURE: Reject with first failing validation; do not partial-apply
```

### BR-X004: Data Retention 🟢

```
RULE: Completed trips and their associated logs are retained indefinitely
RULE: Cancelled trips with no financial data may be purged after 1 year
RULE: Deleted vehicles/drivers are soft-deleted, never purged while referenced
```
