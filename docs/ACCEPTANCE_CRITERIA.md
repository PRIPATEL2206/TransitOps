# TransitOps — Acceptance Criteria

## Format

Each criterion uses the Given/When/Then (GWT) format for testability:

```
GIVEN [precondition]
WHEN [action]
THEN [expected outcome]
```

---

## 1. Authentication Module

### AC-1.1: Successful Login

```
GIVEN a registered user with email "fleet@transitops.io" and valid password
WHEN the user submits the login form with correct credentials
THEN the system returns HTTP 200 with access_token and refresh_token
AND the user is redirected to the dashboard
AND last_login timestamp is updated in the database
```

### AC-1.2: Failed Login (Invalid Password)

```
GIVEN a registered user with email "fleet@transitops.io"
WHEN the user submits the login form with incorrect password
THEN the system returns HTTP 401 with message "Invalid email or password"
AND no token is issued
AND failed attempt is logged in audit trail
```

### AC-1.3: Failed Login (Non-existent User)

```
GIVEN no user exists with email "ghost@transitops.io"
WHEN someone submits the login form with that email
THEN the system returns HTTP 401 with message "Invalid email or password"
AND the response time is identical to invalid-password case (timing attack prevention)
```

### AC-1.4: Token Refresh

```
GIVEN a user with a valid refresh_token
WHEN the access_token expires and the client sends the refresh_token
THEN the system returns a new access_token
AND the old refresh_token is invalidated (rotation)
AND a new refresh_token is issued
```

### AC-1.5: Protected Route Access

```
GIVEN an unauthenticated request (no token or expired token)
WHEN the client requests any API endpoint except /auth/login
THEN the system returns HTTP 401 with message "Authentication required"
```

### AC-1.6: Role-Based Access Denial

```
GIVEN a user with role "Safety Officer"
WHEN they attempt to POST /api/v1/vehicles (create vehicle)
THEN the system returns HTTP 403 with message "Insufficient permissions"
```

---

## 2. Vehicle Module

### AC-2.1: Create Vehicle — Success

```
GIVEN a Fleet Manager is authenticated
AND no vehicle exists with registration number "MH-12-AB-1234"
WHEN they POST /api/v1/vehicles with valid data:
  {registration_number: "MH-12-AB-1234", name: "Delivery Van 05",
   type: "Van", max_load_capacity: 500, current_odometer: 12000,
   acquisition_cost: 850000}
THEN the system returns HTTP 201 with the created vehicle
AND vehicle.status = "Available"
AND vehicle.id is a valid UUID
AND audit log entry is created with action "CREATE"
```

### AC-2.2: Create Vehicle — Duplicate Registration

```
GIVEN a vehicle with registration_number "MH-12-AB-1234" already exists
WHEN a Fleet Manager POST /api/v1/vehicles with the same registration_number
THEN the system returns HTTP 409 with error code "DUPLICATE_REGISTRATION"
AND message "A vehicle with registration number 'MH-12-AB-1234' already exists"
AND no vehicle is created
```

### AC-2.3: Create Vehicle — Invalid Capacity

```
GIVEN a Fleet Manager is authenticated
WHEN they POST /api/v1/vehicles with max_load_capacity: -100
THEN the system returns HTTP 422 with validation error
AND message "max_load_capacity must be greater than 0"
```

### AC-2.4: Update Vehicle Odometer — Valid

```
GIVEN vehicle "VAN-05" has current_odometer = 45000
WHEN Fleet Manager updates odometer to 45500
THEN the system returns HTTP 200
AND vehicle.current_odometer = 45500
AND audit log records old value (45000) and new value (45500)
```

### AC-2.5: Update Vehicle Odometer — Rollback Attempt

```
GIVEN vehicle "VAN-05" has current_odometer = 45000
WHEN Fleet Manager updates odometer to 44000
THEN the system returns HTTP 422 with error
AND message "Odometer reading (44000) cannot be less than current (45000)"
AND odometer remains 45000
```

### AC-2.6: Retire Vehicle — Success

```
GIVEN vehicle "VAN-05" has status = "Available"
AND no active trips or maintenance exist for this vehicle
WHEN Fleet Manager changes status to "Retired"
THEN the system returns HTTP 200
AND vehicle.status = "Retired"
AND vehicle no longer appears in dispatch vehicle dropdown
AND vehicle still appears in reports and history views
```

### AC-2.7: Retire Vehicle — On Trip Block

