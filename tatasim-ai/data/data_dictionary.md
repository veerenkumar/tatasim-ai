# TataSim AI — Synthetic Data Dictionary & Reference Guide

> **DISCLAIMER & INTEGRITY NOTICE:**  
> All datasets provided in TataSim AI are **100% synthetic, illustrative operational models** developed for algorithmic demonstration, operations research, and what-if simulation purposes. They do NOT represent proprietary, audited, or confidential internal operational records of Tata Motors Limited.

---

## 1. Sales & Demand (`sales.csv`)
| Column Name | Type | Unit | Description |
|---|---|---|---|
| `segment` | String | Code | Vehicle division: `PV` (Passenger Vehicles), `CV` (Commercial Vehicles), `EV` (Electric Vehicles). |
| `model_family` | String | Text | Key representative model lines (e.g. Nexon, Harrier, Curvv, Prima, Ace, Nexon.ev). |
| `baseline_monthly_units` | Integer | Units / Month | Baseline monthly vehicle demand at steady state. (Baseline Total: ~86,500 units/mo). |
| `avg_selling_price_inr` | Float | ₹ (INR) | Blended net average selling price (ASP) realized per vehicle. |
| `cancellation_rate_pct` | Float | % | Historical order cancellation / booking drop-off rate prior to assembly dispatch. |
| `demand_growth_potential_pct`| Float | % | Market demand ceiling under rapid marketing expansion without channel saturation. |
| `target_segment_share_pct` | Float | % | Contribution share to total automotive vehicle volume. |

---

## 2. Workforce & Labor (`workforce.csv`)
| Column Name | Type | Unit | Description |
|---|---|---|---|
| `department` | String | Text | Plant operational department (Body Shop, Paint Shop, Final Assembly, Powertrain & Battery, Quality, Logistics). |
| `active_headcount` | Integer | Employees | Existing direct active full-time equivalent (FTE) workforce. |
| `standard_hours_month` | Float | Hours / Month | Normal contractual productive working hours per worker (176 hrs = 22 days × 8 hrs). |
| `absenteeism_pct` | Float | % | Expected unscheduled absence and sick leave rate. |
| `labor_hours_pv` | Float | Man-Hours / Unit | Direct labor hours required per Passenger Vehicle in this department. |
| `labor_hours_cv` | Float | Man-Hours / Unit | Direct labor hours required per Commercial Vehicle in this department. |
| `labor_hours_ev` | Float | Man-Hours / Unit | Direct labor hours required per Electric Vehicle in this department. |
| `max_ot_hours_worker` | Float | Hours / Month | Statutory / internal policy limit for overtime per worker per month. |
| `hourly_rate_inr` | Float | ₹ / Hour | Base hourly direct wage rate. |
| `ot_rate_inr` | Float | ₹ / Hour | Overtime hourly premium rate (1.75x standard). |
| `hire_cost_inr` | Float | ₹ / Hire | One-time recruitment, vetting, medical, and initial onboarding cost per employee. |
| `salary_month_inr` | Float | ₹ / Month | Total monthly recurring wage and statutory benefits per newly hired employee. |

---

## 3. Inventory & Components (`inventory.csv`)
| Column Name | Type | Unit | Description |
|---|---|---|---|
| `component_id` | String | ID | Unique Bill-of-Materials component SKU. |
| `component_name` | String | Text | Material or subassembly title. |
| `category` | String | Category | Classification (Raw Material, Electronics, Battery, Chassis, Wheels, etc.). |
| `current_stock_units` | Float | Units | Current physical on-hand inventory across plant stockyards. |
| `safety_stock_units` | Float | Units | Mandated buffer stock to protect against supplier disruptions. |
| `unit_cost_inr` | Float | ₹ / Unit | Procurement cost per physical unit. |
| `pv_usage` | Float | Units / Vehicle | Consumption coefficient per Passenger Vehicle assembled. |
| `cv_usage` | Float | Units / Vehicle | Consumption coefficient per Commercial Vehicle assembled. |
| `ev_usage` | Float | Units / Vehicle | Consumption coefficient per Electric Vehicle assembled. |
| `lead_time_weeks` | Float | Weeks | Standard replenishment order lead time from supplier release to delivery at dock. |
| `supplier_reliability_pct` | Float | % | Historical on-time in-full (OTIF) supplier fulfillment rate. |
| `holding_cost_annual_pct` | Float | % / Year | Annualized inventory carrying cost rate (warehousing, shrinkage, financing). |

---

## 4. Manufacturing Facilities (`production_capacity.csv`)
| Column Name | Type | Unit | Description |
|---|---|---|---|
| `plant_id` | String | ID | Facility code (Pune, Sanand, Jamshedpur, Pantnagar, Lucknow). |
| `plant_name` | String | Text | Factory manufacturing division. |
| `location` | String | State | Geographical plant site. |
| `primary_segments` | String | Code(s) | Vehicle platforms tooled at this plant. |
| `installed_monthly_capacity` | Integer | Units / Month | Nominal design capacity on current 2-shift schedule. |
| `active_shifts` | Integer | Count | Currently operational production shifts per 24h day. |
| `max_shifts` | Integer | Count | Maximum physical shift capacity (up to 3 shifts). |
| `yield_rate_pct` | Float | % | First-pass manufacturing quality yield (accounting for scrap and offline rework). |
| `planned_downtime_hours_month` | Float | Hours / Month | Scheduled maintenance, tooling changeover, and audit downtime. |
| `variable_mfg_cost_unit_inr` | Float | ₹ / Unit | Plant utility, consumable, tooling, and machine operating cost per unit produced. |
| `extra_shift_capex_cr` | Float | ₹ Crore | Tooling modification, lighting, and tooling prep cost to activate an additional shift. |
| `subcontracting_available` | Boolean | True/False | Whether tier-1 contract manufacturing partner capacity can be tapped. |
| `subcontracting_markup_pct` | Float | % | Price premium over internal variable manufacturing cost for outsourced contract units. |

---

## 5. Logistics & Distribution Corridors (`logistics.csv`)
| Column Name | Type | Unit | Description |
|---|---|---|---|
| `zone_id` | String | ID | Distribution hub code (West, North, South, East). |
| `zone_name` | String | Text | Regional distribution network. |
| `primary_hub` | String | Text | Central dispatch marshaling yard. |
| `transport_mode` | String | Text | Fleet mode (Car-carrier trailers, flatbed road carriers, dedicated rail rakes). |
| `monthly_dispatch_capacity` | Integer | Vehicles / Mo | Contracted monthly carrier outbound dispatch throughput. |
| `transit_days_avg` | Float | Days | Mean transit time from factory gate to dealership delivery. |
| `cost_per_vehicle_inr` | Float | ₹ / Vehicle | Contracted freight cost per delivered vehicle. |
| `damage_loss_pct` | Float | % | En-route transit insurance loss and cosmetic rework rate. |
| `third_party_buffer_cap` | Integer | Vehicles / Mo | Additional spot-market 3PL logistics capacity available on demand. |
| `third_party_rate_premium_pct`| Float | % | Spot freight rate surcharge above contracted baseline rates. |

---

## 6. Financial & Macro Parameters (`cost_assumptions.csv`)
Includes working capital borrowing rates (9.25%), SG&A fixed allocations (₹48 Cr/mo), plant fixed overheads (₹195 Cr/mo), and statutory corporate tax rates (25.17%).
