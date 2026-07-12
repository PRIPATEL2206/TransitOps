# TransitOps — User Stories

## Epic 1: Authentication & Access Control

### US-1.1: User Login
**As a** fleet operations team member  
**I want to** log in with my email and password  
**So that** I can access the platform securely  

**Acceptance Criteria:**
- Given valid credentials, user is redirected to dashboard
- Given invalid credentials, error message displayed without revealing which field is wrong
- Session persists across page refreshes (JWT stored securely)
- After 24h inactivity, user is prompted to re-authenticate

### US-1.2: Role-Based Dashboard
**As a** user with an assigned role  
**I want to** see only the features relevant to my role  
**So that** I'm not overwhelmed with irrelevant information  

**Acceptance Criteria:**
- Fleet Manager sees: Vehicles, Drivers, Maintenance, Reports, Dashboard
- Dispatcher sees: Trips, Available Vehicles/Drivers, Dashboard
- Safety Officer sees: Drivers, Compliance alerts, Safety scores
- Financial Analyst sees: Expenses, Fuel logs, ROI reports, Cost analytics

### US-1.3: Session Management
**As a** system administrator  
**I want** user sessions to expire after inactivity  
**So that** unattended workstations don't pose security risks  

**Acceptance Criteria:**
- Access token expires in 24 hours
- Refresh token expires in 7 days
- Expired sessions redirect to login cleanly

---

## Epic 2: Vehicle Management

### US-2.1: Register New Vehicle
**As a** Fleet Manager  
**I want to** register new vehicles in the system  
**So that** they become available for dispatch operations  

**Acceptance Criteria:**
- Form captures: Registration Number, Name/Model, Type, Max Load (kg), Odometer, Acquisition Cost
- Registration number validated for uniqueness in real-time
- Vehicle type selected from: Truck, Van, Sedan, Bus
- New vehicle defaults to "Available" status
- Success: toast notification + redirect to vehicle list

### US-2.2: View Vehicle Fleet
**As a** Fleet Manager  
**I want to** see all vehicles in a searchable, filterable list  
**So that** I can quickly find and assess vehicle status  

**Acceptance Criteria:**
- Table shows: Registration #, Name, Type, Status (color-coded), Capacity, Odometer
- Filter by: type, status, region
- Search by: registration number, name
- Sort by: any column
- Pagination: 20 per page default

### US-2.3: Update Vehicle Details
**As a** Fleet Manager  
**I want to** update vehicle information  
**So that** records stay current as vehicles age  

**Acceptance Criteria:**
- All fields editable except registration number (immutable after creation)
- Odometer can only increase (validation)
- Status change follows state machine rules
- Changes logged in audit trail

### US-2.4: Retire Vehicle
**As a** Fleet Manager  
**I want to** retire a vehicle from active service  
**So that** it no longer appears in dispatch options  

**Acceptance Criteria:**
- Only Available or In Shop vehicles can be retired
- On Trip vehicles cannot be retired (error shown)
- Retired vehicles remain visible in history/reports but excluded from dispatch
- Retirement is irreversible (confirmation dialog required)

### US-2.5: View Vehicle History
**As a** Fleet Manager  
**I want to** see the complete history of a vehicle (trips, maintenance, costs)  
**So that** I can assess its operational performance and make disposal decisions  

**Acceptance Criteria:**
- Timeline view showing: trips completed, maintenance events, fuel logs
- Total operational cost calculated
- ROI displayed
- Fuel efficiency trend chart

---

## Epic 3: Driver Management

### US-3.1: Register New Driver
**As a** Fleet Manager  
**I want to** register drivers with their license details  
**So that** they can be assigned to trips  

**Acceptance Criteria:**
- Form captures: Name, License Number, License Category, Expiry Date, Contact
- License number validated for uniqueness
- Expiry date shows warning if within 30 days
- New driver defaults to "Available" status with safety score 100

### US-3.2: Monitor License Compliance
**As a** Safety Officer  
**I want to** see which drivers have expiring or expired licenses  
**So that** I can take proactive action to maintain compliance  

**Acceptance Criteria:**
- Dashboard widget: "Expiring Licenses" with count and list
- Color coding: 🟡 30 days, 🟠 14 days, 🔴 7 days, ⚫ Expired
- One-click filter to show only non-compliant drivers
- Email notifications sent at 30, 14, 7 day thresholds

### US-3.3: Suspend Driver
**As a** Safety Officer  
**I want to** suspend a driver from dispatch  
**So that** unsafe drivers cannot be assigned to trips  

