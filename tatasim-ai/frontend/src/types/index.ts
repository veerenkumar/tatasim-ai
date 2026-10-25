export interface ScenarioParameters {
  sales_growth_target_pct: number;
  planning_horizon: string;
  target_segments: string[];
  additional_hires: number;
  overtime_pct: number;
  plants_with_3rd_shift: string[];
  safety_stock_buffer_pct: number;
  expedite_inventory: boolean;
  subcontracting_units: number;
  third_party_logistics_pct: number;
  downtime_reduction_pct: number;
  express_freight: boolean;
}

export interface SegmentDemandResult {
  segment: string;
  model_family: string;
  baseline_units: number;
  growth_rate_pct: number;
  gross_demanded_units: number;
  cancellation_units: number;
  net_order_units: number;
  asp_inr: number;
  target_revenue_cr: number;
  baseline_revenue_cr: number;
  incremental_revenue_target_cr: number;
}

export interface DemandPlanResult {
  horizon: string;
  horizon_multiplier: number;
  overall_growth_rate_pct: number;
  total_baseline_units: number;
  total_gross_demanded_units: number;
  total_cancellation_units: number;
  total_net_order_units: number;
  total_baseline_revenue_cr: number;
  total_target_revenue_cr: number;
  total_incremental_revenue_cr: number;
  segment_breakdown: SegmentDemandResult[];
}

export interface DepartmentWorkforceResult {
  department: string;
  active_headcount: number;
  additional_hires: number;
  effective_headcount: number;
  standard_hours_available: number;
  max_ot_hours_allowed: number;
  total_hours_available: number;
  required_labor_hours: number;
  utilization_pct: number;
  shortfall_hours: number;
  surplus_hours: number;
  staffing_gap_fte: number;
  ot_hours_utilized: number;
  regular_labor_cost_cr: number;
  ot_labor_cost_cr: number;
  hiring_cost_cr: number;
  recurring_salary_cost_cr: number;
  total_workforce_cost_cr: number;
  is_bottleneck: boolean;
  max_units_supported: number;
}

export interface WorkforceAnalysisResult {
  total_active_headcount: number;
  total_additional_hires: number;
  total_effective_headcount: number;
  total_available_hours: number;
  total_required_hours: number;
  overall_utilization_pct: number;
  total_shortfall_hours: number;
  total_ot_hours_utilized: number;
  total_regular_cost_cr: number;
  total_ot_cost_cr: number;
  total_hiring_cost_cr: number;
  total_recurring_salary_cr: number;
  total_labor_cost_cr: number;
  bottleneck_department: string;
  max_units_supported_by_workforce: number;
  is_feasible: boolean;
  departments: DepartmentWorkforceResult[];
}

export interface ComponentInventoryResult {
  component_id: string;
  component_name: string;
  category: string;
  current_stock: number;
  safety_stock: number;
  required_units: number;
  coverage_days: number;
  shortage_units: number;
  reorder_units: number;
  unit_cost_inr: number;
  bom_cost_cr: number;
  procurement_cost_cr: number;
  holding_cost_cr: number;
  working_capital_cr: number;
  lead_time_weeks: number;
  supplier_reliability_pct: number;
  risk_level: string;
  is_shortage: boolean;
  max_vehicles_supported: number;
}

export interface InventoryAnalysisResult {
  total_bom_consumption_cr: number;
  total_procurement_cost_cr: number;
  total_holding_cost_cr: number;
  total_working_capital_cr: number;
  shortage_component_count: number;
  critical_shortages: string[];
  primary_bottleneck_component: string;
  max_units_supported_by_inventory: number;
  is_feasible: boolean;
  components: ComponentInventoryResult[];
}

export interface PlantCapacityResult {
  plant_id: string;
  plant_name: string;
  location: string;
  primary_segments: string;
  base_installed_capacity: number;
  active_shifts: number;
  effective_capacity: number;
  required_starts: number;
  finished_output_feasible: number;
  utilization_pct: number;
  shortfall_units: number;
  yield_loss_scrap_units: number;
  variable_mfg_cost_cr: number;
  extra_shift_capex_cr: number;
  subcontracted_units: number;
  subcontracting_cost_cr: number;
  is_bottleneck: boolean;
}

