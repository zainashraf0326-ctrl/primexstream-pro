'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

type PaymentMethod = 'remitly' | 'binance' | 'paypal' | 'cashapp' | 'zelle';

interface AccountDetail {
  name: string;
  value: string;
}

interface AccountDetailsProps {
  method: PaymentMethod;
  instructions: string;
  accountInfo: AccountDetail[];
}

export default function AccountDetails({ method, instructions, accountInfo }: AccountDetailsProps) {
  const [copied, setCopied] = useState(false);
  const instructionItems = useMemo(
    () =>
      instructions
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/binces/gi, 'Binance')),
    [instructions]
  );

  const handleCopyBinanceId = async () => {
    await navigator.clipboard.writeText('222222');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      <Card className="glass border-blue-200/50 dark:border-blue-700/30">
        <CardTitle className="mb-2">Payment Instructions</CardTitle>
        <CardContent>
          <ul className="space-y-2">
            {instructionItems.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="glass border-green-200/50 dark:border-green-700/30">
        <CardTitle className="mb-2">Account Information</CardTitle>
        <CardContent className="space-y-3">
          {accountInfo.map((info, idx) => (
            <div key={`${info.name}-${idx}`} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{info.name}</p>
              <p className="text-sm font-mono font-bold text-slate-900 dark:text-white break-all">{info.value}</p>
            </div>
          ))}

          {method === 'binance' && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Binance Pay ID</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">222222</span>
                <Button type="button" variant="outline" size="sm" onClick={handleCopyBinanceId} className="gap-1">
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
