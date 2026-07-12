# TransitOps — Sample Data

## Overview

This document defines the sample dataset used for demos, testing, and development. All data is designed to showcase business rules, edge cases, and realistic operational scenarios.

---

## Users & Roles

### Roles

| ID | Role Name | Permissions Summary |
|----|-----------|-------------------|
| 1 | Fleet Manager | Full access to vehicles, drivers, maintenance, reports |
| 2 | Dispatcher | Trips CRUD, view vehicles/drivers, fuel logs |
| 3 | Safety Officer | Driver management, compliance, safety scores |
| 4 | Financial Analyst | Expenses, fuel logs, reports, analytics |
| 5 | System Admin | Full system access including user management |

### Users

| Email | Password | Role | Name |
|-------|----------|------|------|
| fleet@transitops.io | Transit@2026 | Fleet Manager | Rajesh Kumar |
| dispatch@transitops.io | Transit@2026 | Dispatcher | Priya Sharma |
| safety@transitops.io | Transit@2026 | Safety Officer | Amit Patel |
| finance@transitops.io | Transit@2026 | Financial Analyst | Meera Desai |
| admin@transitops.io | Transit@2026 | System Admin | System Admin |

---

## Vehicles (15 records)

| Reg Number | Name | Type | Capacity (kg) | Odometer (km) | Cost (₹) | Status | Region |
|-----------|------|------|:---:|:---:|:---:|--------|--------|
| MH-12-AB-1001 | Express Van 01 | Van | 500 | 45,230 | 8,50,000 | Available | Mumbai |
| MH-12-AB-1002 | Express Van 02 | Van | 500 | 67,800 | 8,50,000 | On Trip | Mumbai |
| MH-12-AB-1003 | Express Van 03 | Van | 750 | 23,100 | 9,50,000 | Available | Mumbai |
| MH-14-CD-2001 | Heavy Truck 01 | Truck | 5000 | 1,20,450 | 25,00,000 | Available | Pune |
| MH-14-CD-2002 | Heavy Truck 02 | Truck | 5000 | 1,45,000 | 25,00,000 | In Shop | Pune |
| MH-14-CD-2003 | Heavy Truck 03 | Truck | 8000 | 89,200 | 35,00,000 | On Trip | Pune |
| KA-01-EF-3001 | City Sedan 01 | Sedan | 200 | 34,500 | 6,50,000 | Available | Bangalore |
| KA-01-EF-3002 | City Sedan 02 | Sedan | 200 | 56,780 | 6,50,000 | Available | Bangalore |
| MH-12-GH-4001 | Transit Bus 01 | Bus | 2000 | 2,10,000 | 45,00,000 | Available | Mumbai |
| MH-14-GH-4002 | Transit Bus 02 | Bus | 2000 | 1,80,500 | 45,00,000 | In Shop | Pune |
| DL-01-IJ-5001 | Express Van 04 | Van | 600 | 15,200 | 9,00,000 | Available | Delhi |
| DL-01-IJ-5002 | Express Van 05 | Van | 600 | 8,900 | 9,00,000 | Available | Delhi |
| MH-12-KL-6001 | Heavy Truck 04 | Truck | 10000 | 78,000 | 40,00,000 | Retired | Mumbai |
| KA-01-MN-7001 | City Sedan 03 | Sedan | 250 | 12,300 | 7,00,000 | Available | Bangalore |
| MH-14-OP-8001 | Express Van 06 | Van | 500 | 92,000 | 8,50,000 | Available | Pune |

**Summary:** 15 vehicles — 9 Available, 2 On Trip, 2 In Shop, 1 Retired, 1 Available (high mileage for health score demo)

---

## Drivers (12 records)

| Name | License # | Category | Expiry | Contact | Score | Status |
|------|-----------|----------|--------|---------|:---:|--------|
| Alex Kumar | DL-MH-2020-001 | HMV | 2027-08-15 | +919876543001 | 92 | Available |
| Ravi Patel | DL-MH-2020-002 | HMV | 2027-03-20 | +919876543002 | 88 | On Trip |
| Suresh Yadav | DL-MH-2019-003 | LMV | 2026-07-25 | +919876543003 | 95 | Available |
| Mohan Singh | DL-MH-2021-004 | HMV | 2028-01-10 | +919876543004 | 75 | Available |
| Vijay Sharma | DL-KA-2020-005 | LMV | 2026-07-05 | +919876543005 | 60 | Available |
| Amit Verma | DL-MH-2018-006 | HMV | 2025-12-31 | +919876543006 | 45 | Suspended |
| Rakesh Gupta | DL-DL-2021-007 | HMV | 2028-06-30 | +919876543007 | 100 | Available |
| Deepak Joshi | DL-MH-2020-008 | LMV | 2027-11-15 | +919876543008 | 82 | Off Duty |
| Kiran Patil | DL-KA-2022-009 | HMV | 2029-02-28 | +919876543009 | 97 | Available |
| Sanjay Mishra | DL-MH-2019-010 | HMV | 2026-08-01 | +919876543010 | 70 | On Trip |
| Arun Nair | DL-KA-2021-011 | LMV | 2028-04-20 | +919876543011 | 85 | Available |
| Prakash Reddy | DL-MH-2020-012 | HMV | 2026-07-19 | +919876543012 | 78 | Available |

