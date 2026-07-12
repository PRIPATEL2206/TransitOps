# TransitOps — Demo Scripts

---

## 3-Minute Demo Script (Rapid Fire)

### Target: Show core workflow end-to-end in 3 minutes

---

**[0:00 - 0:20] Opening — Problem Statement**

> "Fleet companies lose thousands daily to scheduling conflicts, expired licenses, and manual tracking. TransitOps eliminates this with automated validation and real-time visibility."

**Action:** Show login screen → login as Fleet Manager

---

**[0:20 - 0:50] Dashboard Overview**

> "Our dashboard provides instant fleet visibility — 45 active vehicles, 80% utilization, 12 trips in progress, 3 vehicles in maintenance."

**Action:** Point to KPI cards, briefly hover over utilization chart

---

**[0:50 - 1:30] Core Workflow — Trip Dispatch**

> "Let me show our validated dispatch flow. I'll create a trip for a 450kg cargo."

**Action:**
1. Navigate to Trips → New Trip
2. Select source: "Mumbai Port", destination: "Pune Warehouse"
3. Select vehicle → show "Van-05 (500kg capacity)" — notice only Available vehicles shown
4. Select driver → show "Alex Kumar (License valid)" — expired drivers are hidden
5. Enter cargo: 450kg → show ✅ validation (450 ≤ 500)
6. Click "Create Trip" → Draft created
7. Click "Dispatch" → Vehicle and Driver instantly change to "On Trip"

> "Notice — one click, three atomic status changes. No double-booking possible."

---

**[1:30 - 2:00] Business Rule Enforcement**

> "Watch what happens with invalid data."

**Action:**
1. Try creating trip with 600kg cargo on 500kg vehicle → show error: "Exceeds capacity"
2. Try dispatching to vehicle already On Trip → show error: "Already on trip"

> "These rules are enforced at database, API, and UI levels. No loopholes."

---

**[2:00 - 2:30] Maintenance & Auto-Status**

> "When I create a maintenance record..."

**Action:**
1. Go to Maintenance → New
2. Select "Van-05", type "Oil Change"
3. Create → show vehicle status instantly changes to "In Shop"
4. Show vehicle disappears from dispatch dropdown

> "Automatic status transitions — no manual coordination needed."

---

**[2:30 - 2:50] Analytics & Export**

> "All data flows into analytics — fuel efficiency, ROI per vehicle, cost trends."

**Action:** Navigate to Reports, show one chart, click "Export CSV"

---

**[2:50 - 3:00] Closing**

> "TransitOps: validated dispatch, automated compliance, real-time analytics. Production-ready in 8 hours."

---

---

## 5-Minute Demo Script (Standard)

### Target: Complete feature coverage with business rule emphasis

---

**[0:00 - 0:30] Introduction**

> "TransitOps is an enterprise transport operations platform that digitizes fleet management while enforcing critical business rules that prevent costly scheduling conflicts and compliance violations."

**Action:** Show login page → explain RBAC → login as Fleet Manager

---

**[0:30 - 1:15] Dashboard Deep Dive**

> "The dashboard gives Fleet Managers instant visibility into operations."

**Action:**
1. Walk through each KPI card: Active Vehicles (45), Available (30), In Maintenance (3), Active Trips (12), Pending (5), Drivers On Duty (10), Fleet Utilization (26.7%)
2. Show filter by vehicle type → watch KPIs recalculate
3. Show utilization chart — "trending up from 60% to 80% over 3 months"
4. Show expense trend — "fuel costs stable, maintenance spike in March"

---

**[1:15 - 1:45] Vehicle Management**

> "Let me register a new vehicle."

**Action:**
1. Navigate to Vehicles → New
2. Fill: Registration "MH-12-XY-9999", Name "Express Van 12", Type "Van", Capacity 750kg, Odometer 0, Cost ₹9,50,000
3. Show uniqueness validation (try duplicate → error)
4. Create → status "Available"
5. Show vehicle list with status badges, search, sort

---

**[1:45 - 2:15] Driver Management & Compliance**

> "Driver compliance is automated. Watch these safety indicators."

**Action:**
1. Show driver list — point out license expiry colors (green, amber, red)
2. Show a driver with "Expires in 7 days" → red badge
3. Show notifications panel — "3 drivers with expiring licenses"
4. Explain: "Expired license drivers are automatically blocked from dispatch"

---

**[2:15 - 3:15] Complete Trip Lifecycle**

> "This is our core differentiator — validated, atomic trip dispatch."

**Action:**
1. **Create:** Trips → New → fill source/dest/vehicle/driver/cargo(450kg)/distance(150km) → Create (Draft)
2. **Validate:** Show weight indicator "450/500 kg ✅"
3. **Dispatch:** Click Dispatch → confirmation dialog → confirm
4. **Observe:** Vehicle badge → "On Trip" (blue), Driver badge → "On Trip"
5. **Complete:** Click Complete → enter final odometer (45,150), fuel consumed (18.5L)
6. **Observe:** Both statuses restore to "Available", odometer updated

> "One transaction, six database writes, zero inconsistency."

---

