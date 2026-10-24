# YABATECH Campus Navigation App

Modern, responsive campus navigation application for **Yaba College of Technology (YABATECH)**, Lagos, Nigeria.

Students, staff and visitors can search buildings and facilities, view an interactive map, track their location, and obtain pedestrian walking routes across campus.

## Features

- Interactive MapLibre map centred on the YABATECH campus (OpenStreetMap tiles)
- Search by name, alias or category with live autocomplete
- Category filters (gates, lecture halls, laboratories, libraries, cafeterias, hostels, administrative, facilities)
- Current-location tracking via the browser Geolocation API (start/stop, graceful permission handling)
- Pedestrian routing:
  - Primary: campus place graph (NetworkX)
  - Fallback: public OSRM foot routing
  - Final fallback: straight-line distance with clear warning
- Route distance, estimated walking time and step-by-step instructions
- Destination detail panel with verified / approximate indicators
- Clean, professional UI (no gradients, no emojis, Lucide icons, solid navy primary)
- Mobile-first responsive layout
- FastAPI backend with versioned `/api/v1` endpoints and OpenAPI docs
- Seeded campus places derived from publicly available building lists and OSM campus outline

## Project structure

```
yabatech-nav/
├── frontend/          # React + TypeScript + Vite + MapLibre + Tailwind
├── backend/           # FastAPI + NetworkX + Shapely
├── data/
│   └── places.json    # Seed campus places (lat/lng approximate where marked)
├── supabase/          # Migration / RLS stubs for future Supabase integration
├── scripts/
└── README.md
```

## Quick start

### Prerequisites

- Node.js 18+
- Python 3.11+
- (Optional) Supabase project if you later enable auth / PostGIS persistence

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run from the repository root so data/ is found
cd ..
uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173  
The Vite dev server proxies `/api` to the backend.

### Environment variables

**Backend** (optional `.env` in `backend/` or repo root):

```
DEBUG=true
OSRM_BASE_URL=https://router.project-osrm.org
# SUPABASE_URL=
# SUPABASE_SERVICE_KEY=
```

**Frontend** (optional `frontend/.env`):

```
VITE_API_BASE=/api/v1
```

## API endpoints (v1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/campus/places` | List places (filter by category, pagination) |
| GET | `/api/v1/campus/places/{id}` | Place detail |
| GET | `/api/v1/campus/search?q=` | Search by name / alias / category |
| GET | `/api/v1/campus/nearby` | Nearest places (lat, lng, radius) |
| GET | `/api/v1/campus/categories` | Category counts |
| GET | `/api/v1/campus/map-data` | Lightweight marker payload |
| POST | `/api/v1/navigation/route` | Compute walking route |

## Data notes

- Campus bounding box and centre derived from OpenStreetMap way `671850885`.
- Building names and relative locations taken from public orientation guides, examination venue lists and campus descriptions.
- Coordinates inside the campus polygon are **approximate**. Places marked `verified: false` should be confirmed on the ground.
- Do **not** treat the graph edges as exact footpaths; they connect nearby places for routing purposes.
- Administrators should replace or refine `data/places.json` (or migrate to PostGIS) with surveyed entrance coordinates.

## Design system

- Primary: deep navy `#1e3a5f`
- Surfaces: white / light neutral
- Text: dark charcoal
- Icons: Lucide React
- No gradients, no emojis, restrained shadows, consistent border radii

## Future / optional integrations

- Supabase Auth (student / staff / visitor) + Row Level Security
- PostGIS for spatial queries and custom pedestrian network
- Building photos via Supabase Storage
- Sentry / PostHog (stubs only – keep PII and precise location out of analytics)
- Real-time group navigation (requires explicit consent and session expiry)

## Known limitations

- Campus graph is a proximity graph, not a surveyed path network.
- Public OSRM may route on roads that are not ideal for pedestrians inside campus.
- No authentication UI yet (backend is public for the MVP).
- Location accuracy depends on the device GPS and user permission.
- Offline map tiles are not cached in this version.

## Licence & attribution

- Map data © OpenStreetMap contributors (ODbL).
- Application code provided for educational / institutional use.
- Always keep map attribution visible.

---

Built as a production-oriented MVP following the project requirements. Prioritise correctness, privacy and maintainable architecture.