**Key Demo Scenarios:**
- **Vijay Sharma:** License expired (2026-07-05) — will be BLOCKED from dispatch
- **Amit Verma:** Suspended status — cannot be assigned
- **Suresh Yadav:** License expiring in 13 days — AMBER warning
- **Prakash Reddy:** License expiring in 7 days — RED warning
- **Ravi Patel:** Currently On Trip — cannot be re-assigned

---

## Trips (20 records)

| Trip # | Source | Destination | Vehicle | Driver | Cargo (kg) | Distance (km) | Status |
|--------|--------|-------------|---------|--------|:---:|:---:|--------|
| TRP-20260710-0001 | Mumbai Port | Pune Warehouse | MH-12-AB-1002 | Ravi Patel | 450 | 150 | Dispatched |
| TRP-20260710-0002 | Pune Hub | Bangalore DC | MH-14-CD-2003 | Sanjay Mishra | 4500 | 840 | Dispatched |
| TRP-20260711-0001 | Mumbai Port | Thane | MH-12-AB-1001 | Alex Kumar | 380 | 35 | Completed |
| TRP-20260711-0002 | Delhi Depot | Noida Hub | DL-01-IJ-5001 | Rakesh Gupta | 550 | 28 | Completed |
| TRP-20260711-0003 | Bangalore DC | Mysore WH | KA-01-EF-3001 | Kiran Patil | 180 | 145 | Completed |
| TRP-20260711-0004 | Mumbai Port | Nashik | MH-12-AB-1003 | Mohan Singh | 700 | 165 | Completed |
| TRP-20260709-0001 | Pune Hub | Mumbai Port | MH-14-CD-2001 | Alex Kumar | 4800 | 150 | Completed |
| TRP-20260709-0002 | Delhi Depot | Jaipur WH | DL-01-IJ-5002 | Rakesh Gupta | 500 | 270 | Completed |
| TRP-20260708-0001 | Bangalore DC | Chennai Port | KA-01-EF-3002 | Arun Nair | 190 | 350 | Completed |
| TRP-20260708-0002 | Mumbai Port | Pune Warehouse | MH-12-AB-1001 | Suresh Yadav | 480 | 150 | Completed |
| TRP-20260712-0001 | Mumbai Port | Pune Warehouse | — | — | 400 | 150 | Draft |
| TRP-20260712-0002 | Delhi Depot | Agra Hub | — | — | 550 | 200 | Draft |
| TRP-20260712-0003 | Bangalore DC | Hyderabad | — | — | 4000 | 570 | Draft |
| TRP-20260707-0001 | Pune Hub | Goa | MH-14-OP-8001 | Prakash Reddy | 450 | 450 | Completed |
| TRP-20260707-0002 | Mumbai Port | Surat | MH-12-AB-1003 | Mohan Singh | 600 | 280 | Cancelled |
| TRP-20260706-0001 | Delhi Depot | Chandigarh | DL-01-IJ-5001 | Rakesh Gupta | 580 | 250 | Completed |
| TRP-20260706-0002 | Bangalore DC | Kochi | KA-01-MN-7001 | Arun Nair | 220 | 530 | Completed |
| TRP-20260705-0001 | Mumbai Port | Nagpur | MH-14-CD-2001 | Alex Kumar | 4200 | 780 | Completed |
| TRP-20260704-0001 | Pune Hub | Aurangabad | MH-12-AB-1001 | Suresh Yadav | 420 | 230 | Completed |
| TRP-20260703-0001 | Mumbai Port | Pune Warehouse | MH-12-AB-1002 | Ravi Patel | 490 | 150 | Completed |

**Summary:** 20 trips — 2 Dispatched (active), 3 Draft (pending), 14 Completed, 1 Cancelled

---

## Maintenance Records (6 records)

