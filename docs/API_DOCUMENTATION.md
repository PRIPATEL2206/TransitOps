# TransitOps — API Documentation

## Base URL

```
Development: http://localhost:8000/api/v1
Production:  https://api.transitops.io/api/v1
```

## Authentication

All endpoints except `/auth/login` require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Rate Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Authentication | 20 requests/minute |
| Read operations | 100 requests/minute |
| Write operations | 50 requests/minute |
| Export operations | 10 requests/minute |

---

## Response Format

### Success Response

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

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [
      {
        "field": "cargo_weight",
        "message": "Must be less than or equal to vehicle max capacity (500 kg)",
        "received": 600
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|:-----------:|-------------|
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | No token or expired token |
| `INSUFFICIENT_PERMISSIONS` | 403 | Role doesn't have access |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `DUPLICATE_REGISTRATION` | 409 | Unique constraint violated |
| `RESOURCE_CONFLICT` | 409 | Optimistic lock failed (concurrent modification) |
| `BUSINESS_RULE_VIOLATION` | 422 | Business rule check failed |
| `INVALID_STATE_TRANSITION` | 422 | Status change not allowed |
| `VEHICLE_ON_TRIP` | 422 | Vehicle is already dispatched |
| `DRIVER_ON_TRIP` | 422 | Driver is already dispatched |
| `DRIVER_LICENSE_EXPIRED` | 422 | Driver's license has expired |
| `CARGO_OVERWEIGHT` | 422 | Weight exceeds vehicle capacity |
| `VEHICLE_IN_MAINTENANCE` | 422 | Vehicle is in shop |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### 1. Authentication

#### POST /auth/login

Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "email": "fleet@transitops.io",
  "password": "Transit@2026"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "email": "fleet@transitops.io",
      "full_name": "Rajesh Kumar",
      "role": "Fleet Manager"
    }
  }
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "new_token...",
    "refresh_token": "new_refresh_token...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

#### GET /auth/me

Get current authenticated user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "fleet@transitops.io",
    "full_name": "Rajesh Kumar",
    "role": {
      "id": "uuid",
      "name": "Fleet Manager",
      "permissions": ["vehicles:read", "vehicles:write", "drivers:read", ...]
    },
    "is_active": true,
    "last_login": "2026-07-12T09:30:00Z"
  }
}
```

---

### 2. Vehicles

#### GET /vehicles

List all vehicles with pagination and filters.

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | int | Page number (default: 1) | `?page=2` |
| `per_page` | int | Items per page (default: 20, max: 100) | `?per_page=50` |
| `status` | string | Filter by status | `?status=Available` |
| `type` | string | Filter by vehicle type | `?type=Van` |
| `region` | string | Filter by region | `?region=Mumbai` |
| `search` | string | Search registration/name | `?search=Van-05` |
| `sort_by` | string | Sort field | `?sort_by=created_at` |
| `sort_order` | string | asc or desc | `?sort_order=desc` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "registration_number": "MH-12-AB-1001",
      "name": "Express Van 01",
      "type": "Van",
      "max_load_capacity": 500.00,
      "current_odometer": 45230.00,
      "acquisition_cost": 850000.00,
      "status": "Available",
      "region": "Mumbai",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-07-11T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

#### POST /vehicles

Create a new vehicle.

**Request:**
```json
{
  "registration_number": "MH-12-XY-9999",
  "name": "Express Van 12",
  "type": "Van",
  "max_load_capacity": 750.00,
  "current_odometer": 0,
  "acquisition_cost": 950000.00,
  "region": "Mumbai"
}
```

**Response (201):** Created vehicle object

#### GET /vehicles/{id}

Get vehicle details by ID.

**Response (200):** Single vehicle object with additional fields:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "registration_number": "MH-12-AB-1001",
    "...": "...",
    "total_trips": 45,
    "total_distance": 12500.00,
    "total_fuel_cost": 45000.00,
    "total_maintenance_cost": 15000.00,
    "fuel_efficiency": 10.2,
    "health_score": 82
  }
}
```

#### PUT /vehicles/{id}

Update vehicle details.

**Request (partial update allowed):**
```json
{
  "name": "Express Van 01 (Updated)",
  "current_odometer": 45500.00
}
```

#### DELETE /vehicles/{id}

