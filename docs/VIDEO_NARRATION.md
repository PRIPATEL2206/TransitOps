# TransitOps — Video Submission Narration Script

## Video Specifications

- **Duration:** 5:00 (five minutes)
- **Resolution:** 1920×1080 (16:9)
- **Format:** MP4 / H.264
- **Audio:** Clear voiceover narration, no background music during demos
- **Screen Recording:** Full browser window, dark mode enabled

---

## Second-by-Second Script

### [0:00 - 0:05] Title Card

**Screen:** Black background with TransitOps logo, tagline: "Smart Transport Operations Platform"
**Action:** Fade in logo
**Talking Points:** (silence — let the title breathe)
**Expected Outcome:** Professional first impression

---

### [0:05 - 0:20] Problem Statement

**Screen:** Split screen — left: chaotic spreadsheet mockup; right: TransitOps dashboard
**Action:** Zoom from spreadsheet chaos → clean dashboard
**Talking Points:**
> "Fleet companies lose thousands daily to scheduling conflicts, compliance violations, and financial blind spots. TransitOps replaces spreadsheet chaos with validated, automated operations."

**Expected Outcome:** Viewer understands the problem in 15 seconds

---

### [0:20 - 0:35] Architecture Overview

**Screen:** Architecture diagram (3-tier: Frontend → Backend → Database)
**Action:** Highlight each layer as mentioned
**Talking Points:**
> "Built with Next.js and FastAPI on PostgreSQL. Clean Architecture with optimistic locking ensures data integrity even under concurrent access. Every business rule is enforced at three levels: database, API, and UI."

**Expected Outcome:** Technical competence established

---

### [0:35 - 0:50] Login & RBAC