| Vehicle | Type | Description | Cost (₹) | Status | Start | End |
|---------|------|-------------|:---:|--------|-------|-----|
| MH-14-CD-2002 | Engine Repair | Turbo replacement | 45,000 | Active | 2026-07-10 | — |
| MH-14-GH-4002 | Brake Service | Brake pad replacement + alignment | 12,000 | Active | 2026-07-11 | — |
| MH-12-AB-1001 | Oil Change | Routine 10,000 km service | 2,500 | Completed | 2026-07-01 | 2026-07-02 |
| MH-14-CD-2003 | Tire Replacement | All 6 tires replaced | 1,20,000 | Completed | 2026-06-28 | 2026-06-30 |
| MH-12-KL-6001 | Final Inspection | Pre-retirement inspection | 5,000 | Completed | 2026-06-15 | 2026-06-16 |
| MH-12-AB-1002 | AC Repair | Compressor replacement | 18,000 | Completed | 2026-06-20 | 2026-06-22 |

**Key:** 2 Active records → those vehicles are "In Shop"

---

## Fuel Logs (25 records)

| Vehicle | Trip | Liters | Cost (₹) | Odometer | Date |
|---------|------|:---:|:---:|:---:|------|
| MH-12-AB-1001 | TRP-20260711-0001 | 4.5 | 450 | 45,230 | 2026-07-11 |
| MH-12-AB-1001 | TRP-20260708-0002 | 18.0 | 1,800 | 45,195 | 2026-07-08 |
| MH-12-AB-1001 | TRP-20260704-0001 | 25.5 | 2,550 | 45,045 | 2026-07-04 |
| MH-12-AB-1002 | TRP-20260703-0001 | 16.5 | 1,650 | 67,800 | 2026-07-03 |
| MH-12-AB-1003 | TRP-20260711-0004 | 18.0 | 1,800 | 23,100 | 2026-07-11 |
| MH-12-AB-1003 | — | 45.0 | 4,500 | 22,935 | 2026-07-06 |
| MH-14-CD-2001 | TRP-20260709-0001 | 35.0 | 3,500 | 1,20,450 | 2026-07-09 |
| MH-14-CD-2001 | TRP-20260705-0001 | 95.0 | 9,500 | 1,20,300 | 2026-07-05 |
| MH-14-CD-2003 | — | 80.0 | 8,000 | 89,200 | 2026-07-10 |
| KA-01-EF-3001 | TRP-20260711-0003 | 12.0 | 1,200 | 34,500 | 2026-07-11 |
| KA-01-EF-3002 | TRP-20260708-0001 | 32.0 | 3,200 | 56,780 | 2026-07-08 |
| DL-01-IJ-5001 | TRP-20260711-0002 | 3.5 | 350 | 15,200 | 2026-07-11 |
| DL-01-IJ-5001 | TRP-20260706-0001 | 28.0 | 2,800 | 15,172 | 2026-07-06 |
| DL-01-IJ-5002 | TRP-20260709-0002 | 30.0 | 3,000 | 8,900 | 2026-07-09 |
| MH-14-OP-8001 | TRP-20260707-0001 | 50.0 | 5,000 | 92,000 | 2026-07-07 |
| KA-01-MN-7001 | TRP-20260706-0002 | 42.0 | 4,200 | 12,300 | 2026-07-06 |
| MH-12-AB-1001 | — | 40.0 | 4,000 | 44,815 | 2026-07-01 |
| MH-12-AB-1002 | — | 42.0 | 4,200 | 67,650 | 2026-06-30 |
| MH-14-CD-2001 | — | 100.0 | 10,000 | 1,19,520 | 2026-06-28 |
| MH-12-AB-1003 | — | 55.0 | 5,500 | 22,770 | 2026-06-25 |
| MH-14-CD-2003 | — | 85.0 | 8,500 | 88,360 | 2026-06-28 |
| DL-01-IJ-5001 | — | 35.0 | 3,500 | 14,922 | 2026-06-25 |
| KA-01-EF-3001 | — | 15.0 | 1,500 | 34,355 | 2026-06-20 |
| KA-01-EF-3002 | — | 18.0 | 1,800 | 56,430 | 2026-06-20 |
| MH-14-OP-8001 | — | 48.0 | 4,800 | 91,550 | 2026-06-25 |

---

## Expenses (15 records)

