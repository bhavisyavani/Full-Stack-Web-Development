# MARS-OS: Survival Intelligence

A frontend-only Mars colony operations simulation built with React, Vite, CSS, JavaScript, JSON seed data, and browser localStorage.

## Features

- Mission command-center dashboard
- Life-support reserves for oxygen, water, food, and energy
- Rule-based survival decision recommendations
- Time-step simulation by Martian sols
- Autonomous conservation toggle
- Clickable colony digital-twin schematic
- Subsystem diagnostics and simulated maintenance
- Disaster scenario injection
- What-if risk comparison
- Mission event history and filtering
- Browser persistence with reset-to-baseline

## Requirements

- Node.js 18+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

## Data and persistence

- `public/data/colony.json` supplies the initial colony, resource, subsystem, and incident records.
- `src/engine.js` contains the deterministic simulation and risk calculations.
- `localStorage` saves the user's current simulation state in the browser.
- Use **Reset baseline** or **Reset** to return to initial seed values.

## Architecture

```text
Browser UI (React components)
          |
          v
Application state (useState / useEffect)
          |
          +----> JSON seed data (/public/data/colony.json)
          |
          +----> Simulation engine (src/engine.js)
          |         +-- Sol advancement
          |         +-- Resource policy
          |         +-- Scenario injection
          |         +-- Risk scoring
          |         +-- Recommendations
          |
          +----> Browser localStorage
```

## Important limitations

This is an educational simulation with illustrative values and simplified rules. It does not connect to real Mars telemetry, model validated life-support engineering, predict actual crew survival, or control real hardware. Scenario durations and resource effects are demonstration assumptions.

## Suggested demo flow

1. Open Mission overview and explain the resource reserves.
2. Advance three Sols and show changing telemetry.
3. Open Colony digital twin and select the Water Recycler.
4. Run maintenance and show system health improving.
5. Open Scenario laboratory and inject a Water Recycler Leak.
6. Compare projected risk across incidents.
7. Open Life support and toggle autonomous conservation.
8. Refresh the browser to show localStorage persistence.
9. Reset to the baseline.
