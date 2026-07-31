import { useEffect, useState, useCallback } from 'react';
import {
  FileText, Download, FileSpreadsheet, BarChart3,
  Users, QrCode, Mail, AlertCircle, Clock, ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { reportsApi, studentsApi } from '../api';
import { UploadBatch } from '../types';
import { cn, percent } from '../utils';
import toast from 'react-hot-toast';

interface Summary {
  total: number;
  qrGenerated: number;
  sent: number;
  failed: number;
  pending: number;
}

function StatRow({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const pct = percent(value, total);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-dark-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-dark-200">{value.toLocaleString()}</span>
          <span className="text-xs text-dark-600 w-8 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getSummary() as { data: { success: boolean; data: Summary } };
      if (res.data.success) setSummary(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    studentsApi.getBatches().then(res => {
      if (res.data.success) setBatches(res.data.data || []);
    });
    fetchSummary();
  }, [fetchSummary]);

  const handleDownloadCsv = () => {
    toast.success('Downloading CSV report...');
    reportsApi.downloadCsv(selectedBatch || undefined);
  };

  const handleDownloadExcel = () => {
    toast.success('Downloading Excel report...');
    reportsApi.downloadExcel(selectedBatch || undefined);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Reports</h1>
          <p className="section-subtitle">Download detailed reports and view campaign statistics</p>
        </div>
        <button onClick={fetchSummary} disabled={loading} className="btn-ghost text-sm">
          <RefreshCw size={15} className={cn(loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: summary.total, icon: Users, color: 'text-shield-400' },
            { label: 'QR Generated', value: summary.qrGenerated, icon: QrCode, color: 'text-violet-400' },
            { label: 'Emails Sent', value: summary.sent, icon: Mail, color: 'text-green-400' },
            { label: 'Failed', value: summary.failed, icon: AlertCircle, color: 'text-red-400' },
            { label: 'Pending', value: summary.pending, icon: Clock, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-4 text-center">
              <Icon size={18} className={cn(color, 'mx-auto mb-1.5')} />
              <p className="text-2xl font-bold font-mono text-dark-100">{value.toLocaleString()}</p>
              <p className="text-xs text-dark-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress breakdown */}
      {summary && summary.total > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-dark-200 mb-5 flex items-center gap-2">
            <BarChart3 size={16} className="text-shield-400" />
            Campaign Progress
          </h2>
          <div className="space-y-4">
            <StatRow label="QR Codes Generated" value={summary.qrGenerated} total={summary.total} color="bg-violet-500" />
            <StatRow label="Emails Sent" value={summary.sent} total={summary.total} color="bg-green-500" />
            <StatRow label="Failed" value={summary.failed} total={summary.total} color="bg-red-500" />
            <StatRow label="Pending" value={summary.pending} total={summary.total} color="bg-amber-500" />
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-dark-200 mb-2 flex items-center gap-2">
          <FileText size={16} className="text-shield-400" />
          Export Report
        </h2>
        <p className="text-xs text-dark-500 mb-5">
          Download a full report with Student ID, Name, Email, QR Status, Email Status, Sent Time, and Failure Reason.
        </p>

        {/* Filter by batch */}
        {batches.length > 0 && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
              Filter by Batch (optional)
            </label>
            <div className="relative max-w-xs">
              <select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className="input-field pr-9 text-sm"
              >
                <option value="">All batches</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.fileName}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CSV */}
          <button
            onClick={handleDownloadCsv}
            className="flex items-start gap-4 p-5 bg-dark-800/50 border border-dark-700 hover:border-shield-600/50 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-600/15 border border-green-600/30 flex items-center justify-center flex-shrink-0 group-hover:bg-green-600/25 transition-all">
              <FileText size={20} className="text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-dark-100">Download CSV</p>
              <p className="text-xs text-dark-500 mt-0.5">Comma-separated values file</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-400 font-medium">
                <Download size={12} />
                Export as .csv
              </div>
            </div>
          </button>

          {/* Excel */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-start gap-4 p-5 bg-dark-800/50 border border-dark-700 hover:border-shield-600/50 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-600/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/25 transition-all">
              <FileSpreadsheet size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-dark-100">Download Excel</p>
              <p className="text-xs text-dark-500 mt-0.5">Microsoft Excel workbook</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-400 font-medium">
                <Download size={12} />
                Export as .xlsx
              </div>
            </div>
          </button>
        </div>

        {/* Column preview */}
        <div className="mt-5 p-4 bg-dark-900/60 rounded-lg">
          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3">Report Columns</p>
          <div className="flex flex-wrap gap-2">
            {['Student ID', 'Name', 'Email', 'Department', 'QR Generated', 'Email Status', 'Time Sent', 'Failure Reason'].map(col => (
              <span key={col} className="px-2.5 py-1 bg-dark-800 border border-dark-700 rounded text-xs font-mono text-dark-400">
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