**Screen:** Browser at login page (http://localhost:3000/login)
**Action:** 
- Type email: fleet@transitops.io
- Type password: ••••••••
- Click "Sign In"
- Page transitions to dashboard

**Talking Points:**
> "Role-based access control with JWT authentication. Four roles: Fleet Manager, Dispatcher, Safety Officer, Financial Analyst. Each sees only what their role permits."

**Expected Outcome:** Login completes, dashboard loads in < 2 seconds

---

### [0:50 - 1:25] Dashboard KPIs

**Screen:** Dashboard with KPI cards and charts
**Action:**
- [0:50] Pan across KPI cards (hover each briefly)
- [1:00] Point cursor at "Fleet Utilization: 80.2%"
- [1:05] Scroll to charts section
- [1:10] Hover utilization chart — show tooltip with date/value
- [1:15] Click filter: Vehicle Type → "Van"
- [1:20] Show KPIs recalculate for Vans only

**Talking Points:**
> "Real-time operational visibility. Seven KPI cards refresh automatically. Fleet utilization trending at 80% — above our target."

> "Charts show utilization over time, expense breakdown by category, and trip completion rates."

> "Filters apply globally — selecting 'Van' instantly recalculates all metrics for that vehicle type."

**Expected Outcome:** Dashboard renders quickly, filters work instantly, charts animate

---

### [1:25 - 1:50] Vehicle Registration

**Screen:** Vehicles page → New Vehicle form
**Action:**
- [1:25] Navigate to Vehicles (sidebar click)
- [1:28] Show vehicle table briefly (sort by status)
- [1:32] Click "Add Vehicle" button
- [1:35] Fill form:
  - Registration: MH-12-XY-9999
  - Name: Express Van 12
  - Type: Van (dropdown)
  - Max Capacity: 750 kg
  - Odometer: 0
  - Acquisition Cost: ₹9,50,000
- [1:45] Click "Create Vehicle"
- [1:47] Show success toast: "Vehicle created successfully"
- [1:48] Show vehicle in list with "Available" green badge

**Talking Points:**
> "Vehicle registration with uniqueness validation. Registration number is checked against the database in real-time — duplicates are blocked before submission."

**Expected Outcome:** Vehicle created, appears in list with Available status

---

### [1:50 - 2:10] Driver with License Warning

**Screen:** Drivers page
**Action:**
- [1:50] Navigate to Drivers
- [1:53] Show driver list — point at license expiry badges
- [1:57] Highlight driver with red "Expires in 5 days" badge
- [2:00] Show notifications icon in topbar → "3 license expiry warnings"
- [2:05] Click on a driver → show detail with Safety Score gauge

**Talking Points:**
> "Driver compliance monitoring is automated. License expiry warnings at 30, 14, and 7 days. Red means critical — these drivers are blocked from dispatch. Safety scores track performance over time."

**Expected Outcome:** Visual compliance indicators clearly visible

---

### [2:10 - 3:15] Trip Lifecycle (CORE DEMO)

**Screen:** Trips page → New Trip
**Action:**

*Create Trip:*
- [2:10] Navigate to Trips → Click "New Trip"
- [2:15] Select Source: "Mumbai Port" (from dropdown)
- [2:18] Select Destination: "Pune Warehouse"
- [2:22] Select Vehicle: dropdown opens → show only Available vehicles with capacity labels
- [2:25] Select "Van-05 (500 kg)" → capacity indicator appears
- [2:28] Select Driver: dropdown opens → show only Available drivers with valid licenses
- [2:31] Select "Alex Kumar"
- [2:34] Enter Cargo Weight: 450 → green indicator "450 / 500 kg ✅"
- [2:37] Enter Planned Distance: 150 km
- [2:40] Click "Create Trip"
- [2:42] Show Draft trip created with number TRP-20260712-0001

*Business Rule Demo:*
- [2:44] Edit cargo to 600 → red error "Exceeds 500 kg capacity"
- [2:48] Revert to 450

*Dispatch:*
- [2:50] Click "Dispatch" button
- [2:52] Confirmation dialog appears → Click "Confirm Dispatch"
- [2:55] Show status change: Draft → Dispatched
- [2:57] Show Vehicle badge: Available → On Trip (blue)
- [3:00] Show Driver badge: Available → On Trip (blue)

*Complete:*
- [3:02] Click "Complete Trip"
- [3:04] Enter Final Odometer: 45,150
- [3:06] Enter Fuel Consumed: 18.5 L
- [3:08] Click "Submit"
- [3:10] Show: Trip → Completed, Vehicle → Available, Driver → Available
- [3:13] Show vehicle odometer updated to 45,150

**Talking Points:**
> "The core workflow: create, validate, dispatch, complete."

> "Only Available vehicles and eligible drivers appear in dropdowns. Capacity is validated in real-time."

> "Watch the dispatch — one action, three atomic database changes. Vehicle and driver are locked instantly."

> "Completion records actual data and restores availability. Odometer updates automatically."

**Expected Outcome:** Full trip lifecycle completes with visible status changes at each step

---

### [3:15 - 3:35] Concurrency Protection

**Screen:** Show what happens with race condition
**Action:**
- [3:15] Open a new trip form
- [3:18] Select same vehicle that's now on another trip (it won't appear)
- [3:20] Explain: "Vehicle is On Trip — it's not even in the dropdown"
- [3:25] Alternatively: show the conflict error message in API docs/response

**Talking Points:**
> "Concurrency is handled with optimistic locking. If two dispatchers try to assign the same vehicle simultaneously, only the first succeeds. The second receives a clear conflict error. No double-booking is physically possible."

**Expected Outcome:** Demonstrate that the system prevents invalid states

---

### [3:35 - 3:55] Maintenance Workflow

**Screen:** Maintenance page → New
**Action:**
- [3:35] Navigate to Maintenance → Click "New Record"
- [3:38] Select Vehicle: "Van-05" (currently Available)
- [3:40] Type: "Oil Change", Cost: ₹2,500, Start Date: today
- [3:42] Click "Create"
- [3:44] Show success → Vehicle status changes to "In Shop"
- [3:47] Navigate to Trips → New → show Van-05 is NOT in vehicle dropdown
- [3:50] Go back to Maintenance → Click "Close" on the record
- [3:53] Show Vehicle status restores to "Available"

**Talking Points:**
> "Maintenance automatically removes vehicles from the dispatch pool. No manual coordination needed between the Fleet Manager and Dispatcher teams."

