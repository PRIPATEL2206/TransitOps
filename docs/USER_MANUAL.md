# TransitOps — User Manual

## Getting Started

### Logging In

1. Navigate to the TransitOps URL provided by your administrator
2. Enter your email address and password
3. Click **Sign In**
4. You will be redirected to the Dashboard

> **Tip:** If you've forgotten your password, contact your system administrator for a reset.

### Understanding Your Role

Your access level determines what you can see and do:

| If you are a... | You can... |
|-----------------|------------|
| **Fleet Manager** | Manage vehicles, maintenance, view reports, oversee operations |
| **Dispatcher** | Create and manage trips, assign vehicles and drivers |
| **Safety Officer** | Monitor driver compliance, manage licenses, track safety |
| **Financial Analyst** | View expenses, fuel costs, analyze ROI, export reports |

---

## Dashboard

The dashboard is your operational command center.

### KPI Cards

| Card | What it shows |
|------|---------------|
| **Active Vehicles** | Total fleet minus retired vehicles |
| **Available** | Vehicles ready for immediate dispatch |
| **In Maintenance** | Vehicles currently in the shop |
| **Active Trips** | Trips currently in progress (dispatched) |
| **Pending Trips** | Draft trips awaiting dispatch |
| **Drivers On Duty** | Drivers currently on trips |
| **Fleet Utilization** | Percentage of active fleet currently on trips |

### Using Filters

- Click the filter dropdowns above the dashboard
- Select **Vehicle Type** (Van, Truck, Sedan, Bus) to see type-specific metrics
- Select **Region** to focus on a geographic area
- All KPIs and charts update automatically when filters change

### Charts

- **Utilization Trend:** Shows how fleet utilization has changed over 30 days
- **Expense Breakdown:** Pie chart showing cost distribution by category
- **Trip Status:** Bar chart showing trips by status this month

---

## Vehicle Management

### Viewing Vehicles

1. Click **Vehicles** in the sidebar
2. The table shows all vehicles with their current status
3. Use the search bar to find by registration number or name
4. Click column headers to sort
5. Use status filter tabs: All | Available | On Trip | In Shop | Retired

### Adding a New Vehicle

1. Click **+ Add Vehicle** button
2. Fill in the required fields:
   - **Registration Number** — Must be unique (e.g., MH-12-AB-1234)
   - **Vehicle Name** — Descriptive name (e.g., "Express Van 05")
   - **Type** — Select from Van, Truck, Sedan, Bus
   - **Max Load Capacity** — Maximum cargo weight in kg
   - **Current Odometer** — Current reading in km
   - **Acquisition Cost** — Purchase price in ₹
   - **Region** — Operating region
3. Click **Create Vehicle**
4. Vehicle appears in the list with "Available" status

### Understanding Vehicle Status

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 Available | Green | Ready for dispatch |
| 🔵 On Trip | Blue | Currently on an active trip |
| 🟡 In Shop | Amber | Under maintenance |
| ⚫ Retired | Gray | Permanently out of service |

### Retiring a Vehicle

1. Open the vehicle detail page
2. Click **Actions** → **Retire Vehicle**
3. Confirm the retirement (this action is permanent)
4. Vehicle will no longer appear in dispatch options

> **Note:** Vehicles that are On Trip or In Shop cannot be retired. Complete the trip or close maintenance first.

---

## Driver Management

### Viewing Drivers

1. Click **Drivers** in the sidebar
2. The table shows all drivers with their license status
3. Pay attention to the **License Expiry** column:
   - 🟢 Green = Valid for 30+ days
   - 🟡 Amber = Expiring within 30 days
   - 🔴 Red = Expiring within 7 days or expired

### Adding a New Driver

1. Click **+ Add Driver**
2. Fill in:
   - **Full Name**
   - **License Number** — Must be unique
   - **License Category** — HMV (Heavy), LMV (Light)
   - **License Expiry Date**
   - **Contact Number**
3. Click **Create Driver**
4. Driver starts with "Available" status and Safety Score of 100

### License Compliance

- Drivers with **expired licenses** are automatically blocked from dispatch
- You will receive notifications when licenses are about to expire:
  - 30 days before: Yellow warning
  - 14 days before: Orange urgent notification
  - 7 days before: Red critical alert
- Ensure license renewals are processed before expiry

### Safety Scores

- Each driver has a Safety Score (0-100)
- Score starts at 100 and changes based on performance
- Factors: on-time delivery, incident reports, fuel efficiency
- Drivers with scores below 50 should be reviewed by the Safety Officer

---

## Trip Management

### Creating a Trip

1. Click **Trips** → **+ New Trip**
2. Fill in the trip details:
   - **Source** — Starting location
   - **Destination** — End location (must differ from source)
   - **Vehicle** — Select from available vehicles (shows capacity)
   - **Driver** — Select from available drivers (shows license status)
   - **Cargo Weight** — Must not exceed vehicle capacity
   - **Planned Distance** — Estimated trip distance in km
3. Click **Create Trip**
4. Trip is created in **Draft** status

