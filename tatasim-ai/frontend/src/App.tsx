import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NewScenarioModal } from './components/NewScenarioModal';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { SalesDemandPage } from './pages/SalesDemandPage';
import { WorkforcePlanningPage } from './pages/WorkforcePlanningPage';
import { InventorySuppliersPage } from './pages/InventorySuppliersPage';
import { ManufacturingCapacityPage } from './pages/ManufacturingCapacityPage';
import { LogisticsDistributionPage } from './pages/LogisticsDistributionPage';
import { WhatIfSimulatorPage } from './pages/WhatIfSimulatorPage';
import { ScenarioComparisonPage } from './pages/ScenarioComparisonPage';
import { OptimizationEnginePage } from './pages/OptimizationEnginePage';
import { AiRecommendationsPage } from './pages/AiRecommendationsPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { DataManagementPage } from './pages/DataManagementPage';

import {
  fetchScenarios,
  fetchScenario,
  createScenario,
  updateScenario,
  simulateScenario
} from './services/api';
import { ScenarioListItem, SimulationResponse, ScenarioParameters } from './types';

export const App: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-sales-growth-only');
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Initialize and load scenarios list
  useEffect(() => {
    loadScenariosAndDefault();
  }, []);

  const loadScenariosAndDefault = async () => {
    setIsLoading(true);
    try {
      const list = await fetchScenarios();
      setScenarios(list);
      // Select 20% sales growth scenario as active default
      const defaultId = list.some((s) => s.id === 'scenario-sales-growth-only')
        ? 'scenario-sales-growth-only'
        : list[0]?.id || 'scenario-baseline';

      setActiveScenarioId(defaultId);
      const simData = await fetchScenario(defaultId);
      setSimulation(simData);
    } catch (err) {
      console.error('Failed to load scenarios', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = async (id: string) => {
    setIsLoading(true);
    setActiveScenarioId(id);
    try {
      const simData = await fetchScenario(id);
      setSimulation(simData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSimulate20 = async () => {
    await handleSelectScenario('scenario-sales-growth-only');
  };

  const handleUpdateParameters = async (newParams: ScenarioParameters) => {
    setIsLoading(true);
    try {
      // Re-simulate on the fly and update current active view
      const updatedSim = await simulateScenario(newParams);
      setSimulation(updatedSim);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewScenario = async (
    name: string,
    description: string,
    params: ScenarioParameters
  ) => {
    setIsLoading(true);
    setIsModalOpen(false);
    try {
      const newSim = await createScenario(name, description, params);
      const updatedList = await fetchScenarios();
      setScenarios(updatedList);
      if (newSim.scenario_id) {
        setActiveScenarioId(newSim.scenario_id);
      }
      setSimulation(newSim);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-tata-dark text-slate-100 flex flex-col font-sans">
        {/* Top Navigation */}
        <Navbar
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleSelectScenario}
          feasibilityStatus={simulation?.finance.feasibility_status || 'UNKNOWN'}
          growthTargetPct={simulation?.parameters.sales_growth_target_pct || 20}
          onQuickSimulate20={handleQuickSimulate20}
          onOpenNewScenarioModal={() => setIsModalOpen(true)}
          isLoading={isLoading}
        />

        {/* Main Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Side Navigation */}
          <Sidebar />

          {/* Router View Container */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Routes>
              <Route
                path="/"
                element={
                  <OverviewDashboard
                    simulation={simulation}
                    isLoading={isLoading}
                    onSelectScenario={handleSelectScenario}
                  />
                }
              />
              <Route
                path="/sales"
                element={
                  <SalesDemandPage
                    simulation={simulation}
                    onUpdateParameters={handleUpdateParameters}
                    isLoading={isLoading}
                  />
                }
              />
              <Route
                path="/workforce"
                element={
                  <WorkforcePlanningPage
                    simulation={simulation}
                    onUpdateParameters={handleUpdateParameters}
                    isLoading={isLoading}
                  />
                }
              />
              <Route
                path="/inventory"
                element={
                  <InventorySuppliersPage
                    simulation={simulation}
                    onUpdateParameters={handleUpdateParameters}
                    isLoading={isLoading}
                  />
                }
              />
              <Route
                path="/manufacturing"
                element={
                  <ManufacturingCapacityPage
                    simulation={simulation}
                    onUpdateParameters={handleUpdateParameters}
                    isLoading={isLoading}
                  />
                }
              />
              <Route
                path="/logistics"
                element={
                  <LogisticsDistributionPage
                    simulation={simulation}
                    onUpdateParameters={handleUpdateParameters}
                    isLoading={isLoading}
                  />
                }
              />
              <Route
                path="/simulator"
                element={
                  <WhatIfSimulatorPage
                    simulation={simulation}
                    scenarios={scenarios}
                    onSelectScenario={handleSelectScenario}
                    onRefreshScenarios={loadScenariosAndDefault}
                  />
                }
              />
              <Route
                path="/compare"
                element={
                  <ScenarioComparisonPage
                    scenarios={scenarios}
                    activeScenarioId={activeScenarioId}
                    onSelectScenario={handleSelectScenario}
                  />
                }
              />
              <Route path="/optimize" element={<OptimizationEnginePage />} />
              <Route
                path="/recommendations"
                element={<AiRecommendationsPage simulation={simulation} />}
              />
              <Route path="/risk" element={<RiskAnalysisPage simulation={simulation} />} />
              <Route path="/data" element={<DataManagementPage />} />
            </Routes>
          </main>
        </div>

        {/* New Scenario Modal */}
        <NewScenarioModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateNewScenario}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
