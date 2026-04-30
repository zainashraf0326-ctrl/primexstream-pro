'use client';

import { ReactNode, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TaskRowProps {
  title: string;
  description: string;
  icon: ReactNode;
  status?: 'available' | 'pending' | 'approved' | 'completed';
  reward?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

const statusColors = {
  available: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
};

const statusLabels = {
  available: 'Available',
  pending: 'Pending Review',
  approved: 'Approved',
  completed: 'Completed',
};

export function TaskRow({
  title,
  description,
  icon,
  status = 'available',
  reward,
  children,
  defaultExpanded = false,
}: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="glass glass-light dark:glass overflow-hidden">
      {/* Task Header Row - Always Visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left transition-all hover:bg-white/50 dark:hover:bg-slate-900/50"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Title + Description */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-white">
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">
                {description}
              </p>
            </div>
          </div>

          {/* Right: Status + Reward + Chevron */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Status Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]} whitespace-nowrap`}>
              {statusLabels[status]}
            </div>

            {/* Reward */}
            {reward && (
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                +{reward}
              </div>
            )}

            {/* Chevron */}
            <div className="text-slate-400 dark:text-slate-600">
              {isExpanded ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Task Details - Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-6 bg-slate-50/50 dark:bg-slate-900/50">
          {children}
        </div>
      )}
    </Card>
  );
}
