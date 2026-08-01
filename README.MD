# Chowdeck Geofence Ops

A polygon-based delivery zone system with a safe, observable rollout path off a legacy radius-based model, plus rider entry/exit detection on top of the same zones.

Inspired by a Chowdeck engineering post on why radius-based delivery coverage breaks down at scale, and specifically built around the migration problem the post flagged but didn't solve: how do you roll out a new coverage model to live customers without disrupting order flow.

**📄 Full write-up:** [Read the case study →](https://oliveszn.vercel.app/case-studies/chowdeck)

## What this is

- A **rollout state machine** per city `radius_only → shadow → polygon_only` that lets a new polygon-based delivery check run silently alongside the old radius check, log every disagreement, and only take over once the data says it's safe to.
- A **map dashboard** (React + Leaflet) for drawing delivery zone polygons, testing addresses against both systems side by side, and watching the rollout stage per city.
- **Zone exceptions**: temporary carve-outs on a zone (weather, rider shortage, time restrictions) without touching the underlying polygon.
- **Rider entry/exit detection**: every rider location ping is diffed against their last known position to detect zone boundary crossings, logged as discrete events.
- A **mismatch-rate endpoint** that turns "the new system should be fine" into an actual number before anything is trusted with real orders.

## Stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Backend  | Bun, Express, MySQL (mysql2), Zod                           |
| Frontend | React, Vite, Leaflet + leaflet-draw                         |
| Testing  | `bun:test`, fake-injected model layer (no live DB in tests) |

## Project structure

```
chowdeck-geofence/       # backend
  src/
    routes/               # cities, zones, delivery-check, riders
    controllers/
    services/             # rollout logic, shadow-mode decision engine, entry/exit diffing
    models/               # raw SQL, one file per table group
    db/
      schema.sql
      migrate.ts          # applies schema.sql without needing the mysql CLI
      seed.ts             # seeds Lagos/Ogun/Abeokuta + a demo Lagos polygon
    utils/
      polygon.ts           # point-in-polygon, point-in-radius

chowdeck-geofence-web/    # frontend
  src/
    components/
      MapView.tsx          # Leaflet map, polygon drawing, test-address clicks
      RolloutBadge.tsx      # segmented rollout-stage indicator
      RiderSimPanel.tsx     # simulated rider walk + live enter/exit log
```

## Getting started

```bash
# backend
cd chowdeck
bun install
cp .env.example .env        # fill in your MySQL credentials
bun run migrate             # applies schema.sql
bun run seed                # seeds demo cities + a Lagos polygon
bun run dev

# frontend
cd chowdeck
bun install
bun run dev
```

Visit `localhost:5173`. Select Lagos to see the seeded polygon, shadow-mode rollout status, and a working mismatch case.

## Tests

```bash
cd chowdeck-geofence
bun test
```

Covers the rollout state machine (including invalid transitions), the shadow-mode decision logic and mismatch logging, zone-exception carve-outs, and the rider zone entry/exit diffing all against fake in-memory model implementations rather than a live database.

## Known gaps

A few things called out honestly rather than hidden, covered in more depth in the case study:

- Route param IDs aren't strictly validated (a non-numeric ID currently falls through to a 404 instead of a clean 400)
- No existence check on some foreign keys before insert
- Point-in-polygon uses plain ray-casting, not a spatial index, fine at this scale, not at real traffic volume
- Rider location writes are synchronous, not queued

## Background

The original Chowdeck engineering piece this is built off of: [https://x.com/peculiarerhis/status/2042571306101608824]
