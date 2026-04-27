import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function getStatusColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === 'booked' || s === 'scheduled') return 'text-blue-400 bg-blue-400/10';
  if (s === 'completed' || s === 'confirmed') return 'text-green-400 bg-green-400/10';
  if (s === 'cancelled' || s === 'canceled') return 'text-red-400 bg-red-400/10';
  if (s === 'rescheduled') return 'text-yellow-400 bg-yellow-400/10';
  return 'text-gray-400 bg-gray-400/10';
}

export function getStatusStyle(status: string): { background: string; color: string } {
  const s = (status || '').toLowerCase();
  if (s === 'booked' || s === 'scheduled')    return { color: '#4f8ef7', background: 'rgba(79,142,247,0.13)' };
  if (s === 'completed' || s === 'confirmed') return { color: '#4ade80', background: 'rgba(74,222,128,0.13)' };
  if (s === 'cancelled' || s === 'canceled')  return { color: '#f87171', background: 'rgba(248,113,113,0.13)' };
  if (s === 'rescheduled')                    return { color: '#fbbf24', background: 'rgba(251,191,36,0.13)' };
  return { color: '#6b7280', background: 'rgba(107,114,128,0.12)' };
}

export function getCallStatusStyle(status: string): { background: string; color: string } {
  const s = (status || '').toLowerCase();
  if (s === 'ended' || s === 'completed')
    return { background: 'rgba(74,222,128,0.12)', color: 'var(--success)' };
  if (s === 'failed' || s === 'error' || s === 'busy' || s === 'no-answer' || s === 'cancelled')
    return { background: 'rgba(248,113,113,0.12)', color: 'var(--danger)' };
  if (s === 'in-progress' || s === 'initiated' || s === 'queued')
    return { background: 'rgba(79,142,247,0.12)', color: 'var(--accent)' };
  return { background: 'var(--surface-2)', color: 'var(--muted)' };
}
