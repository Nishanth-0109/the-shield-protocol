import { useEffect, useState, useCallback } from 'react';
import {
  Users, QrCode, Mail, AlertCircle, Clock,
  TrendingUp, Upload, RefreshCw, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { dashboardApi } from '../api';
import { DashboardStats, ChartData, ActivityEvent } from '../types';
import { formatDate, timeAgo, percent } from '../utils';

// =============================================
// Stat Card
// =============================================
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
  percent?: number;
}

function StatCard({ title, value, icon: Icon, color, sub, percent: pct }: StatCardProps) {
  return (
    <div className="glass-card p-5 group hover:border-shield-700/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        {pct !== undefined && (
          <span className="text-xs font-semibold text-dark-400">{pct}%</span>
        )}
      </div>
      <p className="text-3xl font-bold text-dark-50 font-mono tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-dark-400 mt-1 font-medium">{title}</p>
      {sub && <p className="text-xs text-dark-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// =============================================
// Activity event icon
// =============================================
function ActivityIcon({ type }: { type: ActivityEvent['type'] }) {
  const map = {
    upload: { icon: Upload, color: 'text-blue-400 bg-blue-500/10' },
    qr_generated: { icon: QrCode, color: 'text-violet-400 bg-violet-500/10' },
    email_sent: { icon: CheckCircle, color: 'text-green-400 bg-green-500/10' },
    email_failed: { icon: XCircle, color: 'text-red-400 bg-red-500/10' },
    retry: { icon: RefreshCw, color: 'text-amber-400 bg-amber-500/10' },
  };
  const { icon: Icon, color } = map[type] || map.upload;
  return (
    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon size={13} />
    </div>
  );
}

// =============================================
// Custom tooltip
// =============================================
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 text-xs shadow-xl">
      {label && <p className="text-dark-300 mb-2 font-semibold">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-dark-400">{p.name}:</span>
          <span className="text-dark-100 font-mono font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// =============================================
// Dashboard Page
// =============================================
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getChartData(),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data!);
      if (chartRes.data.success) setChartData(chartRes.data.data!);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const total = stats?.totalStudents || 0;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-shield-400 animate-spin" />
          <p className="text-dark-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">Real-time overview of your QR & Email automation</p>
        </div>
        <button onClick={fetchData} className="btn-ghost text-sm" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Students" value={stats?.totalStudents || 0}
          icon={Users} color="bg-shield-600"
          sub="Across all batches"
        />
        <StatCard
          title="QR Generated" value={stats?.qrGenerated || 0}
          icon={QrCode} color="bg-violet-600"
          percent={percent(stats?.qrGenerated || 0, total)}
        />
        <StatCard
          title="Emails Sent" value={stats?.emailsSent || 0}
          icon={Mail} color="bg-green-600"
          percent={percent(stats?.emailsSent || 0, total)}
        />
        <StatCard
          title="Failed" value={stats?.emailsFailed || 0}
          icon={AlertCircle} color="bg-red-600"
          percent={percent(stats?.emailsFailed || 0, total)}
        />
        <StatCard
          title="Pending" value={stats?.emailsPending || 0}
          icon={Clock} color="bg-amber-600"
          percent={percent(stats?.emailsPending || 0, total)}
        />
      </div>

      {/* Progress Overview */}
      {total > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-shield-400" />
              <h2 className="text-sm font-semibold text-dark-200">Overall Progress</h2>
            </div>
            <span className="text-xs text-dark-400 font-mono">
              {stats?.emailsSent || 0} / {total} emails delivered
            </span>
          </div>
          <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full progress-shimmer rounded-full transition-all duration-1000"
              style={{ width: `${percent(stats?.emailsSent || 0, total)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-dark-500">0%</span>
            <span className="text-xs font-semibold text-shield-400">
              {percent(stats?.emailsSent || 0, total)}% Complete
            </span>
            <span className="text-xs text-dark-500">100%</span>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Pie Chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <Mail size={16} className="text-shield-400" />
            Email Status Breakdown
          </h2>
          {chartData?.byStatus && chartData.byStatus.some(d => d.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData.byStatus.filter(d => d.value > 0)}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="label"
                  >
                    {chartData.byStatus.filter(d => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {chartData.byStatus.filter(d => d.value > 0).map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-dark-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.label} ({d.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-500 text-sm">
              No data yet — upload students to begin
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="glass-card p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-shield-400" />
            Email Delivery by Batch
          </h2>
          {chartData?.byBatch && chartData.byBatch.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData.byBatch} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={v => <span className="text-xs text-dark-400">{v}</span>}
                />
                <Bar name="Total" dataKey="total" fill="#334155" radius={[3,3,0,0]} />
                <Bar name="Sent" dataKey="sent" fill="#22c55e" radius={[3,3,0,0]} />
                <Bar name="Failed" dataKey="failed" fill="#ef4444" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-500 text-sm">
              No batch data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Batches + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Batches */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <Upload size={16} className="text-shield-400" />
            Recent Uploads
          </h2>
          {stats?.recentBatches && stats.recentBatches.length > 0 ? (
            <div className="space-y-2">
              {stats.recentBatches.map(batch => (
                <div key={batch.id} className="flex items-center justify-between px-3 py-2.5 bg-dark-800/50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm text-dark-200 font-medium truncate">{batch.fileName}</p>
                    <p className="text-xs text-dark-500 mt-0.5">{formatDate(batch.uploadedAt)}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-mono font-semibold text-shield-400">
                      {batch.validRecords}
                    </p>
                    <p className="text-xs text-dark-500">records</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-dark-500 text-sm">
              No uploads yet
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-shield-400" />
            Activity Timeline
          </h2>
          {stats?.activityTimeline && stats.activityTimeline.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {stats.activityTimeline.map(event => (
                <div key={event.id} className="flex items-start gap-3">
                  <ActivityIcon type={event.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-dark-300 leading-snug">{event.message}</p>
                    <p className="text-xs text-dark-600 mt-0.5">{timeAgo(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-dark-500 text-sm">
              No activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
