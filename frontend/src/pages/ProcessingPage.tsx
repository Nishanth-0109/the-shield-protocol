import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode, Mail, RefreshCw, AlertCircle, CheckCircle,
  Play, Clock, Zap, ChevronDown, FileText
} from 'lucide-react';
import { processingApi, studentsApi } from '../api';
import { ProcessingJob, UploadBatch } from '../types';
import toast from 'react-hot-toast';

export const ProcessingPage: React.FC = () => {
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<ProcessingJob | null>(null);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [, setLoading] = useState(true);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Load batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await studentsApi.getBatches();
        if (res.data.success && res.data.data) {
          const list = res.data.data || [];
          setBatches(list);
          if (list.length > 0) setSelectedBatch(list[0].id);
        }
      } catch {
        toast.error('Failed to load batches');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Fetch jobs for selected batch
  useEffect(() => {
    if (!selectedBatch) return;
    const fetchJobs = async () => {
      try {
        const res = await processingApi.getJobsByBatch(selectedBatch);
        if (res.data.success && res.data.data) {
          const list = res.data.data || [];
          setJobs(list);
          const running = list.find(j => j.status === 'running');
          if (running) setActiveJobId(running.id);
        }
      } catch {
        // silent
      }
    };
    fetchJobs();
  }, [selectedBatch]);

  // Subscribe to active job stream / polling fallback
  useEffect(() => {
    if (!activeJobId) {
      setActiveJob(null);
      return;
    }

    let intervalId: any = null;

    // Polling fallback
    const poll = async () => {
      try {
        const res = await processingApi.getJob(activeJobId);
        if (res.data.success && res.data.data) {
          const job = res.data.data;
          setActiveJob(job);
          if (job.status !== 'running') {
            setActiveJobId(null);
            toast.success(`Job ${job.type === 'qr_generation' ? 'QR Generation' : 'Email Sending'} completed!`);
            // Refresh batch jobs
            if (selectedBatch) {
              const jobsRes = await processingApi.getJobsByBatch(selectedBatch);
              if (jobsRes.data.success && jobsRes.data.data) setJobs(jobsRes.data.data || []);
            }
          }
        }
      } catch {
        // silent
      }
    };

    poll();
    intervalId = setInterval(poll, 1500);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [activeJobId, selectedBatch]);

  const startQrGeneration = async () => {
    if (!selectedBatch) { toast.error('Select a batch first'); return; }
    try {
      const res = await processingApi.generateQr(selectedBatch);
      if (res.data.success && res.data.data) {
        const jobId = res.data.data.jobId;
        setActiveJobId(jobId);
        toast.success('QR generation started!');
        setJobs(prev => [{
          id: jobId, batchId: selectedBatch,
          type: 'qr_generation', status: 'running',
          total: 0, processed: 0, successful: 0, failed: 0,
          startedAt: new Date().toISOString(),
        }, ...prev]);
      }
    } catch {
      toast.error('Failed to start QR generation');
    }
  };

  const startEmailSending = async (retryFailed = false, forceResend = false) => {
    if (!selectedBatch) { toast.error('Select a batch first'); return; }
    try {
      const res = await processingApi.sendEmails(selectedBatch, retryFailed, forceResend);
      if (res.data.success && res.data.data) {
        const jobId = res.data.data.jobId;
        setActiveJobId(jobId);
        toast.success(forceResend ? 'Resend job started!' : retryFailed ? 'Retry job started!' : 'Email sending started!');
        setJobs(prev => [{
          id: jobId, batchId: selectedBatch,
          type: 'email_sending', status: 'running',
          total: 0, processed: 0, successful: 0, failed: 0,
          startedAt: new Date().toISOString(),
        }, ...prev]);
      }
    } catch {
      toast.error('Failed to start email sending');
    }
  };

  const retryAllFailed = async () => {
    try {
      const res = await processingApi.retryFailed();
      if (res.data.success && res.data.data) {
        setActiveJobId(res.data.data.jobId);
        toast.success('Retry job started for all failed emails');
      }
    } catch {
      toast.error('Failed to start retry job');
    }
  };

  const selectedBatchData = batches.find(b => b.id === selectedBatch);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Zap className="text-brand-400" size={24} /> Processing Hub
        </h1>
        <p className="text-dark-400 text-sm mt-1">
          Generate QR codes and send automated welcome emails to students.
        </p>
      </div>

      {/* Batch Selector */}
      <div className="glass-card p-6">
        <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
          Select Target Batch
        </label>
        <div className="relative max-w-md">
          <select
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            className="input-field pr-9 text-sm"
            disabled={!!activeJobId}
          >
            <option value="">-- Select a batch --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.fileName} ({b.validRecords} records)
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
        </div>

        {selectedBatchData && (
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-dark-400">
            <span>Total: <strong className="text-dark-200">{selectedBatchData.totalRecords}</strong></span>
            <span>Valid: <strong className="text-green-400">{selectedBatchData.validRecords}</strong></span>
            <span>Duplicates: <strong className="text-amber-400">{selectedBatchData.duplicateRecords}</strong></span>
            <span>Invalid: <strong className="text-red-400">{selectedBatchData.invalidRecords}</strong></span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Generate QR */}
        <button
          onClick={startQrGeneration}
          disabled={!selectedBatch || !!activeJobId}
          className="glass-card p-5 text-left hover:border-violet-500/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center mb-3 group-hover:shadow-glow-sm transition-all">
            <QrCode size={20} className="text-violet-400" />
          </div>
          <p className="text-sm font-bold text-dark-100">Generate QR Codes</p>
          <p className="text-xs text-dark-500 mt-1">Create QR for each student in the selected batch</p>
          <div className="flex items-center gap-1 mt-3 text-xs text-violet-400 font-medium">
            <Play size={12} />
            Start Generation
          </div>
        </button>

        {/* Send Emails */}
        <div className="glass-card p-5 text-left transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-green-600/20 border border-green-600/30 flex items-center justify-center mb-3">
              <Mail size={20} className="text-green-400" />
            </div>
            <p className="text-sm font-bold text-dark-100">Send Emails</p>
            <p className="text-xs text-dark-500 mt-1">Send personalized QR emails to students in batch</p>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => startEmailSending(false, false)}
              disabled={!selectedBatch || !!activeJobId}
              className="flex items-center justify-center gap-1 text-xs text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg py-2 px-3 font-semibold transition-all disabled:opacity-50"
            >
              <Play size={12} /> Send Emails
            </button>
            <button
              onClick={() => startEmailSending(false, true)}
              disabled={!selectedBatch || !!activeJobId}
              className="flex items-center justify-center gap-1 text-[11px] text-dark-400 hover:text-dark-200 bg-dark-800/40 hover:bg-dark-700/50 border border-dark-700 rounded-lg py-1.5 px-3 transition-all disabled:opacity-50"
            >
              <RefreshCw size={11} /> Force Resend All Emails
            </button>
          </div>
        </div>

        {/* Retry Failed */}
        <button
          onClick={retryAllFailed}
          disabled={!!activeJobId}
          className="glass-card p-5 text-left hover:border-amber-500/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/30 flex items-center justify-center mb-3 group-hover:shadow-glow-sm transition-all">
            <RefreshCw size={20} className="text-amber-400" />
          </div>
          <p className="text-sm font-bold text-dark-100">Retry Failed Emails</p>
          <p className="text-xs text-dark-500 mt-1">Resend only to students where email failed</p>
          <div className="flex items-center gap-1 mt-3 text-xs text-amber-400 font-medium">
            <Play size={12} />
            Retry All Failed
          </div>
        </button>
      </div>

      {/* Active Job Progress Card */}
      {activeJob && (
        <div className="glass-card p-6 border-brand-500/30 bg-brand-950/20 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-brand-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-white text-base capitalize">
                  {activeJob.type === 'qr_generation' ? 'QR Code Generation' : 'Sending Emails'} in Progress...
                </h3>
                <p className="text-xs text-dark-400">
                  {activeJob.processed} of {activeJob.total} processed
                </p>
              </div>
            </div>
            {(activeJob.estimatedRemaining ?? 0) > 0 && (
              <span className="text-xs font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Clock size={12} /> ~{activeJob.estimatedRemaining}s remaining
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-dark-800 h-3 rounded-full overflow-hidden p-0.5 border border-dark-700">
            <div
              className="bg-gradient-to-r from-brand-500 to-blue-500 h-full rounded-full transition-all duration-300 shadow-glow-sm"
              style={{
                width: `${activeJob.total > 0 ? Math.round((activeJob.processed / activeJob.total) * 100) : 0}%`,
              }}
            />
          </div>

          <div className="flex justify-between items-center mt-3 text-xs text-dark-400">
            <span className="text-green-400 font-medium">✓ {activeJob.successful} successful</span>
            {activeJob.failed > 0 && <span className="text-red-400 font-medium">✗ {activeJob.failed} failed</span>}
            <span className="font-bold text-dark-200">
              {activeJob.total > 0 ? Math.round((activeJob.processed / activeJob.total) * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Recent Job History */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-dark-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={16} className="text-brand-400" /> Recent Processing History
        </h3>

        {jobs.length === 0 ? (
          <p className="text-xs text-dark-500 italic text-center py-6">No jobs recorded for this batch yet.</p>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 10).map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-900/50 border border-dark-800 text-xs">
                <div className="flex items-center gap-3">
                  {job.status === 'completed' ? (
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                  ) : job.status === 'running' ? (
                    <Clock size={16} className="text-brand-400 animate-spin shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-dark-200 capitalize">
                      {job.type === 'qr_generation' ? 'QR Code Generation' : 'Email Batch Sending'}
                    </span>
                    <span className="text-dark-500 ml-2">
                      ({job.successful}/{job.total} success)
                    </span>
                  </div>
                </div>
                <div className="text-right text-dark-400">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    job.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    job.status === 'running' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {job.status}
                  </span>
                  <p className="text-[10px] text-dark-500 mt-1">
                    {new Date(job.startedAt || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingPage;
