'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  isExpanded?: boolean;
  onToggle?: () => void;
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
  isExpanded,
  onToggle,
}: TaskRowProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const expanded = isExpanded ?? internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
      return;
    }

    setInternalExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (!expanded || !cardRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [expanded]);

  return (
    <motion.div
      ref={cardRef}
      layout
      transition={{ layout: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } }}
      className="scroll-mt-24"
    >
      <Card
        className={`glass glass-light dark:glass overflow-hidden transition-all duration-300 ${
          expanded
            ? 'ring-1 ring-emerald-300/80 shadow-[0_24px_60px_-28px_rgba(16,185,129,0.35)] dark:ring-emerald-700/60'
            : 'shadow-sm'
        }`}
      >
        {/* Task Header Row - Always Visible */}
        <button
          type="button"
          onClick={handleToggle}
          className={`w-full px-6 py-4 text-left transition-all duration-300 ${
            expanded
              ? 'bg-white/75 dark:bg-slate-900/65'
              : 'hover:bg-white/50 dark:hover:bg-slate-900/50'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Icon + Title + Description */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <motion.div
                animate={expanded ? { scale: 1.04, y: -1 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-white"
              >
                {icon}
              </motion.div>

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
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]} whitespace-nowrap`}>
                {statusLabels[status]}
              </div>

              {reward && (
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  +{reward}
                </div>
              )}

              <motion.div
                animate={expanded ? { rotate: 180 } : { rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="text-slate-400 dark:text-slate-600"
              >
                {expanded ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </motion.div>
            </div>
          </div>
        </button>

        <AnimatePresence initial={false} mode="wait">
          {expanded && (
            <motion.div
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ y: -18, opacity: 0.6, filter: 'blur(6px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: -12, opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="border-t border-slate-200 bg-slate-50/60 px-6 py-6 dark:border-slate-700 dark:bg-slate-900/50"
              >
                {children}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