export interface ProductionAnalysisResult {
  total_finished_demand: number;
  total_required_starts: number;
  total_yield_scrap_units: number;
  total_internal_capacity: number;
  overall_mfg_utilization_pct: number;
  total_shortfall_units: number;
  total_subcontracted_units: number;
  total_variable_mfg_cost_cr: number;
  total_shift_capex_amortized_cr: number;
  total_subcontracting_cost_cr: number;
  total_mfg_cost_cr: number;
  bottleneck_plant: string;
  max_finished_units_supported: number;
  is_feasible: boolean;
  plants: PlantCapacityResult[];
}

export interface ZoneLogisticsResult {
  zone_id: string;
  zone_name: string;
  primary_hub: string;
  transport_mode: string;
  contracted_capacity: number;
  third_party_buffer_capacity: number;
  total_effective_capacity: number;
  required_dispatch_units: number;
  feasible_dispatch_units: number;
  utilization_pct: number;
  shortfall_units: number;
  transit_days_avg: number;
  base_freight_cost_cr: number;
  spot_premium_cost_cr: number;
  total_corridor_cost_cr: number;
  delay_risk_level: string;
  is_bottleneck: boolean;
}

export interface LogisticsAnalysisResult {
  total_dispatch_demanded: number;
  total_contracted_capacity: number;
  total_effective_capacity: number;
  total_feasible_dispatch: number;
  overall_logistics_utilization_pct: number;
  total_shortfall_units: number;
  total_base_freight_cost_cr: number;
  total_spot_premium_cost_cr: number;
  total_logistics_cost_cr: number;
  bottleneck_zone: string;
  is_feasible: boolean;
  zones: ZoneLogisticsResult[];
}

export interface CostBreakdown {
  bom_raw_material_cost_cr: number;
  variable_manufacturing_cost_cr: number;
  direct_regular_labor_cost_cr: number;
  overtime_labor_cost_cr: number;
  outbound_logistics_cost_cr: number;
  subcontracting_outsourcing_cr: number;
  total_variable_costs_cr: number;
  fixed_plant_overhead_cr: number;
  fixed_sga_overhead_cr: number;
  inventory_carrying_cost_cr: number;
  working_capital_financing_cr: number;
  recurring_new_hire_payroll_cr: number;
  total_fixed_recurring_costs_cr: number;
  hiring_onboarding_capex_cr: number;
  extra_shift_setup_amortized_cr: number;
  total_one_time_costs_cr: number;
  total_modeled_operating_cost_cr: number;
}

export interface FinancialImpactResult {
  demanded_units: number;
  fulfilled_units: number;
  unfulfilled_units: number;
  fulfillment_rate_pct: number;
  target_potential_revenue_cr: number;
  realized_fulfilled_revenue_cr: number;
  lost_revenue_from_bottlenecks_cr: number;
  operating_contribution_cr: number;
  contribution_margin_pct: number;
  operating_profit_ebit_cr: number;
  operating_margin_pct: number;
  tax_expense_cr: number;
  net_profit_after_tax_cr: number;
  working_capital_requirement_cr: number;
  procurement_cash_outlay_cr: number;
  baseline_revenue_cr: number;
  baseline_operating_profit_cr: number;
  incremental_revenue_cr: number;
  incremental_operating_profit_cr: number;
  incremental_margin_pct: number;
  roi_on_incremental_spend_pct: number;
  costs: CostBreakdown;
  is_financially_viable: boolean;
  feasibility_status: string;
  limiting_resource: string;
}

export interface RecommendationCard {
  id: string;
  category: string;
  priority: string;
  title: string;
  identified_problem: string;
  supporting_numerical_evidence: string;
  recommended_action: string;
  estimated_incremental_cost_cr: number;
  expected_operational_improvement: string;
  estimated_financial_impact: string;
  key_assumptions_and_risks: string;
}

export interface RecommendationReport {
  scenario_id?: string;
  overall_growth_target_pct: number;
  executive_narrative: string;
  bottleneck_summary: string;
  total_unfulfilled_units: number;
  lost_revenue_cr: number;
  cards: RecommendationCard[];
}

