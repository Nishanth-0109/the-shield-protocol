import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  X, ArrowRight, Info, Loader2, FileX, Users,
} from 'lucide-react';
import { uploadApi } from '../api';
import { ParsedStudentRow, UploadPreview } from '../types';
import { cn } from '../utils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// =============================================
// Validation row table
// =============================================
function ValidationTable({
  rows, title, type,
}: {
  rows: ParsedStudentRow[]; title: string; type: 'valid' | 'invalid' | 'duplicate';
}) {
  const colors = {
    valid: 'text-green-400 bg-green-500/10 border-green-500/20',
    invalid: 'text-red-400 bg-red-500/10 border-red-500/20',
    duplicate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  if (rows.length === 0) return null;

  return (
    <div className={`rounded-xl border p-4 ${colors[type]}`}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        {type === 'valid' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
        {title} ({rows.length})
      </h3>
      <div className="overflow-x-auto rounded-lg border border-dark-700/40">
        <table className="data-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Dept</th>
              {type !== 'valid' && <th>Issue</th>}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row, i) => (
              <tr key={i}>
                <td className="text-dark-500 text-xs font-mono">{row.rowIndex}</td>
                <td className="font-mono text-xs">{row.studentId || '-'}</td>
                <td>{row.name || '-'}</td>
                <td className="text-xs">{row.email || '-'}</td>
                <td className="text-xs">{row.department || '-'}</td>
                {type !== 'valid' && (
                  <td className="text-red-400 text-xs">{row.errors.join('; ')}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 10 && (
          <p className="text-xs text-dark-500 px-4 py-2">
            ... and {rows.length - 10} more rows
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================
// Upload Page
// =============================================
export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;

    setFile(f);
    setUploading(true);
    setPreview(null);

    try {
      const res = await uploadApi.upload(f);
      if (res.data.success && res.data.data) {
        setPreview(res.data.data);
        toast.success(`File parsed: ${res.data.data.valid.length} valid records found`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (fileRejections) => {
      const err = fileRejections[0]?.errors[0]?.message || 'File not accepted. Please upload a CSV, XLS, or XLSX file.';
      toast.error(err);
    },
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.csv'],
      'application/csv': ['.csv'],
      'text/x-csv': ['.csv'],
      'application/x-csv': ['.csv'],
      'text/comma-separated-values': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/octet-stream': ['.csv', '.xls', '.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  const handleConfirm = async () => {
    if (!preview) return;
    setConfirming(true);
    try {
      const res = await uploadApi.confirm(
        preview.filePath,
        preview.fileName,
        preview.valid,
        preview.totalRows,
        preview.invalid?.length || 0,
        preview.duplicates?.length || 0
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Import successful!');
        navigate('/processing');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Import failed';
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setFile(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="section-title">Upload Students</h1>
        <p className="section-subtitle">Import confirmed students from your CSV or Excel export</p>
      </div>

      {/* Format guide */}
      <div className="glass-card p-4 flex items-start gap-3">
        <Info size={16} className="text-shield-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-dark-200 mb-1">Expected File Format</p>
          <p className="text-xs text-dark-400">
            Columns (in any order):{' '}
            <span className="font-mono text-shield-400">Student ID</span>,{' '}
            <span className="font-mono text-shield-400">Student Name</span>,{' '}
            <span className="font-mono text-shield-400">Email</span>,{' '}
            <span className="font-mono text-shield-400">Mobile</span>,{' '}
            <span className="font-mono text-shield-400">Dept/Branch</span>
          </p>
          <p className="text-xs text-dark-500 mt-1">
            Student ID format: <span className="font-mono">SP26-0001</span> &nbsp;|&nbsp;
            Supported: CSV, XLSX, XLS &nbsp;|&nbsp; Max size: 10 MB
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      {!preview && (
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
            isDragActive
              ? 'border-shield-400 bg-shield-500/10 scale-[1.01]'
              : 'border-dark-600 hover:border-shield-600 hover:bg-shield-600/5',
            uploading && 'opacity-60 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-all',
              isDragActive ? 'bg-shield-500/20 border border-shield-500/40' : 'bg-dark-800 border border-dark-700'
            )}>
              {uploading ? (
                <Loader2 size={28} className="text-shield-400 animate-spin" />
              ) : (
                <FileSpreadsheet size={28} className={isDragActive ? 'text-shield-400' : 'text-dark-400'} />
              )}
            </div>
            {uploading ? (
              <div>
                <p className="text-base font-semibold text-dark-200">Parsing file...</p>
                <p className="text-sm text-dark-500 mt-1">Validating all records</p>
              </div>
            ) : isDragActive ? (
              <div>
                <p className="text-base font-semibold text-shield-300">Drop it here!</p>
                <p className="text-sm text-dark-400 mt-1">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-dark-200">
                  Drag & drop your file here
                </p>
                <p className="text-sm text-dark-500 mt-1">or click to browse</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {['.CSV', '.XLSX', '.XLS'].map(ext => (
                    <span key={ext} className="px-2 py-1 bg-dark-800 border border-dark-700 rounded text-xs font-mono text-dark-400">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Results */}
      {preview && (
        <div className="space-y-5">
          {/* File info + controls */}
          <div className="glass-card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-shield-600/20 border border-shield-600/30 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet size={20} className="text-shield-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-dark-100 truncate">{preview.fileName}</p>
                <p className="text-xs text-dark-500 mt-0.5">
                  {preview.totalRows} total rows parsed
                </p>
              </div>
            </div>
            <button onClick={handleReset} className="btn-ghost text-sm flex-shrink-0">
              <X size={15} /> Change file
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Rows', value: preview.totalRows, color: 'text-dark-300', icon: FileSpreadsheet },
              { label: 'Valid Records', value: preview.valid.length, color: 'text-green-400', icon: CheckCircle },
              { label: 'Invalid', value: preview.invalid.length, color: 'text-red-400', icon: FileX },
              { label: 'Duplicates', value: preview.duplicates.length, color: 'text-amber-400', icon: AlertCircle },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="glass-card p-4 text-center">
                <Icon size={18} className={`${color} mx-auto mb-2`} />
                <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                <p className="text-xs text-dark-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Data tables */}
          <ValidationTable rows={preview.valid} title="Valid Records (will be imported)" type="valid" />
          <ValidationTable rows={preview.invalid} title="Invalid Records (will be skipped)" type="invalid" />
          <ValidationTable rows={preview.duplicates} title="Duplicate Records (will be skipped)" type="duplicate" />

          {/* Confirm / Cancel */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={handleReset} className="btn-secondary">
              <X size={15} /> Cancel
            </button>
            {preview.valid.length > 0 ? (
              <button onClick={handleConfirm} disabled={confirming} className="btn-primary">
                {confirming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Users size={16} />
                )}
                Import {preview.valid.length} Students
                <ArrowRight size={15} />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                No valid records to import
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
