# TataSim AI — What-If Business & Capacity Simulator

> **Enterprise Decision-Support Platform for Tata Motors Limited**  
> Evaluates the operational and financial feasibility of a **20% sales growth target** across manufacturing plants, workforce shifts, supply chain lead times, logistics carrier fleets, and balance-sheet working capital.

---

## 1. Executive Summary & Problem Context

- **Company:** Tata Motors Limited (Passenger Vehicles, Commercial Vehicles, Electric Vehicles).
- **Core Management Question:** Management targets an immediate **20% sales volume increase**. Can existing factory shifts, shop-floor technicians, raw materials (high-strength steel, microchips, battery cells), and highway car-carrier fleets support this additional demand profitably without triggering catastrophic line stoppages or stockouts?
- **TataSim AI Solution:** A deterministic simulation and operations research platform that:
  1. Stress-tests physical capacity constraints across 6 plant departments, 5 manufacturing facilities, 10 Bill-of-Materials components, and 4 regional logistics corridors.
  2. Pinpoints critical operational bottlenecks (e.g., Final Assembly technician deficits, battery module stockouts).
  3. Calculates managerial P&L consequences (operating contribution, overtime premiums, carrying costs, and net incremental EBIT).
  4. Formulates mathematically optimal resource allocations using **SciPy constrained optimization (SLSQP)**.
  5. Quantifies stochastic uncertainties using **Monte Carlo simulation (1,000 trials)**.
  6. Produces explainable strategic recommendations with exact numerical evidence and financial payback estimates.

> **Data Integrity Notice:** All baseline figures, plant capacities, and supplier quotes are **100% synthetic, illustrative operational models** developed for decision-support algorithm testing. Simulated data must never be interpreted as confidential or verified internal Tata Motors data. Core calculations require **zero paid AI APIs**.

---

## 2. Technology Architecture

### Frontend
- **React 18** with **TypeScript** and **Vite**
- **Tailwind CSS** with custom dark enterprise automotive theme (`#070E1E`, `#0B172E`, `#122040`, `#3B82F6`, `#E11D48`)
- **Recharts** for interactive capacity utilization radars, profit bridge waterfalls, and Monte Carlo probability histograms
- **Lucide React** for enterprise iconography
- **React Router v6** for multi-module navigation
- **Axios** with automatic proxy routing

### Backend & Simulation Engine
- **Python 3.11+** with **FastAPI**
- **Pydantic v2** for strict request/response data contracts
- **NumPy & Pandas** for deterministic matrix processing
- **SciPy Optimize (`minimize` with SLSQP)** for non-linear constrained operational optimization
- **SQLAlchemy 2.0** with **SQLite** (PostgreSQL compatible)
- **Pytest** automated unit and integration test suite

---

## 3. Project Structure