```
GIVEN vehicle "VAN-05" has status = "On Trip"
WHEN Fleet Manager attempts to change status to "Retired"
THEN the system returns HTTP 422 with error
AND message "Cannot retire vehicle while it has an active trip"
```

---

## 3. Driver Module

### AC-3.1: Create Driver — Success

```
GIVEN a Fleet Manager is authenticated
AND no driver exists with license_number "DL-1234567890"
WHEN they POST /api/v1/drivers with valid data:
  {name: "Alex Kumar", license_number: "DL-1234567890",
   license_category: "HMV", license_expiry: "2027-06-15",
   contact_number: "+919876543210"}
THEN the system returns HTTP 201
AND driver.status = "Available"
AND driver.safety_score = 100.00
```

### AC-3.2: Create Driver — Expired License Warning

```
GIVEN a Fleet Manager is authenticated
WHEN they POST /api/v1/drivers with license_expiry = "2025-01-15" (past date)
THEN the system returns HTTP 201 (creation allowed)
AND response includes warning: "Driver's license is already expired"
AND driver appears with expired badge in UI
```

### AC-3.3: Driver License Expiry Alert

```
GIVEN driver "Alex" has license_expiry = 14 days from today
WHEN the daily compliance check job runs
THEN a notification is created: "Driver Alex Kumar's license expires in 14 days"
AND notification is marked as "urgent" priority
AND email is sent to Safety Officer role
```

### AC-3.4: Suspend Driver — On Trip Block

```
GIVEN driver "Alex" has status = "On Trip"
WHEN Safety Officer attempts to change status to "Suspended"
THEN the system returns HTTP 422
AND message "Cannot suspend driver while on an active trip. Wait for trip completion."
```

---

## 4. Trip Module

### AC-4.1: Create Trip — Success

```
GIVEN a Dispatcher is authenticated
AND vehicle "VAN-05" (status: Available, max_capacity: 500)
AND driver "Alex" (status: Available, license valid until 2027)
WHEN they POST /api/v1/trips with:
  {source: "Mumbai Port", destination: "Pune Warehouse",
   vehicle_id: "VAN-05-UUID", driver_id: "Alex-UUID",
   cargo_weight: 450, planned_distance: 150}
THEN the system returns HTTP 201
AND trip.status = "Draft"
AND trip.trip_number matches format "TRP-YYYYMMDD-NNNN"
AND vehicle status remains "Available" (not locked until dispatch)
```

### AC-4.2: Dispatch Trip — Success (Full Validation)

```
GIVEN trip "TRP-20260712-0001" is in Draft status
AND its vehicle (VAN-05) has status "Available" and version = 3
AND its driver (Alex) has status "Available" and version = 5
AND cargo_weight (450) <= vehicle max_capacity (500)
AND driver license_expiry (2027-06-15) > today (2026-07-12)
WHEN Dispatcher POST /api/v1/trips/{id}/dispatch
THEN the system returns HTTP 200
AND trip.status = "Dispatched"
AND trip.dispatched_at = current timestamp
AND vehicle.status = "On Trip" AND vehicle.version = 4
AND driver.status = "On Trip" AND driver.version = 6
AND all changes happen in a single atomic transaction
```

### AC-4.3: Dispatch Trip — Vehicle Already Taken (Race Condition)

```
GIVEN trip A and trip B both reference vehicle "VAN-05" (currently Available, version = 3)
WHEN Dispatcher 1 dispatches trip A (succeeds, vehicle version → 4)
AND Dispatcher 2 dispatches trip B 100ms later (finds version = 3, expected 3, but actual is now 4)
THEN trip B dispatch returns HTTP 409 Conflict
AND message "Vehicle VAN-05 was just assigned to another trip. Please refresh and try again."
AND trip B remains in Draft status
AND no partial state changes occurred for trip B
```

### AC-4.4: Dispatch Trip — Expired License

```
GIVEN trip has driver "Alex" whose license_expiry = "2026-07-10" (2 days ago)
WHEN Dispatcher attempts to dispatch
THEN the system returns HTTP 422
AND error code "DRIVER_LICENSE_EXPIRED"
AND message "Driver Alex Kumar's license expired on 2026-07-10. Cannot dispatch."
```

### AC-4.5: Dispatch Trip — Overweight

```
GIVEN trip has cargo_weight = 600 kg
AND assigned vehicle has max_load_capacity = 500 kg
WHEN Dispatcher attempts to dispatch
THEN the system returns HTTP 422
AND error code "CARGO_OVERWEIGHT"
AND message "Cargo weight (600 kg) exceeds vehicle capacity (500 kg)"
```