export interface SimulationResponse {
  scenario_id?: string;
  scenario_name: string;
  parameters: ScenarioParameters;
  demand: DemandPlanResult;
  workforce: WorkforceAnalysisResult;
  inventory: InventoryAnalysisResult;
  production: ProductionAnalysisResult;
  logistics: LogisticsAnalysisResult;
  finance: FinancialImpactResult;
  recommendations: RecommendationReport;
}

export interface ExecutiveDashboardSummary {
  current_monthly_sales_revenue_cr: number;
  target_monthly_sales_revenue_cr: number;
  baseline_units: number;
  target_projected_units: number;
  fulfilled_units: number;
  unfulfilled_units: number;
  fulfillment_rate_pct: number;
  available_workforce_headcount: number;
  effective_workforce_utilization_pct: number;
  inventory_shortage_components_count: number;
  manufacturing_capacity_utilization_pct: number;
  logistics_capacity_utilization_pct: number;
  estimated_operating_costs_cr: number;
  projected_operating_profit_cr: number;
  incremental_operating_profit_cr: number;
  number_of_operational_bottlenecks: number;
  overall_growth_feasibility_status: string;
  limiting_resource: string;
  active_scenario_name: string;
  illustrative_data_disclaimer: string;
}

export interface ScenarioListItem {
  id: string;
  name: string;
  description?: string;
  is_preset: boolean;
  parameters: ScenarioParameters;
  feasibility_status?: string;
  fulfilled_units?: number;
  revenue_cr?: number;
  operating_profit_cr?: number;
  incremental_profit_cr?: number;
  limiting_resource?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScenarioComparisonItem {
  scenario_id: string;
  scenario_name: string;
  sales_growth_target_pct: number;
  demanded_units: number;
  fulfilled_units: number;
  unfulfilled_units: number;
  fulfillment_rate_pct: number;
  revenue_cr: number;
  operating_profit_cr: number;
  incremental_profit_cr: number;
  total_operating_cost_cr: number;
  working_capital_cr: number;
  feasibility_status: string;
  limiting_resource: string;
  bottleneck_department: string;
  bottleneck_plant: string;
  bottleneck_inventory: string;
  bottleneck_logistics: string;
  workforce_utilization_pct: number;
  production_utilization_pct: number;
  logistics_utilization_pct: number;
}

export interface ScenarioComparisonResponse {
  scenarios: ScenarioComparisonItem[];
  best_profit_scenario_id: string;
  most_feasible_scenario_id: string;
  summary_analysis: string;
}

export interface OptimizationResult {
  is_optimal_found: boolean;
  objective_used: string;
  target_growth_pct: number;
  achieved_fulfillment_pct: number;
  fulfilled_units: number;
  optimal_operating_profit_cr: number;
  optimal_incremental_profit_cr: number;
  total_incremental_cost_cr: number;
  allocation: {
    recommended_overtime_pct: number;
    recommended_additional_hires: number;
    recommended_3rd_shift_plants: string[];
    recommended_safety_stock_buffer_pct: number;
    recommended_3pl_logistics_pct: number;
    recommended_subcontracting_units: number;
  };
  constraints_satisfied: Record<string, boolean>;
  explanation: string;
}

export interface HistogramBin {
  bin_range: string;
  bin_center_cr: number;
  frequency: number;
  probability_pct: number;
}

export interface RiskSensitivityFactor {
  risk_factor: string;
  correlation_with_profit: number;
  impact_severity: string;
  description: string;
}

export interface MonteCarloRiskResult {
  iterations_run: number;
  random_seed: number;
  mean_operating_profit_cr: number;
  median_operating_profit_cr: number;
  std_dev_profit_cr: number;
  percentile_5th_var_cr: number;
  percentile_95th_cr: number;
  probability_meeting_sales_target_pct: number;
  probability_material_shortage_pct: number;
  probability_budget_overrun_pct: number;
  risk_level_summary: string;
  histogram_bins: HistogramBin[];
  sensitivity_ranking: RiskSensitivityFactor[];
}