```
tatasim-ai/
├── frontend/                       # React 18 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/            # Navbar, Sidebar, KpiCard, StatusBadge, NewScenarioModal
│   │   ├── pages/                 # 12 complete business module views
│   │   │   ├── OverviewDashboard.tsx
│   │   │   ├── SalesDemandPage.tsx
│   │   │   ├── WorkforcePlanningPage.tsx
│   │   │   ├── InventorySuppliersPage.tsx
│   │   │   ├── ManufacturingCapacityPage.tsx
│   │   │   ├── LogisticsDistributionPage.tsx
│   │   │   ├── WhatIfSimulatorPage.tsx
│   │   │   ├── ScenarioComparisonPage.tsx
│   │   │   ├── OptimizationEnginePage.tsx
│   │   │   ├── AiRecommendationsPage.tsx
│   │   │   ├── RiskAnalysisPage.tsx
│   │   │   └── DataManagementPage.tsx
│   │   ├── services/api.ts        # Axios client
│   │   ├── types/index.ts         # TypeScript data contracts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/                        # FastAPI REST API & Deterministic Engine
│   ├── app/
│   │   ├── api/endpoints.py       # REST API endpoints
│   │   ├── engine/                # Core calculation modules
│   │   │   ├── demand.py          # Sales & cancellation modeling
│   │   │   ├── workforce.py       # Man-hours, OT, and hiring costs
│   │   │   ├── inventory.py       # BOM consumption, safety stock, lead times
│   │   │   ├── production.py      # Yield losses, 3rd shifts, and plants
│   │   │   ├── logistics.py       # Highway carriers, 3PL buffer fleets
│   │   │   ├── finance.py         # End-to-end P&L, EBIT, and margins
│   │   │   ├── optimizer.py       # SciPy SLSQP non-linear programming
│   │   │   ├── risk.py            # Vectorized Monte Carlo engine
│   │   │   └── recommendations.py # Explainable rule-based AI playbook
│   │   ├── models/scenario.py     # SQLAlchemy ORM models
│   │   ├── schemas/scenario.py    # Pydantic schemas
│   │   ├── services/
│   │   │   ├── data_loader.py     # CSV loading and schema validation
│   │   │   ├── seeder.py          # 8 preset scenarios DB seeder
│   │   │   └── simulator.py       # Orchestration service
│   │   ├── database.py            # SQLite session management
│   │   └── main.py                # FastAPI entrypoint & CORS
│   ├── tests/
│   │   ├── test_engine.py         # Engine unit tests & edge cases
│   │   └── test_api.py            # API integration tests
│   └── requirements.txt
├── data/                           # Transparent baseline synthetic CSVs
│   ├── sales.csv
│   ├── workforce.csv
│   ├── inventory.csv
│   ├── production_capacity.csv
│   ├── suppliers.csv
│   ├── logistics.csv
│   ├── cost_assumptions.csv
│   └── data_dictionary.md
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Quickstart & Local Setup

### Step 1: Clone or Navigate to the Workspace
```bash
cd /Users/veerenkumarkonchada/.gemini/antigravity-ide/scratch/tatasim-ai
```

### Step 2: Backend Setup & Startup
Ensure Python 3.11+ is available:
```bash
cd backend
python3 -m pip install -r requirements.txt

# Run automated tests to verify calculation logic
python3 -m pytest tests/ -v

# Seed database and launch the FastAPI server on port 8000
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend Swagger docs will be accessible at: `http://127.0.0.1:8000/docs`

### Step 3: Frontend Setup & Startup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173` to interact with the TataSim AI platform.

---

## 5. Preset Scenarios Provided

1. **Baseline (Steady State):** Current monthly run-rate (86,500 units, 0% sales growth, 2 standard shifts).
2. **Sales Growth Only (+20%):** Management's 20% sales expansion without operational adjustments. Exposes severe Assembly workforce deficits and tier-1 component shortages, resulting in massive lost revenue.
3. **Workforce Expansion (+20%):** Authorizes 25% overtime and recruits 450 technical operators.
4. **Inventory Expansion (+20%):** Expands safety buffer stock by +25% and authorizes expedited supplier releases.
5. **Production Expansion (+20%):** Activates a 3rd shift at Pune and Sanand facilities, and cuts downtime by 15%.
6. **Logistics Expansion (+20%):** Contracts 35% 3PL emergency car-carrier fleet along Northern and Western trunks.
7. **Balanced Growth Strategy (+20%):** Mathematically balanced playbook combining +15% OT, 280 hires, 3rd shift at Pune, +15% safety stock, and +25% 3PL logistics fleet. Achieves **100% fulfillment profitably**.
8. **Aggressive Growth Strategy (+35%):** High-expansion scenario with 35% growth, multi-plant 3rd shifts, and subcontracted assembly.

---

## 6. Testing & Validation Verification

Run the full suite of automated tests:
```bash
cd backend
python3 -m pytest tests/ -v
```
All 17 automated unit and integration tests execute in < 4 seconds, verifying demand formulas, physical constraints, SciPy optimization convergence, and Monte Carlo seed reproducibility.