Soft-delete a vehicle (sets `is_deleted = true`).

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Vehicle soft-deleted successfully" }
}
```

#### GET /vehicles/available

List vehicles available for dispatch (status = "Available" only).

**Response (200):** Array of available vehicles with capacity info

---

### 3. Drivers

#### GET /drivers

List all drivers with pagination and filters.

**Query Parameters:** Similar to vehicles (`page`, `per_page`, `status`, `search`, `sort_by`, `sort_order`)

Additional filter:
| Parameter | Type | Description |
|-----------|------|-------------|
| `license_status` | string | `valid`, `expiring_soon`, `expired` |

#### POST /drivers

Create a new driver.

**Request:**
```json
{
  "name": "Alex Kumar",
  "license_number": "DL-MH-2020-001",
  "license_category": "HMV",
  "license_expiry": "2027-08-15",
  "contact_number": "+919876543001"
}
```

#### GET /drivers/available

List drivers eligible for dispatch (Available + valid license).

#### GET /drivers/{id}/performance

Get driver performance metrics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "driver_id": "uuid",
    "total_trips": 28,
    "completed_trips": 26,
    "cancelled_trips": 2,
    "total_distance": 8500.00,
    "average_fuel_efficiency": 11.2,
    "safety_score": 92,
    "on_time_percentage": 95.5,
    "score_trend": [
      {"month": "2026-02", "score": 88},
      {"month": "2026-03", "score": 90},
      {"month": "2026-04", "score": 91},
      {"month": "2026-05", "score": 92}
    ]
  }
}
```

---

### 4. Trips

#### GET /trips

List trips with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `Draft`, `Dispatched`, `Completed`, `Cancelled` |
| `vehicle_id` | uuid | Filter by vehicle |
| `driver_id` | uuid | Filter by driver |
| `date_from` | date | Trip created after |
| `date_to` | date | Trip created before |

#### POST /trips

Create a new trip (Draft status).

**Request:**
```json
{
  "source": "Mumbai Port",
  "destination": "Pune Warehouse",
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "cargo_weight": 450.00,
  "planned_distance": 150.00
}
```

**Validations:**
- source ≠ destination
- cargo_weight > 0
- planned_distance > 0
- vehicle exists and is not deleted
- driver exists and is not deleted

#### POST /trips/{id}/dispatch

Dispatch a Draft trip. This is the critical atomic operation.

**Validations (all must pass):**
1. Trip status = "Draft"
2. Vehicle status = "Available" (with optimistic lock)
3. Driver status = "Available" (with optimistic lock)
4. Driver license_expiry > today
5. Trip cargo_weight ≤ vehicle max_load_capacity

**Side Effects (atomic):**
- Trip status → "Dispatched"
- Vehicle status → "On Trip"
- Driver status → "On Trip"
- Trip dispatched_at = now()

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trip_number": "TRP-20260712-0001",
    "status": "Dispatched",
    "dispatched_at": "2026-07-12T10:30:00Z",
    "vehicle": { "id": "uuid", "registration_number": "MH-12-AB-1001", "status": "On Trip" },
    "driver": { "id": "uuid", "name": "Alex Kumar", "status": "On Trip" }
  }
}
```

**Error Response (409 - Race Condition):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "Vehicle MH-12-AB-1001 was just assigned to another trip. Please refresh and try again."
  }
}
```

#### POST /trips/{id}/complete

Complete a dispatched trip.

**Request:**
```json
{
  "final_odometer": 45150.00,
  "fuel_consumed": 18.5,
  "actual_distance": 148.00
}
```

**Validations:**
- Trip status = "Dispatched"
- final_odometer ≥ vehicle current_odometer
- fuel_consumed ≥ 0

**Side Effects (atomic):**
- Trip status → "Completed"
- Vehicle status → "Available"
- Vehicle odometer → final_odometer
- Driver status → "Available"
- Auto-create fuel_log if fuel_consumed > 0
- Trip completed_at = now()

#### POST /trips/{id}/cancel

Cancel a trip (Draft or Dispatched).

**Request:**
```json
{
  "reason": "Client cancelled the order"
}
```

**Validations:**
- Trip status = "Draft" or "Dispatched"
- Reason required if status = "Dispatched"

**Side Effects (if Dispatched):**
- Vehicle status → "Available"
- Driver status → "Available"
- Trip cancelled_at = now()

---

### 5. Maintenance

#### GET /maintenance

List maintenance records.

**Query Parameters:** `vehicle_id`, `status` (Active/Completed), `page`, `per_page`

#### POST /maintenance

Create a maintenance record.

**Request:**
```json
{
  "vehicle_id": "uuid",
  "maintenance_type": "Oil Change",
  "description": "Routine 10,000 km service",
  "cost": 2500.00,
  "start_date": "2026-07-12"
}
```

**Validations:**
- Vehicle exists and is not On Trip
- cost ≥ 0
- start_date is valid

