# TransitOps — Edge Cases & Boundary Conditions

## Overview

This document catalogs all identified edge cases, boundary conditions, and exceptional scenarios that the system must handle gracefully. Each case includes the expected behavior and the rationale behind the decision.

---

## 1. Concurrency Edge Cases

### EC-C001: Simultaneous Vehicle Dispatch

**Scenario:** Two dispatchers attempt to dispatch different trips using the same vehicle within milliseconds of each other.

**Expected Behavior:**
- First transaction to commit wins
- Second receives HTTP 409 Conflict: `"Vehicle VAN-05 was just assigned to another trip. Please select a different vehicle."`
- UI refreshes available vehicle list

**Implementation:** Optimistic locking with `version` column. The dispatch transaction does:
```sql
UPDATE vehicles 
SET status = 'On Trip', version = version + 1 
WHERE id = $1 AND version = $2 AND status = 'Available';
-- If rows_affected = 0, raise ConflictError
```

### EC-C002: Simultaneous Driver Dispatch

**Scenario:** Same driver selected for two trips being dispatched concurrently.

**Expected Behavior:** Identical to EC-C001 but for the driver entity.

### EC-C003: Maintenance Created During Dispatch

**Scenario:** Fleet Manager creates maintenance for a vehicle at the same moment a Dispatcher is dispatching it.

**Expected Behavior:**
- Transaction ordering determines winner
- If maintenance commits first: dispatch fails with "Vehicle is In Shop"
- If dispatch commits first: maintenance creation fails with "Cannot create maintenance for vehicle on trip"

### EC-C004: Trip Completed Twice

**Scenario:** Network timeout causes user to submit completion form twice.

**Expected Behavior:**
- First request completes successfully
- Second request returns 422: "Trip is already completed"
- Idempotency: no duplicate side effects (vehicle/driver status not toggled)

---

## 2. Vehicle Edge Cases

### EC-V001: Zero Load Capacity

**Scenario:** Admin enters 0 or negative max load capacity.

**Expected Behavior:** Rejected at validation. `max_load_capacity` must be > 0.

**Rationale:** A vehicle with 0 capacity cannot carry cargo, making it useless for trips.

### EC-V002: Odometer Rollback Attempt

**Scenario:** Fuel log submitted with odometer reading lower than vehicle's current reading.

**Expected Behavior:** 
- Rejected: "Odometer reading (45,230 km) cannot be less than current reading (45,500 km)"
- Exception: Fleet Manager can override with a reason (logged to audit)

**Rationale:** Odometers only go forward. A lower reading indicates data entry error or fraud.

### EC-V003: Registration Number Format

**Scenario:** Vehicle registered with special characters: `VAN@05!#`

**Expected Behavior:** 
- Allowed characters: Uppercase letters, digits, hyphens, spaces
- Auto-uppercase on input
- Regex: `^[A-Z0-9][A-Z0-9\- ]{1,18}[A-Z0-9]$`
- Trimmed and normalized before uniqueness check

### EC-V004: Retire Vehicle with Active Maintenance

**Scenario:** Fleet Manager tries to retire a vehicle that's currently "In Shop."

**Expected Behavior:**
- Rejected: "Cannot retire vehicle while maintenance is active. Close all maintenance records first."
- Workflow: Close maintenance → then retire

**Rationale:** Maintenance closure logic checks retirement status; allowing both simultaneously creates circular dependency.

### EC-V005: Vehicle Deleted with Pending Trips

**Scenario:** Fleet Manager deletes a vehicle that has Draft trips assigned to it.

**Expected Behavior:**
- Soft delete the vehicle (is_deleted = true)
- Draft trips referencing this vehicle: set vehicle_id = null, add note "Original vehicle removed"
- Vehicle no longer appears in any selection dropdown
- Historical completed trips still show the vehicle data (preserved via soft delete)

### EC-V006: Bulk Status Change

**Scenario:** 50 vehicles need retirement at end of fiscal year.