> "Closing maintenance restores availability — unless the vehicle is retired or has other active records."

**Expected Outcome:** Automatic status transitions visible at each step

---

### [3:55 - 4:15] Analytics & Reporting

**Screen:** Reports page
**Action:**
- [3:55] Navigate to Reports
- [3:58] Show Fuel Efficiency chart — "Van-05: 12.5 km/L"
- [4:02] Show Cost Breakdown pie chart — Fuel 62%, Maintenance 28%, Other 10%
- [4:06] Show Vehicle ROI table — sorted by profitability
- [4:10] Click "Export CSV" → show file downloading
- [4:13] Open downloaded CSV briefly (show headers match)

**Talking Points:**
> "Actionable analytics: fuel efficiency per vehicle identifies wastage. Cost breakdown shows where money goes. ROI helps decide which vehicles to keep or retire."

> "One-click CSV export for management reporting."

**Expected Outcome:** Charts render with data, CSV downloads successfully

---

### [4:15 - 4:35] Innovation — Smart Insights

**Screen:** Vehicle detail page with Health Score + Dashboard alerts
**Action:**
- [4:15] Show Vehicle Health Score gauge: "82/100 — Healthy"
- [4:20] Show another vehicle: "45/100 — Attention Needed"
- [4:22] Show recommendation: "Schedule inspection — health declining"
- [4:25] Show Fuel Anomaly alert: "Vehicle V-102 consumption +22%"
- [4:28] Show Fleet Optimization panel: "3 vehicles idle 7+ days"
- [4:33] Show predictive maintenance: "Next service in ~500 km"

**Talking Points:**
> "Beyond tracking — predictive intelligence. Vehicle health scores combine age, odometer, maintenance history, and fuel patterns."

> "Anomaly detection flags abnormal fuel consumption — could indicate theft or mechanical issues."

> "Proactive suggestions help Fleet Managers optimize before problems become expensive."

**Expected Outcome:** Intelligent insights displayed clearly

---

### [4:35 - 4:50] Dark Mode & Responsive Design

**Screen:** Toggle dark mode + show mobile view
**Action:**
- [4:35] Click theme toggle → dark mode activates
- [4:38] Show dashboard in dark mode (all charts/badges adjusted)
- [4:42] Open DevTools → toggle to mobile viewport (375px)
- [4:45] Show mobile nav (hamburger menu), card-based layouts
- [4:48] Navigate to vehicles — show cards instead of table

**Talking Points:**
> "Production-ready: dark mode with full chart color adaptation. Mobile responsive — card layouts on small screens, data tables on desktop."

**Expected Outcome:** Dark mode renders correctly, mobile layout is usable

---

### [4:50 - 5:00] Closing

**Screen:** Dashboard in full glory (dark mode, data populated)
**Action:** Slow zoom out to show full dashboard
**Talking Points:**
> "TransitOps: from spreadsheet chaos to validated, automated, insight-driven fleet operations. Clean Architecture, enforced business rules, predictive analytics. Production-ready, built in 8 hours."

> "Thank you."

**Expected Outcome:** Professional ending on high note

---

## Production Notes

### Recording Checklist

- [ ] Browser: Chrome latest, full screen, no bookmarks bar
- [ ] URL bar visible (shows localhost:3000)
- [ ] Dark mode ON for recording (better on video)
- [ ] Sample data pre-loaded (run seed_data.py)
- [ ] Clear browser cache before recording
- [ ] Close all notifications, chat apps
- [ ] Monitor: 1920×1080, 100% scaling
- [ ] Microphone: USB condenser, quiet room
- [ ] Practice run: complete 3 full rehearsals
- [ ] Mouse movements: smooth, deliberate, never rushed
- [ ] Pause 0.5s after each click for viewer to process

### Post-Production

- Add subtle zoom on key interactions (dispatch button, status changes)
- Add text callouts for business rules being demonstrated
- Add transition slides between major sections
- Color-correct for consistent brightness
- Export: 1080p H.264, AAC audio, < 100 MB file size