**[3:15 - 3:45] Negative Cases (Rule Enforcement)**

> "Let me prove these rules can't be bypassed."

**Action:**
1. Try dispatch with overweight → show rejection message
2. Try dispatch to On Trip vehicle → show conflict error  
3. Show that only Available vehicles appear in dropdown (Retired/In Shop hidden)
4. Try to assign suspended driver → blocked

---

**[3:45 - 4:15] Maintenance Workflow**

> "Maintenance creates automatic status transitions."

**Action:**
1. Maintenance → New → select vehicle, type "Engine Check", cost ₹5,000
2. Create → vehicle status instantly "In Shop"
3. Show it's removed from trip creation dropdown
4. Close maintenance → vehicle returns to "Available"

---

**[4:15 - 4:45] Fuel & Expense Analytics**

> "Every liter, every toll, every expense — tracked and analyzed."

**Action:**
1. Show Fuel Logs page — recent entries
2. Show Expenses page with category breakdown
3. Navigate to Reports → show:
   - Fuel Efficiency chart (km/L per vehicle)
   - Cost breakdown pie chart
   - Vehicle ROI table
4. Click "Export CSV" → file downloads

---

**[4:45 - 5:00] Closing & Innovation**

> "Beyond the basics, we've added predictive intelligence."

**Action:** Show Vehicle Health Score indicator and Fuel Anomaly alert

> "TransitOps: from spreadsheet chaos to validated, automated, insight-driven fleet operations. Built in 8 hours, production-ready by design."

---

---

## 10-Minute Demo Script (Comprehensive)

### Target: Full platform walkthrough with architecture discussion

---

**[0:00 - 1:00] Context & Problem**

> "Logistics companies managing 50 to 500 vehicles face a universal problem: operational chaos from disconnected tools."

> "Scheduling conflicts: same vehicle double-booked because spreadsheets don't validate. Compliance gaps: driver with expired license sent on a trip, risking ₹50,000 fines. Financial blindness: nobody knows which vehicles are profitable until quarter-end."

> "TransitOps eliminates these problems through enforced business rules and automated workflows."

**Action:** Show problem slides (if available) or simply the login screen

---

**[1:00 - 1:30] Architecture (30 seconds)**

> "Three-tier architecture: Next.js frontend for responsive UI, FastAPI backend for high-performance APIs, PostgreSQL for ACID-compliant data integrity."

> "Key architectural decision: all status transitions happen in database transactions with optimistic locking. This means even if two dispatchers click at the same millisecond, only one succeeds — no data corruption, ever."

---

**[1:30 - 2:00] Authentication & RBAC**

**Action:** Show login → enter Fleet Manager credentials → login

> "Role-based access: Fleet Managers see vehicles and maintenance. Dispatchers handle trips. Safety Officers monitor compliance. Each role sees exactly what they need."

**Action:** Point to sidebar navigation items

---

**[2:00 - 3:00] Dashboard**

**Action:** Walk through dashboard comprehensively

> "Seven real-time KPIs, auto-refreshed every 5 minutes."

1. Explain each KPI card and what drives it
2. Show utilization chart: "This 30-day trend shows we've improved from 60% to 80% utilization"
3. Show expense chart: "Monthly breakdown by category — fuel dominates at 62%"
4. Show trip status distribution: "Bar chart shows most trips complete successfully, 4% cancellation rate"
5. Demonstrate filters: type=Van → all KPIs recalculate

---

**[3:00 - 4:00] Vehicle Registry**

**Action:**
1. Vehicle list — show table with sorting, search, filters
2. Create new vehicle — fill all fields, show real-time uniqueness check
3. Show vehicle detail page — history, cost breakdown
4. Show status badges: Available (green), On Trip (blue), In Shop (amber), Retired (gray)
5. Demonstrate: try to set odometer lower → rejected (monotonic validation)

> "Every vehicle is tracked from acquisition to retirement. The system enforces data integrity at every step."

---

**[4:00 - 5:00] Driver Management & Safety**

**Action:**
1. Driver list — show license expiry indicators
2. Create driver with license expiring in 10 days → amber warning
3. Show Safety Score gauge
4. Show compliance dashboard: "3 drivers need license renewal"
5. Explain scoring: "100 base, deductions for incidents, additions for streaks"
6. Demonstrate: try to assign expired-license driver → blocked

> "Zero expired-license trips. The system prevents it before it happens."

---

**[5:00 - 7:00] Trip Lifecycle (Core Demo)**

> "This is the heart of TransitOps — the validated dispatch workflow."

**Action — Create Trip:**
1. Trips → New Trip
2. Source: "Mumbai Port" | Destination: "Pune Warehouse"
3. Select vehicle → dropdown only shows Available with capacity labels
4. Select driver → dropdown only shows Available with valid licenses
5. Cargo: 450 kg → green indicator shows "450 / 500 kg capacity"
6. Planned distance: 150 km
7. Create → Trip in Draft

**Action — Validate Edge Cases:**
1. Change cargo to 600 → show live error "Exceeds 500 kg capacity"
2. Change back to 450

