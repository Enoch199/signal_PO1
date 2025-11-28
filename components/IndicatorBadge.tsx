import React from 'react';
import { clsx } from 'clsx';

interface IndicatorBadgeProps {
  label: string;
  value: string | number;
  status?: 'success' | 'danger' | 'warning' | 'neutral' | 'info';
}

const IndicatorBadge: React.FC<IndicatorBadgeProps> = ({ label, value, status = 'neutral' }) => {
  const colorClass = {
    success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    danger: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    info: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    neutral: 'text-gray-400 bg-gray-800 border-gray-700',
  }[status];

  return (
    <div className={clsx("flex flex-col items-center justify-center p-2 rounded-lg border", colorClass)}>
      <span className="text-xs uppercase tracking-wider opacity-70 mb-1">{label}</span>
      <span className="text-lg font-bold font-mono">{value}</span>
    </div>
  );
};

export default IndicatorBadge;