**Expected Behavior:**
- Each processed individually with full validation
- Partial success allowed: successful ones retire, failed ones return with reasons
- Summary: "45 vehicles retired. 5 failed: [VAN-03: active trip, TRUCK-12: active maintenance, ...]"

### EC-V007: Maximum Odometer Value

**Scenario:** Odometer reaches 999,999.99 km.

**Expected Behavior:** Allow up to DECIMAL(12,2) max (9,999,999,999.99 km). No practical limit for fleet operations.

---

## 3. Driver Edge Cases

### EC-D001: License Expires During Active Trip

**Scenario:** Driver's license expiry date passes while they're on an active trip.

**Expected Behavior:**
- Do NOT auto-cancel the trip mid-journey (safety risk of stopping mid-route)
- Allow trip completion
- After completion: driver status = "Available" but flagged with expired license warning
- System creates urgent notification: "Driver {name}'s license expired on {date}. Remove from dispatch pool."
- Next dispatch attempt will be blocked (BR-D001)

**Rationale:** Safety of cargo and driver takes precedence over compliance during active transit.

### EC-D002: Safety Score Below Threshold

**Scenario:** Driver's safety score drops below 50.

**Expected Behavior:**
- 🟡 Score < 70: Warning badge on driver profile
- 🟠 Score < 50: Advisory notification to Safety Officer
- 🔴 Score < 30: Recommend suspension (requires manual action by Safety Officer)
- Score does NOT auto-suspend; human decision required

### EC-D003: Driver with No Completed Trips

**Scenario:** Newly registered driver has no trip history; safety score calculation divides by trip count.

**Expected Behavior:**
- Default safety score = 100 (benefit of the doubt)
- Fuel efficiency = "No data"
- Performance metrics show "Insufficient data" until 5+ trips completed

### EC-D004: Duplicate License Number

**Scenario:** Two drivers registered with the same license number.

