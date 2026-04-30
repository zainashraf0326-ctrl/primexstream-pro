'use client';

import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = true, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`glass rounded-2xl p-4 shadow-sm md:p-6 ${hover ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-500/30' : ''} border border-white/10 dark:border-slate-700/20 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-8 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-base lg:text-lg text-slate-600 dark:text-slate-400 mt-3 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mt-10 pt-10 border-t border-white/10 dark:border-slate-700/20 ${className}`}>{children}</div>;
}