**Side Effects:**
- Maintenance created with status "Active"
- Vehicle status → "In Shop"

#### POST /maintenance/{id}/close

Close a maintenance record.

**Request (optional):**
```json
{
  "end_date": "2026-07-14",
  "final_cost": 3000.00
}
```

**Side Effects:**
- Maintenance status → "Completed"
- If no other active maintenance for vehicle AND vehicle ≠ Retired: Vehicle status → "Available"

---

### 6. Fuel Logs

#### GET /fuel-logs

List fuel log entries.

**Query Parameters:** `vehicle_id`, `trip_id`, `date_from`, `date_to`, `page`, `per_page`

#### POST /fuel-logs

Create a fuel log entry.

**Request:**
```json
{
  "vehicle_id": "uuid",
  "trip_id": "uuid (optional)",
  "liters": 45.5,
  "cost": 4550.00,
  "odometer_reading": 45400.00,
  "date": "2026-07-12"
}
```

**Validations:**
- liters > 0
- cost > 0
- odometer_reading ≥ vehicle current_odometer

**Side Effects:**
- Vehicle odometer updated to odometer_reading

---

### 7. Expenses

#### GET /expenses

List expenses with filters.

#### POST /expenses

Create an expense record.

**Request:**
```json
{
  "vehicle_id": "uuid (optional)",
  "trip_id": "uuid (optional)",
  "category": "Toll",
  "amount": 350.00,
  "description": "Mumbai-Thane toll",
  "date": "2026-07-12"
}
```

#### GET /expenses/summary

Get expense summary by category and period.

**Query Parameters:** `date_from`, `date_to`, `vehicle_id`, `group_by` (category/vehicle/month)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 168350.00,
    "by_category": [
      { "category": "Fuel", "amount": 96500.00, "percentage": 57.3 },
      { "category": "Maintenance", "amount": 47000.00, "percentage": 27.9 },
      { "category": "Toll", "amount": 8950.00, "percentage": 5.3 },
      { "category": "Insurance", "amount": 95000.00, "percentage": 56.4 },
      { "category": "Other", "amount": 6200.00, "percentage": 3.7 }
    ],
    "by_month": [
      { "month": "2026-06", "amount": 45000.00 },
      { "month": "2026-07", "amount": 123350.00 }
    ]
  }
}
```

---

### 8. Analytics & Reports

#### GET /analytics/dashboard

Get dashboard KPI data.

**Query Parameters:** `vehicle_type`, `region`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "active_vehicles": 14,
    "available_vehicles": 9,
    "in_maintenance": 2,
    "on_trip_vehicles": 2,
    "active_trips": 2,
    "pending_trips": 3,
    "drivers_on_duty": 2,
    "fleet_utilization": 16.7,
    "total_drivers": 12,
    "total_vehicles": 15
  }
}
```

#### GET /analytics/fleet-utilization

Get fleet utilization over time.

**Query Parameters:** `days` (default: 30), `vehicle_type`

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "date": "2026-06-12", "utilization": 65.2, "on_trip": 8, "total_active": 12 },
    { "date": "2026-06-13", "utilization": 72.1, "on_trip": 9, "total_active": 12 },
    "..."
  ]
}
```

#### GET /analytics/fuel-efficiency

Get fuel efficiency metrics per vehicle.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "vehicle_id": "uuid",
      "registration_number": "MH-12-AB-1001",
      "total_distance": 5000.00,
      "total_fuel": 400.00,
      "efficiency": 12.5,
      "fleet_average": 10.2,
      "trend": "improving"
    }
  ]
}
```

#### GET /analytics/vehicle-roi

Get ROI per vehicle.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "vehicle_id": "uuid",
      "registration_number": "MH-12-AB-1001",
      "acquisition_cost": 850000.00,
      "total_revenue": 120000.00,
      "total_fuel_cost": 45000.00,
      "total_maintenance_cost": 15000.00,
      "net_profit": 60000.00,
      "roi_percentage": 7.06
    }
  ]
}
```

#### GET /reports/export/csv

Export report data as CSV file.

**Query Parameters:** `report_type` (trips/vehicles/expenses/fuel), `date_from`, `date_to`, `vehicle_id`

**Response:** CSV file download (Content-Type: text/csv)

---

## WebSocket (Future)

```
ws://localhost:8000/ws/dashboard

// Receives:
{
  "event": "kpi_update",
  "data": { "fleet_utilization": 80.5 }
}

{
  "event": "trip_status_change",
  "data": { "trip_id": "uuid", "old_status": "Draft", "new_status": "Dispatched" }
}
```
