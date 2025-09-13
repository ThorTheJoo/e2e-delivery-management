import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'in progress':
    case 'active':
    case 'running':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
    case 'waiting':
    case 'queued':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
    case 'error':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'draft':
    case 'new':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'medium':
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
    case 'minor':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