**Acceptance Criteria:**
- Suspend action requires reason (mandatory text field)
- Suspended driver immediately removed from dispatch pool
- Cannot suspend driver currently On Trip (must wait for completion)
- Audit trail records who suspended and why

### US-3.4: View Driver Performance
**As a** Safety Officer  
**I want to** see driver performance metrics  
**So that** I can identify patterns and provide coaching  

**Acceptance Criteria:**
- Metrics: Total trips, On-time %, Safety score trend, Fuel efficiency per trip
- Comparison against fleet average
- Score breakdown: what caused deductions/additions
- Historical trend (last 6 months)

---

## Epic 4: Trip Management

### US-4.1: Create Trip
**As a** Dispatcher  
**I want to** create a new trip with all required details  
**So that** it can be validated and dispatched  

**Acceptance Criteria:**
- Form: Source, Destination, Vehicle (dropdown), Driver (dropdown), Cargo Weight, Planned Distance
- Vehicle dropdown shows only Available vehicles with capacity info
- Driver dropdown shows only Available drivers with valid licenses
- Source ≠ Destination validation
- Cargo weight ≤ vehicle max capacity (shown dynamically)
- Created trip starts in "Draft" status

### US-4.2: Dispatch Trip
**As a** Dispatcher  
**I want to** dispatch a draft trip  
**So that** the vehicle and driver are officially committed  

**Acceptance Criteria:**
- Dispatch button visible only on Draft trips
- System validates: vehicle available, driver available, license valid, weight valid
- On success: Trip → Dispatched, Vehicle → On Trip, Driver → On Trip
- All three status changes are atomic (all or nothing)
- Vehicle/Driver removed from available pool immediately
- Dispatched timestamp recorded

### US-4.3: Complete Trip
**As a** Dispatcher  
**I want to** record trip completion with actual data  
**So that** we have accurate operational records  

**Acceptance Criteria:**
- Completion form: Final Odometer, Fuel Consumed, Actual Distance (optional)
- Final odometer must be >= vehicle's current odometer
- On success: Trip → Completed, Vehicle → Available, Driver → Available
- Vehicle odometer updated to final reading
- Fuel log auto-created if fuel consumed > 0
- Completed timestamp recorded

### US-4.4: Cancel Trip
**As a** Dispatcher  
**I want to** cancel a trip that cannot proceed  
**So that** the vehicle and driver are freed for other assignments  

**Acceptance Criteria:**
- Cancel available for Draft and Dispatched trips
- Cancelling Dispatched trip: requires reason, restores vehicle/driver to Available
- Cancelling Draft trip: no side effects, reason optional
- Cancelled timestamp recorded
- Cancelled trips visible in history with reason

### US-4.5: View Active Trips
**As a** Dispatcher  
**I want to** see all active (Dispatched) trips at a glance  
**So that** I know the current operational status  

**Acceptance Criteria:**
- Default filter: Dispatched trips
- Shows: Trip #, Route (source→dest), Vehicle, Driver, Cargo, Dispatched time
- Quick actions: Complete, Cancel
- Real-time count in navigation badge

---

## Epic 5: Maintenance Management

### US-5.1: Schedule Maintenance
**As a** Fleet Manager  
**I want to** create a maintenance record for a vehicle  
**So that** it's tracked and the vehicle is marked as unavailable  

**Acceptance Criteria:**
- Form: Vehicle, Type (Oil Change, Tire, Engine, General, etc.), Description, Estimated Cost, Start Date
- Cannot create for On Trip vehicles (error: wait for trip completion)
- On creation: vehicle status automatically → "In Shop"
- Vehicle removed from dispatch pool immediately

### US-5.2: Complete Maintenance
**As a** Fleet Manager  
**I want to** close a maintenance record when work is done  
**So that** the vehicle returns to service  

**Acceptance Criteria:**
- Close action: records end date and final cost
- If no other active maintenance for vehicle AND vehicle not Retired: status → Available
- If other active maintenance exists: vehicle stays In Shop
- Vehicle returns to dispatch pool (if Available)

### US-5.3: View Maintenance History
**As a** Fleet Manager  
**I want to** see maintenance history per vehicle  
**So that** I can plan future maintenance and track costs  

**Acceptance Criteria:**
- Filtered by vehicle
- Shows: type, dates, cost, status
- Total maintenance cost calculated
- Average time in shop displayed

---

## Epic 6: Fuel & Expense Tracking

### US-6.1: Log Fuel Entry
**As a** Dispatcher  
**I want to** record fuel purchases for vehicles  
**So that** we can track fuel costs and efficiency  