| Vehicle | Category | Amount (₹) | Description | Date |
|---------|----------|:---:|-------------|------|
| MH-12-AB-1001 | Toll | 350 | Mumbai-Thane toll | 2026-07-11 |
| MH-14-CD-2001 | Toll | 1,200 | Pune-Mumbai expressway | 2026-07-09 |
| MH-14-CD-2003 | Toll | 2,800 | Pune-Bangalore highway | 2026-07-10 |
| MH-12-AB-1003 | Toll | 850 | Mumbai-Nashik toll | 2026-07-11 |
| DL-01-IJ-5001 | Toll | 450 | Delhi-Noida | 2026-07-11 |
| MH-14-OP-8001 | Toll | 1,500 | Pune-Goa highway | 2026-07-07 |
| KA-01-MN-7001 | Toll | 1,800 | Bangalore-Kochi | 2026-07-06 |
| MH-12-AB-1001 | Insurance | 25,000 | Annual insurance renewal | 2026-07-01 |
| MH-12-AB-1002 | Insurance | 25,000 | Annual insurance renewal | 2026-07-01 |
| MH-14-CD-2001 | Insurance | 45,000 | Annual insurance renewal | 2026-07-01 |
| KA-01-EF-3001 | Other | 1,200 | Parking charges (monthly) | 2026-07-01 |
| MH-12-AB-1001 | Maintenance | 2,500 | Oil change service | 2026-07-02 |
| MH-14-CD-2002 | Maintenance | 45,000 | Turbo replacement parts | 2026-07-10 |
| MH-14-GH-4002 | Maintenance | 12,000 | Brake service | 2026-07-11 |
| — | Other | 5,000 | Fleet GPS subscription (monthly) | 2026-07-01 |

---

## Calculated Metrics (Expected Values)

### Dashboard KPIs

| KPI | Value | Calculation |
|-----|:---:|-------------|
| Active Vehicles | 14 | Total (15) - Retired (1) |
| Available Vehicles | 9 | Status = 'Available' |
| In Maintenance | 2 | Status = 'In Shop' |
| Active Trips | 2 | Status = 'Dispatched' |
| Pending Trips | 3 | Status = 'Draft' |
| Drivers On Duty | 2 | Status = 'On Trip' |
| Fleet Utilization | 16.7% | 2 On Trip / 12 Active non-maintenance × 100 |

### Vehicle Fuel Efficiency (Top 5)

| Vehicle | Total Distance (km) | Total Fuel (L) | Efficiency (km/L) |
|---------|:---:|:---:|:---:|
| DL-01-IJ-5001 | 278 | 31.5 | 8.83 |
| KA-01-EF-3001 | 145 | 12.0 | 12.08 |
| MH-12-AB-1001 | 415 | 48.0 | 8.65 |
| MH-12-AB-1003 | 165 | 18.0 | 9.17 |
| MH-14-CD-2001 | 930 | 130.0 | 7.15 |

### Vehicle Health Scores

| Vehicle | Score | Factors | Recommendation |
|---------|:---:|---------|----------------|
| DL-01-IJ-5002 | 95 | Low mileage, new, no issues | None |
| KA-01-MN-7001 | 90 | Low mileage, recent service | None |
| MH-12-AB-1001 | 82 | Moderate mileage, recently serviced | None |
| MH-14-CD-2001 | 65 | High mileage (1.2L km), heavy use | Schedule inspection |
| MH-14-OP-8001 | 52 | High mileage (92K), fuel anomaly | Urgent: investigate fuel consumption |
| MH-12-KL-6001 | 20 | Retired, end of life | Dispose/sell |

### Fuel Anomaly Alerts

| Vehicle | Baseline (km/L) | Current (km/L) | Deviation | Alert |
|---------|:---:|:---:|:---:|-------|
| MH-14-OP-8001 | 11.2 | 9.0 | -19.6% | ⚠️ Near threshold |
| MH-14-CD-2003 | 10.5 | 8.1 | -22.8% | 🔴 Anomaly detected |

---

## Demo Scenarios

### Scenario A: "Happy Path" (Show in Demo)
1. Login as Dispatcher
2. Create trip: Mumbai → Pune, Van-05, Alex Kumar, 450kg
3. Dispatch → statuses change
4. Complete → statuses restore

### Scenario B: "Rule Enforcement" (Show violations)
1. Try 600kg on 500kg vehicle → rejected
2. Try to assign expired-license driver (Vijay) → blocked
3. Try to assign On Trip vehicle → not in dropdown
4. Try to assign Suspended driver (Amit) → not in dropdown

### Scenario C: "Maintenance Flow"
1. Create maintenance for Available vehicle → goes In Shop
2. Try to dispatch that vehicle → not available
3. Close maintenance → returns to Available

### Scenario D: "Analytics Showcase"
1. Dashboard KPIs with filters
2. Fuel efficiency comparison chart
3. Cost breakdown (pie chart)
4. CSV export

### Scenario E: "Innovation Demo"
1. Show Vehicle Health Scores (color-coded)
2. Show Fuel Anomaly alert for MH-14-CD-2003
3. Show predictive maintenance indicator
4. Show fleet optimization suggestions