### AC-4.6: Complete Trip — Success

```
GIVEN trip "TRP-20260712-0001" is in "Dispatched" status
AND vehicle current_odometer = 45000
WHEN Dispatcher POST /api/v1/trips/{id}/complete with:
  {final_odometer: 45150, fuel_consumed: 18.5, actual_distance: 148}
THEN the system returns HTTP 200
AND trip.status = "Completed"
AND trip.completed_at = current timestamp
AND vehicle.status = "Available"
AND vehicle.current_odometer = 45150
AND driver.status = "Available"
AND fuel_log auto-created with 18.5 liters
```

### AC-4.7: Complete Trip — Odometer Validation

```
GIVEN trip's vehicle has current_odometer = 45000
WHEN Dispatcher tries to complete with final_odometer = 44900
THEN the system returns HTTP 422
AND message "Final odometer (44900) cannot be less than current (45000)"
```

### AC-4.8: Cancel Dispatched Trip — Restoration

```
GIVEN trip "TRP-20260712-0001" is "Dispatched"
AND vehicle "VAN-05" has status "On Trip"
AND driver "Alex" has status "On Trip"
WHEN Dispatcher POST /api/v1/trips/{id}/cancel with {reason: "Client cancelled order"}
THEN trip.status = "Cancelled"
AND trip.cancellation_reason = "Client cancelled order"
AND vehicle.status = "Available"
AND driver.status = "Available"
```

### AC-4.9: Invalid Transition — Completed to Dispatched

```
GIVEN trip has status = "Completed"
WHEN any user attempts to dispatch it
THEN the system returns HTTP 422
AND message "Invalid status transition: Completed → Dispatched is not allowed"
```

---

## 5. Maintenance Module

### AC-5.1: Create Maintenance — Auto Status Change

```
GIVEN vehicle "VAN-05" has status = "Available"
WHEN Fleet Manager POST /api/v1/maintenance with:
  {vehicle_id: "VAN-05-UUID", maintenance_type: "Oil Change",
   cost: 2500, start_date: "2026-07-12"}
THEN the system returns HTTP 201
AND maintenance.status = "Active"
AND vehicle.status = "In Shop"
AND vehicle no longer appears in dispatch dropdown
```

### AC-5.2: Create Maintenance — Vehicle On Trip Block

```
GIVEN vehicle "VAN-05" has status = "On Trip"
WHEN Fleet Manager attempts to create maintenance for it
THEN the system returns HTTP 422
AND message "Cannot create maintenance for vehicle currently on trip"
```

### AC-5.3: Close Maintenance — Single Active Record

```
GIVEN vehicle "VAN-05" has exactly 1 active maintenance record
AND vehicle status is "In Shop"
AND vehicle is NOT retired
WHEN Fleet Manager POST /api/v1/maintenance/{id}/close
THEN maintenance.status = "Completed"
AND maintenance.end_date = today
AND vehicle.status = "Available"
```

### AC-5.4: Close Maintenance — Multiple Active Records

```
GIVEN vehicle "VAN-05" has 2 active maintenance records (Oil Change + Tire Replace)
WHEN Fleet Manager closes the Oil Change record
THEN that maintenance.status = "Completed"
AND vehicle.status remains "In Shop" (Tire Replace still active)
```

### AC-5.5: Close Maintenance — Retired Vehicle

```
GIVEN vehicle "TRUCK-01" has status = "Retired" (legacy maintenance record being closed)
WHEN Fleet Manager closes its maintenance record
THEN maintenance.status = "Completed"
AND vehicle.status remains "Retired" (retirement overrides restoration)
```

---

## 6. Fuel & Expense Module

### AC-6.1: Create Fuel Log — Success

```
GIVEN vehicle "VAN-05" with current_odometer = 45000
WHEN user POST /api/v1/fuel-logs with:
  {vehicle_id: "VAN-05-UUID", liters: 45.5, cost: 4550,
   odometer_reading: 45400, date: "2026-07-12"}
THEN the system returns HTTP 201
AND vehicle.current_odometer updated to 45400
AND fuel efficiency calculable for this entry
```

### AC-6.2: Create Fuel Log — Invalid Odometer

```
GIVEN vehicle "VAN-05" with current_odometer = 45000
WHEN user tries to log fuel with odometer_reading = 44500
THEN the system returns HTTP 422
AND message "Odometer reading must be >= current vehicle reading (45000)"
```

### AC-6.3: Operational Cost Calculation