**Expected Behavior:**
- Rejected at creation: "A driver with license number {number} already exists"
- DB UNIQUE constraint as final guard
- Check includes soft-deleted drivers (license numbers are government-issued, don't recycle)

### EC-D005: Contact Number Format

**Scenario:** Drivers from different countries with varying phone number formats.

**Expected Behavior:**
- Store in E.164 format: `+{country_code}{number}`
- Display formatted per locale
- Validation: 7-15 digits, optional leading `+`
- Example inputs accepted: "+919876543210", "9876543210", "+1-555-123-4567"

### EC-D006: Suspended Driver Reinstatement

**Scenario:** Safety Officer reinstates a previously suspended driver.

**Expected Behavior:**
- Status changes from "Suspended" → "Available"
- Safety score reset to 60 (partial credit on reinstatement)
- Audit log records reinstatement with officer's ID and reason
- Email notification sent to driver

---

## 4. Trip Edge Cases

### EC-T001: Cargo Weight Exactly Equals Max Capacity

**Scenario:** Vehicle max capacity = 500 kg, trip cargo weight = 500 kg.

**Expected Behavior:** **ALLOWED.** The boundary is inclusive: `cargo_weight <= max_load_capacity`.

**Rationale:** "Maximum" means the vehicle can carry up to that amount. Equal is valid.

### EC-T002: Trip Source Equals Destination (Case Sensitivity)

**Scenario:** Source = "Mumbai Port" and Destination = "MUMBAI PORT".

**Expected Behavior:**
- Comparison is case-insensitive and whitespace-trimmed
- Rejected: "Source and destination cannot be the same"
- Comparison: `source.trim().toLowerCase() === destination.trim().toLowerCase()`

### EC-T003: Dispatched Trip — Driver Becomes Unavailable

**Scenario:** After dispatch, driver is involved in an incident and becomes incapacitated.

**Expected Behavior:**
- Fleet Manager / Dispatcher can cancel the trip (with reason: "Driver emergency")
- Vehicle and driver status restored to Available
- If replacement needed: create new trip with same details, different driver

### EC-T004: Trip Completion with Zero Fuel

**Scenario:** Electric vehicle completes trip, fuel consumed = 0.

**Expected Behavior:**
- **ALLOWED.** `fuel_consumed` can be 0 (but not negative)
- Fuel efficiency calculation returns "EV" or "N/A" when fuel = 0
- System does not force positive fuel for EVs

### EC-T005: Trip Number Collision

**Scenario:** Two trips created in the same millisecond generate the same trip number.

**Expected Behavior:**
- Trip number uses sequence: `TRP-{YYYYMMDD}-{DB_SEQUENCE}`
- Database sequence guarantees uniqueness even under concurrent inserts
- If collision occurs (should never with sequence), retry with next number

### EC-T006: Extremely Long Trip

**Scenario:** Cross-country trip lasting 15 days (planned distance: 5000 km).

**Expected Behavior:**
- No maximum trip duration enforced (business decision)
- Dashboard reflects vehicle/driver as "On Trip" for entire duration
- Fleet utilization calculation correctly counts long-running trips
- Optional: alert after 7 days for trips expected to complete sooner

### EC-T007: Cancel a Draft Trip

**Scenario:** Trip in Draft status cancelled.

**Expected Behavior:**
- No vehicle/driver status changes (they weren't locked yet in Draft)
- Trip status → Cancelled
- No cancellation reason required (it was never dispatched)

### EC-T008: Final Odometer Less Than Planned Distance

**Scenario:** Trip planned 200 km but actual route was shorter (150 km).

**Expected Behavior:**
- **ALLOWED.** Actual distance can be less than planned (shorter route found)
- Final odometer must be >= vehicle's current odometer (BR-V006)
- System records both planned and actual for analytics

---

## 5. Maintenance Edge Cases

### EC-M001: Multiple Active Maintenance Records

**Scenario:** Vehicle has oil change AND tire replacement happening simultaneously.

**Expected Behavior:**
- Both records created successfully
- Vehicle status = "In Shop" (already was after first record)
- Closing one record: vehicle stays "In Shop" (other record still active)
- Closing last record: vehicle returns to "Available" (unless Retired)

### EC-M002: Maintenance for On-Trip Vehicle

**Scenario:** Fleet Manager tries to create maintenance for vehicle currently on trip.

**Expected Behavior:**
- Rejected: "Cannot schedule maintenance for vehicle currently on trip. Wait for trip completion."
- Alternative: Allow creation with `scheduled_start_date` in the future

### EC-M003: Maintenance Cost = 0

**Scenario:** Oil change performed under warranty, no cost.

**Expected Behavior:** **ALLOWED.** Cost >= 0 is valid. Zero-cost maintenance records are legitimate (warranty, internal labor).

### EC-M004: Maintenance Closed Without End Date

**Scenario:** Closing maintenance record without specifying end date.

**Expected Behavior:**
- Auto-set end_date = CURRENT_DATE
- Log the auto-assignment in audit

### EC-M005: Maintenance on Retired Vehicle

**Scenario:** Creating maintenance record for a Retired vehicle.

**Expected Behavior:**
- **ALLOWED** but unusual (might be final inspection before sale)
- Vehicle stays "Retired" (retirement is terminal for dispatch)
- Maintenance record created successfully
- Note: closing this maintenance does NOT restore to Available (BR-M002 retirement check)

---

## 6. Financial Edge Cases

### EC-F001: Division by Zero in Fuel Efficiency

**Scenario:** Calculating fuel efficiency when total fuel consumed = 0.

**Expected Behavior:**
- Return `null` with display text "N/A"
- Never throw runtime error
- API response: `{ "fuel_efficiency": null, "fuel_efficiency_display": "N/A" }`

### EC-F002: ROI with Zero Acquisition Cost

**Scenario:** Donated vehicle with acquisition_cost = 0.

**Expected Behavior:**
- ROI formula divides by acquisition_cost → division by zero
- Return `null` with display "∞" or "N/A (no acquisition cost)"
- Exclude from aggregate ROI calculations

### EC-F003: Negative ROI

**Scenario:** Vehicle's operational costs exceed its revenue.

**Expected Behavior:**
- **ALLOWED and expected.** Negative ROI is valid business data.
- Display with red indicator: "-15.3%"
- Include in reports and analytics

### EC-F004: Fuel Log Without Trip Association

**Scenario:** Vehicle refueled but not on a specific trip (general top-up).

**Expected Behavior:**
- `trip_id` is nullable in fuel_logs
- Fuel cost still counts toward vehicle's operational cost
- Not included in per-trip fuel efficiency but included in per-vehicle efficiency

### EC-F005: Currency Handling

**Scenario:** Fleet operates in INR but has international expenses.

**Expected Behavior:**
- All monetary values stored in base currency (INR)
- No multi-currency support in v1 (documented limitation)
- Future: add currency field and conversion rates

### EC-F006: Expense Date in the Future

**Scenario:** Expense logged with a future date.

**Expected Behavior:**
- **ALLOWED** for scheduled/pre-paid expenses (insurance renewals)
- Flag in UI: "Future-dated expense"
- Include in reports only when date arrives (or always, configurable)

---

## 7. Authentication Edge Cases

### EC-A001: Concurrent Sessions

**Scenario:** Same user logged in from two browsers simultaneously.

**Expected Behavior:**
- Both sessions valid (stateless JWT)
- Actions from both audit-logged correctly
- No forced single-session (operational staff may use multiple devices)

### EC-A002: Token Expiry During Form Submission

**Scenario:** User fills out a long form; JWT expires before submission.

**Expected Behavior:**
- Frontend intercepts 401 response
- Attempts silent refresh using refresh token
- If refresh succeeds: retry original request transparently
- If refresh fails: redirect to login, preserve form data in localStorage

### EC-A003: Role Changed While User is Active

**Scenario:** Admin changes a user's role from Dispatcher to Safety Officer mid-session.

**Expected Behavior:**
- Current token remains valid until expiry (role embedded in JWT)
- New role takes effect on next token refresh
- For immediate effect: admin can force-invalidate all user's refresh tokens
- Sensitive operations re-verify role from DB (not just JWT claim)

### EC-A004: Deleted User's Existing Data

**Scenario:** User account deactivated; they have audit trail entries and created trips.

**Expected Behavior:**
- User soft-deleted (is_active = false)
- Historical records maintain FK reference (display as "Deactivated User")
- Login blocked immediately
- All refresh tokens invalidated

---

## 8. System Edge Cases

### EC-S001: Database Connection Failure

**Scenario:** PostgreSQL connection pool exhausted or DB server unreachable.

**Expected Behavior:**
- Return HTTP 503 Service Unavailable
- Frontend shows "System temporarily unavailable" banner
- Auto-retry with exponential backoff (3 attempts, 1s/2s/4s)
- Health check endpoint returns degraded status

### EC-S002: Large Dataset Performance

**Scenario:** 10,000 vehicles, 100,000 trips, dashboard takes too long.

**Expected Behavior:**
- Dashboard KPIs use materialized views or cached aggregates (5-minute refresh)
- List endpoints enforce pagination (max 100 per page)
- Search uses database indexes, not full-table scans
- Target: < 2s for dashboard, < 500ms for list pages

### EC-S003: CSV Export of Large Dataset

**Scenario:** User exports 50,000 trip records to CSV.

**Expected Behavior:**
- Streaming response (don't buffer entire file in memory)
- Show progress indicator
- Limit: 100,000 rows per export
- For larger datasets: suggest date-range filtering

### EC-S004: Timezone Handling

**Scenario:** Fleet operates across IST (UTC+5:30) and CST (UTC+8) regions.

**Expected Behavior:**
- All timestamps stored in UTC in database
- Frontend converts to user's local timezone for display
- API accepts and returns ISO 8601 with timezone offset
- Date filters use user's timezone for boundary calculation