> **Important:** The system will only show vehicles and drivers that are currently Available. You won't see vehicles that are on trips, in maintenance, or retired.

### Dispatching a Trip

1. Open a Draft trip
2. Click **Dispatch**
3. The system validates:
   - ✅ Vehicle is still Available
   - ✅ Driver is still Available  
   - ✅ Driver's license is valid (not expired)
   - ✅ Cargo weight ≤ vehicle max capacity
4. If all checks pass → Trip becomes "Dispatched"
5. Vehicle and Driver automatically change to "On Trip"

> **If dispatch fails:** You'll see a specific error message explaining what went wrong. Fix the issue and try again.

### Completing a Trip

1. Open a Dispatched trip
2. Click **Complete Trip**
3. Enter:
   - **Final Odometer** — Vehicle's odometer reading at destination
   - **Fuel Consumed** — Total fuel used (liters)
   - **Actual Distance** — Real distance traveled (optional)
4. Click **Submit**
5. Trip becomes "Completed"
6. Vehicle and Driver return to "Available"

### Cancelling a Trip

1. Open a Draft or Dispatched trip
2. Click **Cancel Trip**
3. If the trip was Dispatched, you must provide a reason
4. Vehicle and Driver return to "Available" (if they were locked)

---

## Maintenance

### Creating a Maintenance Record

1. Click **Maintenance** → **+ New Record**
2. Select the vehicle (only Available or In Shop vehicles shown)
3. Choose maintenance type (Oil Change, Tire, Engine, Brake, General)
4. Enter estimated cost and start date
5. Click **Create**
6. ⚠️ Vehicle automatically becomes "In Shop"
7. Vehicle is removed from the dispatch pool

> **Note:** You cannot create maintenance for a vehicle that is currently On Trip. Wait for the trip to complete first.

### Closing Maintenance

1. Open the active maintenance record
2. Click **Close Maintenance**
3. Enter final cost (if different from estimate)
4. Click **Confirm**
5. If this was the only active maintenance → Vehicle returns to "Available"
6. If other maintenance records are still active → Vehicle stays "In Shop"

---

## Fuel & Expense Tracking

### Logging Fuel

1. Click **Fuel Logs** → **+ Add Entry**
2. Select the vehicle
3. Enter: liters filled, cost (₹), odometer reading, date
4. Optionally link to a specific trip
5. Click **Save**

> **Note:** Odometer reading must be equal to or greater than the vehicle's current reading. The system prevents odometer rollbacks.

### Recording Expenses

1. Click **Expenses** → **+ Add Expense**
2. Select category: Fuel, Maintenance, Toll, Insurance, Other
3. Enter amount, description, date
4. Optionally link to a vehicle or trip
5. Click **Save**

### Viewing Cost Summary

- The Expenses page shows a summary panel with totals by category
- Use date range filters to analyze specific periods
- Click **Export CSV** to download data for spreadsheet analysis

---

## Reports & Analytics

### Available Reports

| Report | Shows |
|--------|-------|
| **Fleet Utilization** | How efficiently vehicles are being used over time |
| **Fuel Efficiency** | km/L for each vehicle compared to fleet average |
| **Cost Breakdown** | Expenses by category (pie chart) |
| **Vehicle ROI** | Return on investment per vehicle |
| **Driver Performance** | Driver rankings by safety and efficiency |

### Exporting Data

1. Navigate to any report or list page
2. Apply your desired filters (date range, vehicle type, etc.)
3. Click the **Export CSV** button
4. A .csv file downloads to your computer
5. Open in Excel or Google Sheets for further analysis

---

## Notifications & Alerts

### Where to Find Notifications

- Click the **bell icon** in the top navigation bar
- Unread notifications show as a red badge with count
- Click any notification to navigate to the relevant item

### Types of Alerts

| Alert | Trigger | Priority |
|-------|---------|----------|
| License Expiring (30 days) | Daily check | Normal |
| License Expiring (14 days) | Daily check | Urgent |
| License Expiring (7 days) | Daily check | Critical |
| Fuel Anomaly Detected | On fuel log creation | High |
| Vehicle Health Low | Daily calculation | Medium |
| Maintenance Overdue | Mileage threshold | High |

---

## Dark Mode

TransitOps supports dark mode for comfortable viewing:

1. Click your **profile avatar** in the top-right corner
2. Select **Theme** → Dark / Light / System
3. "System" follows your operating system preference
4. All charts and badges adapt automatically to the selected theme

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open search |
| `Ctrl + N` | New item (context-dependent) |
| `Escape` | Close dialog/modal |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Session expired" message | Re-login with your credentials |
| Can't find a vehicle in dispatch | Check if it's On Trip, In Shop, or Retired |
| Can't assign a driver | Check if license is expired or driver is On Trip/Suspended |
| Dispatch fails with "conflict" | Another dispatcher just took that vehicle — refresh and retry |
| Data not updating | Refresh the page (Ctrl+R) or wait for auto-refresh cycle |
| Export not downloading | Check browser download permissions/popup blocker |
