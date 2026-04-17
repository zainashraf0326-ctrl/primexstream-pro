'use client';

import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DiscountModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export default function DiscountModal({ isOpen, onContinue }: DiscountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),rgba(251,191,36,0)_60%)]" />
      <Card className="relative w-full max-w-lg border-white/70 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/85 shadow-[0_18px_70px_rgba(249,115,22,0.22)] backdrop-blur-xl">
        <CardContent className="space-y-5 pt-8 pb-6">
          <div className="flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 shadow-md">
              <Gift className="h-7 w-7 text-amber-600 dark:text-amber-300" />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Special Offer: +30% OFF</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Use Binance or Remitly to unlock an extra 30% discount on your plan.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50/80 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
            This offer appears before payment selection to make sure you do not miss the lowest price.
          </div>

          <Button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
          >
            Got It! Show Payment Methods
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
