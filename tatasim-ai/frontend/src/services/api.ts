import axios from 'axios';
import {
  ExecutiveDashboardSummary,
  SimulationResponse,
  ScenarioListItem,
  ScenarioParameters,
  ScenarioComparisonResponse,
  OptimizationResult,
  MonteCarloRiskResult,
  RecommendationReport
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDashboardSummary = async (scenarioId?: string): Promise<ExecutiveDashboardSummary> => {
  const url = scenarioId ? `/dashboard/summary?scenario_id=${scenarioId}` : '/dashboard/summary';
  const res = await api.get<ExecutiveDashboardSummary>(url);
  return res.data;
};

export const fetchScenarios = async (): Promise<ScenarioListItem[]> => {
  const res = await api.get<ScenarioListItem[]>('/scenarios');
  return res.data;
};

export const fetchScenario = async (id: string): Promise<SimulationResponse> => {
  const res = await api.get<SimulationResponse>(`/scenarios/${id}`);
  return res.data;
};

export const createScenario = async (
  name: string,
  description: string,
  parameters: ScenarioParameters
): Promise<SimulationResponse> => {
  const res = await api.post<SimulationResponse>('/scenarios', {
    name,
    description,
    parameters,
  });
  return res.data;
};

export const updateScenario = async (
  id: string,
  name?: string,
  description?: string,
  parameters?: ScenarioParameters
): Promise<SimulationResponse> => {
  const res = await api.put<SimulationResponse>(`/scenarios/${id}`, {
    name,
    description,
    parameters,
  });
  return res.data;
};

export const deleteScenario = async (id: string): Promise<void> => {
  await api.delete(`/scenarios/${id}`);
};

export const simulateScenario = async (parameters: ScenarioParameters): Promise<SimulationResponse> => {
  const res = await api.post<SimulationResponse>('/simulate', parameters);
  return res.data;
};

export const compareScenarios = async (scenarioIds: string[]): Promise<ScenarioComparisonResponse> => {
  const res = await api.post<ScenarioComparisonResponse>('/scenarios/compare', {
    scenario_ids: scenarioIds,
  });
  return res.data;
};

export const runOptimization = async (payload: {
  objective: string;
  growth_target_pct: number;
  min_fulfillment_pct: number;
  allow_overtime?: boolean;
  allow_hiring?: boolean;
  allow_extra_shifts?: boolean;
  allow_subcontracting?: boolean;
  allow_3pl_logistics?: boolean;
}): Promise<OptimizationResult> => {
  const res = await api.post<OptimizationResult>('/optimize', payload);
  return res.data;
};

export const runRiskAnalysis = async (
  iterations = 1000,
  randomSeed = 42,
  growthTargetPct = 20.0
): Promise<MonteCarloRiskResult> => {
  const res = await api.post<MonteCarloRiskResult>(
    `/risk/analyze?iterations=${iterations}&random_seed=${randomSeed}&growth_target_pct=${growthTargetPct}`
  );
  return res.data;
};

export const fetchRecommendations = async (scenarioId: string): Promise<RecommendationReport> => {
  const res = await api.get<RecommendationReport>(`/recommendations/${scenarioId}`);
  return res.data;
};

export const fetchDataOverview = async (): Promise<any> => {
  const res = await api.get('/data/overview');
  return res.data;
};

export const uploadCSV = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/data/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const getExportScenarioCsvUrl = (scenarioId: string) => `/api/reports/export/csv/${scenarioId}`;

export const getExportComparisonCsvUrl = (scenarioIds: string[]) =>
  `/api/reports/export/comparison-csv?ids=${scenarioIds.join(',')}`;

export default api;