**Acceptance Criteria:**
- Form: Vehicle, Liters, Cost (₹), Date, Odometer Reading
- Odometer must be >= vehicle's current reading
- Optionally link to a trip
- Auto-updates vehicle odometer on save

### US-6.2: Record Expense
**As any** authenticated user  
**I want to** record operational expenses  
**So that** all costs are captured for analysis  

**Acceptance Criteria:**
- Categories: Fuel, Maintenance, Toll, Insurance, Other
- Fields: Category, Amount, Description, Date, Vehicle (optional), Trip (optional)
- Amount must be > 0
- Receipt upload optional (future)

### US-6.3: View Cost Summary
**As a** Financial Analyst  
**I want to** see aggregated costs by vehicle, category, and time period  
**So that** I can identify cost drivers and optimization opportunities  

**Acceptance Criteria:**
- Filter by: date range, vehicle, category
- Summary cards: Total Fuel, Total Maintenance, Total Other, Grand Total
- Per-vehicle breakdown table
- Month-over-month trend chart
- CSV export button

---

## Epic 7: Dashboard & Analytics

### US-7.1: View Operational Dashboard
**As any** authenticated user  
**I want to** see key operational metrics at a glance  
**So that** I understand the current state of fleet operations  

**Acceptance Criteria:**
- KPI Cards: Active Vehicles, Available Vehicles, In Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %
- Cards are color-coded by health (green = good, amber = attention, red = critical)
- Data refreshes on page load and every 5 minutes
- Filter by vehicle type, region

### US-7.2: View Fleet Utilization Chart
**As a** Fleet Manager  
**I want to** see fleet utilization trends over time  
**So that** I can identify underutilization patterns  

**Acceptance Criteria:**
- Line chart: utilization % over last 30 days
- Benchmark line at target utilization (e.g., 80%)
- Hover shows exact percentage and vehicle counts
- Filter by vehicle type

### US-7.3: View Expense Analytics
**As a** Financial Analyst  
**I want to** visualize cost trends and breakdowns  
**So that** I can present findings to management  

**Acceptance Criteria:**
- Stacked bar chart: monthly costs by category
- Pie chart: cost distribution
- Top 5 most expensive vehicles table
- Year-over-year comparison (if data exists)

### US-7.4: Export Reports
**As a** Financial Analyst  
**I want to** export report data as CSV  
**So that** I can perform additional analysis in Excel  

**Acceptance Criteria:**
- Export button on every report/list page
- CSV includes all visible columns + applied filters
- Filename: `{report_name}_{date_range}_{timestamp}.csv`
- Download starts immediately (streaming for large files)

---

## Epic 8: Innovation Features (Bonus)

### US-8.1: Vehicle Health Score
**As a** Fleet Manager  
**I want to** see a health score for each vehicle  
**So that** I can prioritize maintenance before breakdowns  

**Acceptance Criteria:**
- Score 0-100 based on: age, odometer, maintenance frequency, fuel anomalies, days since last service
- Visual indicator: 🟢 80-100, 🟡 60-79, 🟠 40-59, 🔴 0-39
- Recommendation engine: "Schedule inspection" if score < 60

### US-8.2: Fuel Anomaly Detection
**As a** Fleet Manager  
**I want to** be alerted when a vehicle's fuel consumption deviates significantly  
**So that** I can investigate potential issues (theft, mechanical problem)  

**Acceptance Criteria:**
- Baseline: rolling 10-trip average fuel efficiency per vehicle
- Alert threshold: > 20% deviation from baseline
- Alert message: "Vehicle V-102 fuel consumption increased by 22%. Recommendation: Schedule inspection."
- Dashboard notification + email to Fleet Manager

### US-8.3: Predictive Maintenance Indicator
**As a** Fleet Manager  
**I want to** see which vehicles are likely to need maintenance soon  
**So that** I can proactively schedule service windows  

**Acceptance Criteria:**
- Based on: km since last service, time since last service, vehicle type service intervals
- Shows: "Next service in ~500 km" or "Overdue by 1,200 km"
- Color-coded urgency in vehicle list
- Notification when overdue threshold crossed

### US-8.4: Fleet Optimization Suggestions
**As a** Fleet Manager  
**I want to** receive AI-generated suggestions for fleet optimization  
**So that** I can improve efficiency without manual analysis  

**Acceptance Criteria:**
- Examples: "3 vehicles idle for 7+ days — consider reassignment or retirement"
- "Driver Ravi has best fuel efficiency on long routes — consider highway assignments"
- Max 5 suggestions shown, refreshed daily
- Each suggestion includes data backing and recommended action