**Action — Dispatch:**
1. Click Dispatch → confirmation dialog
2. Confirm → observe:
   - Trip status: Draft → Dispatched (dispatched timestamp recorded)
   - Vehicle badge: Available → On Trip (blue)
   - Driver badge: Available → On Trip (blue)
3. Go back to vehicle list → show it's now On Trip
4. Try to create another trip with same vehicle → it doesn't appear in dropdown

> "Atomic transaction: if any part fails, everything rolls back. No half-dispatched trips."

**Action — Complete:**
1. Open the dispatched trip
2. Click Complete → enter:
   - Final odometer: 45,150 km
   - Fuel consumed: 18.5 liters
3. Submit → observe:
   - Trip: Dispatched → Completed
   - Vehicle: On Trip → Available (odometer updated to 45,150)
   - Driver: On Trip → Available
   - Fuel log auto-created

**Action — Cancel Flow:**
1. Create another trip, dispatch it
2. Click Cancel → enter reason: "Client cancelled order"
3. Observe: vehicle/driver restored to Available

---

**[7:00 - 7:45] Maintenance**

**Action:**
1. Maintenance → New
2. Select a vehicle (Available), type: "Oil Change", cost: ₹2,500
3. Create → observe vehicle status instantly → "In Shop"
4. Show that vehicle is now gone from trip creation dropdown
5. Close maintenance → vehicle returns to "Available"
6. Show: create two maintenance records for same vehicle → close one → stays In Shop (other still active)

> "Automatic, rule-driven status management. No manual coordination between teams."

---

**[7:45 - 8:30] Financial & Analytics**

**Action:**
1. Fuel Logs → show entries with vehicle, liters, cost, date
2. Expenses → show categorized list (Fuel, Maintenance, Tolls)
3. Reports page:
   - Fuel Efficiency chart: "Van-05 averages 12.5 km/L, fleet average is 10.2"
   - Cost breakdown: pie chart by category
   - Vehicle ROI table: sorted by profitability
   - Fleet utilization trend: 30-day line chart
4. Click "Export CSV" → show file downloads with proper columns

> "Data-driven decisions: identify your best and worst performing assets instantly."

---

**[8:30 - 9:15] Innovation Features**

> "Beyond the requirements, we've built predictive intelligence."

**Action:**
1. Show Vehicle Health Score (0-100): 
   - "Van-05: 82 (green) — healthy"
   - "Truck-03: 45 (amber) — schedule inspection recommended"
2. Show Fuel Anomaly Alert:
   - "Vehicle V-102 fuel consumption increased by 22%. Recommendation: Schedule inspection."
3. Show Fleet Optimization Suggestions:
   - "3 vehicles idle for 7+ days — consider reassignment"
   - "Driver Ravi has best fuel efficiency on highway routes"

> "Proactive insights that prevent problems before they become costly."

---

**[9:15 - 9:45] Technical Excellence**

> "A few architectural highlights:"

- "Dark mode support — system preference detection" → toggle dark mode
- "Mobile responsive — works on 375px screens" → show responsive behavior
- "96% test coverage — every business rule has dedicated tests"
- "Audit trail — every action logged with who, what, when"
- "Sub-500ms API response times"

---

**[9:45 - 10:00] Closing**

> "TransitOps transforms fleet operations from reactive spreadsheet management to proactive, rule-enforced, insight-driven operations."

> "Built in 8 hours with production-grade architecture: Clean Architecture, optimistic concurrency, atomic transactions, and predictive analytics."

> "Thank you. Happy to take questions."

---

---

## Judge Presentation Notes

### Key Differentiators to Emphasize

1. **Business Rule Enforcement** — Not just CRUD. The system prevents invalid states at DB + API + UI levels.
2. **Atomic Transactions** — Dispatch changes 3 entities in one transaction with rollback on failure.
3. **Race Condition Handling** — Optimistic locking prevents double-booking even under concurrent access.
4. **Complete State Machines** — Vehicle, Driver, and Trip states follow formal state machines with guarded transitions.
5. **Production Architecture** — Clean Architecture, Repository Pattern, DI — not hackathon shortcuts.
6. **Beyond Requirements** — Health scores, anomaly detection, predictive indicators.

### Questions Judges Might Ask

| Question | Answer |
|----------|--------|
| "How do you handle concurrent dispatch?" | "Optimistic locking with version column. SELECT FOR UPDATE ensures only one dispatcher can lock a vehicle. Second attempt gets 409 Conflict." |
| "What if the server crashes mid-dispatch?" | "All changes in single DB transaction. PostgreSQL guarantees atomicity — either all three status changes commit or none do." |
| "How do you ensure data integrity?" | "Three layers: DB constraints (UNIQUE, CHECK, FK), API validation (Pydantic schemas), and UI validation (Zod + react-hook-form)." |
| "Why FastAPI over Django?" | "Async performance, native Pydantic validation, auto-generated OpenAPI docs, and faster development cycle for a hackathon." |
| "How does the audit trail work?" | "Every mutation creates an immutable audit_log entry with user_id, entity, action, old/new values, and timestamp." |
| "What about scalability?" | "Stateless JWT auth, connection pooling, Redis caching for dashboard KPIs, database indexing strategy documented." |