```
GIVEN vehicle "VAN-05" has:
  - Fuel logs totaling ₹45,000
  - Maintenance records totaling ₹12,500
WHEN Financial Analyst requests GET /api/v1/analytics/cost-breakdown?vehicle_id={id}
THEN response includes:
  {fuel_cost: 45000, maintenance_cost: 12500, total_operational_cost: 57500}
```

### AC-6.4: Vehicle ROI Calculation

```
GIVEN vehicle "VAN-05":
  - acquisition_cost = ₹850,000
  - total fuel cost = ₹45,000
  - total maintenance cost = ₹12,500
  - estimated revenue from trips = ₹120,000
WHEN Financial Analyst requests ROI
THEN roi = (120000 - (45000 + 12500)) / 850000 = 0.0735 (7.35%)
```

### AC-6.5: Fuel Efficiency Calculation

```
GIVEN vehicle "VAN-05" completed trips with:
  - Total actual distance = 5000 km
  - Total fuel consumed = 400 liters
WHEN fuel efficiency is calculated
THEN efficiency = 5000 / 400 = 12.5 km/L
```

---

## 7. Dashboard Module

### AC-7.1: KPI Display

```
GIVEN the fleet has:
  - 50 total vehicles (5 Retired, 3 In Shop, 12 On Trip, 30 Available)
  - 40 drivers (10 On Trip, 2 Off Duty, 1 Suspended, 27 Available)
  - 12 active trips, 5 draft (pending) trips
WHEN user loads the dashboard
THEN KPI cards show:
  - Active Vehicles: 45 (excludes 5 Retired)
  - Available Vehicles: 30
  - In Maintenance: 3
  - Active Trips: 12
  - Pending Trips: 5
  - Drivers On Duty: 10
  - Fleet Utilization: 26.7% (12 On Trip / 45 Active × 100)
```

### AC-7.2: Dashboard Filters

```
GIVEN dashboard is loaded
WHEN user selects filter: vehicle_type = "Van"
THEN all KPIs recalculate for Vans only
AND charts update to show Van-specific data
AND filter state persists in URL query params
```

---

## 8. Reports & Export

### AC-8.1: CSV Export

```
GIVEN user is viewing the trips list (filtered to last 30 days)
WHEN they click "Export CSV"
THEN browser downloads a file named "trips_2026-06-12_2026-07-12_1720789200.csv"
AND CSV contains headers matching visible table columns
AND data matches applied filters
AND dates are formatted as YYYY-MM-DD
AND monetary values include 2 decimal places
```

### AC-8.2: Large Export Handling

```
GIVEN 50,000 trip records match the filter
WHEN user clicks Export
THEN download begins immediately (streaming response)
AND file is complete with all 50,000 rows
AND server memory usage remains < 100MB during export
```

---

## 9. Cross-Cutting Concerns

### AC-9.1: Audit Trail

```
GIVEN any mutation operation (create, update, delete, status change)
WHEN the operation completes successfully
THEN an audit_log entry is created with:
  - user_id: who performed the action
  - entity_type: "vehicle" | "driver" | "trip" | "maintenance" | "fuel_log" | "expense"
  - entity_id: UUID of affected record
  - action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE"
  - old_values: previous state (null for CREATE)
  - new_values: new state
  - created_at: server timestamp (UTC)
```

### AC-9.2: Pagination

```
GIVEN 250 vehicles exist in the system
WHEN user requests GET /api/v1/vehicles?page=2&per_page=20
THEN response contains exactly 20 vehicles (records 21-40)
AND meta shows: {page: 2, per_page: 20, total: 250, total_pages: 13}
```

### AC-9.3: Input Validation — Global

```
GIVEN any API endpoint receiving user input
WHEN the input fails validation
THEN the system returns HTTP 422 with structured error:
  {success: false, error: {code: "VALIDATION_ERROR",
   message: "Validation failed", details: [{field: "cargo_weight",
   message: "Must be greater than 0", received: -50}]}}
AND no database mutation occurs
```

### AC-9.4: Responsive Design — Mobile

```
GIVEN a user accessing TransitOps on a 375px-wide device
WHEN they navigate to the vehicle list
THEN vehicles display as cards (not table rows)
AND all actions are accessible via touch
AND no horizontal scrolling required for primary content
```

### AC-9.5: Dark Mode

```
GIVEN user has system preference set to dark mode
WHEN they load TransitOps
THEN the interface renders with dark theme
AND all text meets WCAG AA contrast ratios
AND charts use colors visible on dark backgrounds
AND user can toggle to light mode via settings
```
