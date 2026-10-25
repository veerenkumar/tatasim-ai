import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { fetchDataOverview, uploadCSV } from '../services/api';

export const DataManagementPage: React.FC = () => {
  const [dataOverview, setDataOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDataOverview();
      setDataOverview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    try {
      const res = await uploadCSV(file);
      setUploadStatus(res);
      loadOverview();
    } catch (err: any) {
      setUploadStatus({
        validation_status: 'FAILED',
        message: err.response?.data?.detail || 'Failed to upload CSV file.',
        errors: [err.message],
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const datasets = [
    { key: 'sales', name: 'Sales & Demand Baseline', file: 'sales.csv', desc: 'Monthly sales volume by segment (PV, CV, EV), average selling price (ASP), and cancellation rates.' },
    { key: 'workforce', name: 'Workforce & Labor Hours', file: 'workforce.csv', desc: 'Direct headcount, standard hours, absenteeism rates, and labor hours per vehicle by department.' },
    { key: 'inventory', name: 'Inventory & Bill-of-Materials', file: 'inventory.csv', desc: 'Automotive steel, ECUs, traction battery packs, chassis, stock on hand, and supplier lead times.' },
    { key: 'production_capacity', name: 'Manufacturing Plants', file: 'production_capacity.csv', desc: 'Pune, Sanand, Jamshedpur, Pantnagar, and Lucknow design capacities, active shifts, and yield loss rates.' },
    { key: 'suppliers', name: 'Tier-1 Suppliers', file: 'suppliers.csv', desc: 'Vendor reliability records, supply quotas, lead times, and risk ratings.' },
    { key: 'logistics', name: 'Distribution Corridors', file: 'logistics.csv', desc: 'Highway car-carrier trailers and rail rakes across Western, Northern, Southern, and Eastern corridors.' },
    { key: 'cost_assumptions', name: 'Macro & Financial Rates', file: 'cost_assumptions.csv', desc: 'Corporate tax rate, inventory carrying rate, and working capital financing rates.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <span>Operational Data Strategy & File Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent baseline synthetic datasets, strict CSV schema validation, and data dictionary reference.
          </p>
        </div>
      </div>

      {/* Synthetic Data Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white block font-semibold mb-0.5">Data Integrity & Compliance Policy:</strong>
          All pre-seeded operational datasets are 100% synthetic models developed for simulation algorithms. If you upload custom operational datasets, the system validates column headers, data types, missing records, and non-negative constraints. Invalid records are rejected with full error reporting and never silently overwritten.
        </div>
      </div>

      {/* Upload Zone */}
      <div className="glass-panel p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/70 transition-all text-center bg-slate-900/40">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Upload Custom Business Dataset (CSV)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload replacement CSVs for sales, workforce, inventory, production, or logistics.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all shadow-md shadow-blue-600/30">
            <span>{isUploading ? 'Validating CSV...' : 'Select CSV File'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Upload Validation Feedback */}
      {uploadStatus && (
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
            uploadStatus.validation_status === 'SUCCESS'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              : 'bg-rose-950/60 border-rose-700 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {uploadStatus.validation_status === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{uploadStatus.message}</span>
          </div>

          {uploadStatus.errors && uploadStatus.errors.length > 0 && (
            <ul className="list-disc list-inside space-y-1 pl-2 text-rose-200">
              {uploadStatus.errors.map((err: string, i: number) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Active Datasets List */}
      <div className="glass-panel p-5 rounded-2xl border border-tata-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-wide">
            Active Baseline Operational Datasets
          </h2>
          <button
            onClick={loadOverview}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((d) => {
            const overview = dataOverview?.[d.key];
            return (
              <div
                key={d.key}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {d.file}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {d.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>
                    Rows: <strong className="text-white">{overview?.rows || '—'}</strong> | Cols: <strong className="text-white">{overview?.columns?.length || '—'}</strong>
                  </span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Loaded & Verified</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
