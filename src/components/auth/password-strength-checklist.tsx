'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { getPasswordStrength, PASSWORD_REQUIREMENTS } from '@/lib/password-strength';

const strengthClasses = {
  Weak: 'text-red-600 dark:text-red-400',
  Fair: 'text-orange-600 dark:text-orange-400',
  Good: 'text-amber-600 dark:text-amber-400',
  Strong: 'text-emerald-600 dark:text-emerald-400',
  'Very Strong': 'text-emerald-700 dark:text-emerald-300',
} as const;

interface PasswordStrengthChecklistProps {
  password: string;
}

export function PasswordStrengthChecklist({
  password,
}: PasswordStrengthChecklistProps) {
  const strength = getPasswordStrength(password);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Password Strength
        </p>
        <p className={`text-sm font-semibold ${strengthClasses[strength.label]}`}>
          {strength.label}
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {PASSWORD_REQUIREMENTS.map((requirement) => {
          const passed = strength.checks[requirement.key];

          return (
            <div
              key={requirement.key}
              className={`flex items-center gap-2 text-sm ${
                passed
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{requirement.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
