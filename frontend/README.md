# TransitOps Frontend

Next.js 14 frontend for the TransitOps Smart Transport Operations Platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + shadcn/ui (Radix UI primitives) |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| HTTP client | Axios with JWT auto-refresh |
| State management | Zustand (auth store) |
| Charts | Recharts |
| Icons | Lucide React |
| Theming | next-themes (system / light / dark) |
| Notifications | Sonner |

## Setup

### Prerequisites

- Node.js 18 or later
- The TransitOps backend API running at `http://localhost:8000`

### Install and run locally

```bash
# From this directory
npm install

# Start the dev server
npm run dev
```

The app is available at http://localhost:3000.

### Build for production

```bash
npm run build
npm start
```

### Run with Docker

```bash
# Build image
docker build -t transitops-frontend .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://your-api-host:8000/api/v1 transitops-frontend
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API base URL |

Create a `.env.local` file to override defaults locally:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
src/
  app/               # Next.js App Router pages and layouts
    layout.tsx       # Root layout (fonts, providers)
    loading.tsx      # Global loading skeleton
    globals.css      # Tailwind base + HSL CSS variables
  components/
    ui/              # shadcn/ui primitive components
  hooks/
    use-auth.ts      # Zustand auth store + useAuth hook
    use-toast.ts     # Toast notification hook
  lib/
    api-client.ts    # Axios instance with JWT interceptors
    constants.ts     # Domain constants (statuses, types, etc.)
    utils.ts         # cn(), formatDate(), formatCurrency() helpers
  middleware.ts      # Edge middleware: auth redirect guard
  providers/
    auth-provider.tsx   # React Context auth provider + AuthGuard
    query-provider.tsx  # TanStack Query client provider
    theme-provider.tsx  # next-themes wrapper
  types/
    index.ts         # Domain interfaces (Vehicle, Driver, Trip, etc.)
    api.ts           # API response types (PaginatedResponse, ApiError)
```

## Key Features

- **JWT authentication** — tokens stored in localStorage, cookie synced for middleware, auto-refresh on 401 with queue draining.
- **AuthGuard** — protects pages and redirects unauthenticated users to `/login`.
- **Dark / light / system theming** — via `next-themes` with Tailwind CSS variables.
- **Paginated data fetching** — TanStack Query with stale-time and automatic background refresh.
- **Type-safe forms** — React Hook Form + Zod schemas throughout.
- **Fleet domain types** — complete TypeScript interfaces for Vehicles, Drivers, Trips, Maintenance, Fuel Logs, and Expenses.
- **Multi-stage Docker build** — standalone Next.js output for minimal production image size.
