import { clsx, type ClassValue } from 'clsx';
import { EmailStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatSeconds(seconds: number): string {
  if (seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export const statusColors: Record<EmailStatus, { bg: string; text: string; dot: string; border: string }> = {
  pending: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400', border: 'border-blue-500/30' },
  queued:  { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', border: 'border-amber-500/30' },
  sending: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400', border: 'border-purple-500/30' },
  sent:    { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', border: 'border-green-500/30' },
  failed:  { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/30' },
};

export function getStatusLabel(status: EmailStatus): string {
  const labels: Record<EmailStatus, string> = {
    pending: 'Pending', queued: 'Queued',
    sending: 'Sending', sent: 'Sent', failed: 'Failed',
  };
  return labels[status] || status;
}

export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}
