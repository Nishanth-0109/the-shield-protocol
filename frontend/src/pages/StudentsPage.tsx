import { useEffect, useState, useCallback } from 'react';
import {
  Search, Filter, RefreshCw, Users, QrCode,
  CheckCircle, AlertCircle, Clock, ChevronDown, Loader2,
} from 'lucide-react';
import { studentsApi } from '../api';
import { Student, EmailStatus, UploadBatch } from '../types';
import { cn, formatDate, statusColors, getStatusLabel } from '../utils';
import toast from 'react-hot-toast';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'pending', label: 'Pending' },
  { value: 'queued', label: 'Queued' },
  { value: 'sending', label: 'Sending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

function StatusBadge({ status }: { status: EmailStatus }) {
  const c = statusColors[status];
  return (
    <span className={cn('status-badge', c.bg, c.text, c.border)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      {getStatusLabel(status)}
    </span>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentsApi.getAll({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        batchId: batchFilter || undefined,
      });
      if (res.data.success) {
        setStudents(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, batchFilter]);

  useEffect(() => {
    studentsApi.getBatches().then(res => {
      if (res.data.success) setBatches(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    const delay = setTimeout(fetchStudents, 300);
    return () => clearTimeout(delay);
  }, [fetchStudents]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Students</h1>
          <p className="section-subtitle">{total} total students across all batches</p>
        </div>
        <button onClick={fetchStudents} className="btn-ghost text-sm" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, name, or email..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field py-2 pr-8 text-sm appearance-none min-w-36"
          >
            {STATUS_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
        </div>

        {/* Batch filter */}
        {batches.length > 0 && (
          <div className="relative">
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="input-field py-2 pr-8 text-sm appearance-none min-w-40"
            >
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.fileName}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-dark-500">
          <Filter size={13} />
          {students.length} result{students.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading && students.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="text-shield-400 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Users size={32} className="text-dark-600" />
            <p className="text-dark-500 text-sm">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>QR</th>
                  <th>Email Status</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr key={student.id}>
                    <td className="text-dark-600 text-xs font-mono w-10">{i + 1}</td>
                    <td>
                      <span className="font-mono text-shield-400 text-xs font-semibold">
                        {student.studentId}
                      </span>
                    </td>
                    <td className="font-medium">{student.name}</td>
                    <td className="text-dark-400 text-xs">{student.email}</td>
                    <td className="text-dark-400 text-xs">{student.department || '-'}</td>
                    <td>
                      {student.qrGenerated ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle size={13} />
                          Generated
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-dark-500 text-xs">
                          <Clock size={13} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={student.emailStatus} />
                    </td>
                    <td className="text-dark-500 text-xs">
                      {student.emailSentAt ? formatDate(student.emailSentAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 text-xs text-dark-500">
        {[
          { icon: Users, label: 'Total', value: total },
          { icon: QrCode, label: 'QR Ready', value: students.filter(s => s.qrGenerated).length },
          { icon: CheckCircle, label: 'Sent', value: students.filter(s => s.emailStatus === 'sent').length },
          { icon: AlertCircle, label: 'Failed', value: students.filter(s => s.emailStatus === 'failed').length },
          { icon: Clock, label: 'Pending', value: students.filter(s => s.emailStatus === 'pending').length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon size={13} className="text-shield-500" />
            <span>{label}:</span>
            <span className="text-dark-300 font-semibold font-mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
