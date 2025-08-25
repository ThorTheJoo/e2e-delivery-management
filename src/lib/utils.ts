import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function calculateEffortTotal(effort: any): number {
  if (!effort) return 0;
  return Object.values(effort).reduce((sum: number, value: any) => {
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

export function getStatusColor(status: string): string {
  const statusColors: { [key: string]: string } = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'On Hold': 'bg-yellow-100 text-yellow-800',
    'Delayed': 'bg-red-100 text-red-800',
    'Planned': 'bg-purple-100 text-purple-800',
    'Draft': 'bg-gray-100 text-gray-800',
    'In Review': 'bg-orange-100 text-orange-800',
    'Approved': 'bg-green-100 text-green-800',
    'Published': 'bg-blue-100 text-blue-800',
    'Open': 'bg-red-100 text-red-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Closed': 'bg-gray-100 text-gray-800',
    'Identified': 'bg-red-100 text-red-800',
    'Mitigated': 'bg-yellow-100 text-yellow-800',
    'Escalated': 'bg-orange-100 text-orange-800'
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

export function getSeverityColor(severity: string): string {
  const severityColors: { [key: string]: string } = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800'
  };
  
  return severityColors[severity] || 'bg-gray-100 text-gray-800';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}
