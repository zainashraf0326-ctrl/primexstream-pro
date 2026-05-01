'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  PackageOpen,
  Star,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, isLoggedIn, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-light dark:bg-gradient-dark">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light pb-28 dark:bg-gradient-dark">
      <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8 md:pt-16">
        <div className="mx-auto max-w-5xl animate-fade-in-up">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-white md:text-6xl">
            {`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 md:text-xl">
            Manage your IPTV subscription and start earning today
          </p>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            <Link href="/iptv" className="group">
              <Card className="h-full cursor-pointer transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl">
                <CardContent className="flex h-full flex-col p-8 md:p-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white transition-transform group-hover:scale-110">
                    <Zap className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                    Buy IPTV
                  </h3>
                  <p className="mb-6 flex-grow text-slate-600 dark:text-slate-400">
                    Choose a plan and get instant access to premium streaming
                  </p>
                  <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/orders" className="group">
              <Card className="h-full cursor-pointer transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl">
                <CardContent className="flex h-full flex-col p-8 md:p-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white transition-transform group-hover:scale-110">
                    <PackageOpen className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                    Track Orders
                  </h3>
                  <p className="mb-6 flex-grow text-slate-600 dark:text-slate-400">
                    View your subscriptions, credentials, and order status
                  </p>
                  <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
                    View Orders
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/earn" className="group">
              <Card className="h-full cursor-pointer transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl">
                <CardContent className="flex h-full flex-col p-8 md:p-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white transition-transform group-hover:scale-110">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                    Earn Money
                  </h3>
                  <p className="mb-6 flex-grow text-slate-600 dark:text-slate-400">
                    Refer friends and earn 20% commission on every purchase
                  </p>
                  <div className="flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-400">
                    Start Earning
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <Link href="/wallet" className="group">
            <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-8 md:p-10">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    WALLET
                  </span>
                </div>
                <p className="mb-1 text-slate-600 dark:text-slate-400">
                  Available Balance
                </p>
                <p className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                  $0.00
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 text-emerald-600 dark:text-emerald-400"
                >
                  Manage Wallet
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-emerald-900/10">
            <CardContent className="p-8 md:p-10">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <Star className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                  BEST VALUE
                </span>
              </div>
              <p className="mb-1 text-slate-600 dark:text-slate-400">
                Recommended Plan
              </p>
              <p className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                12 Months
              </p>
              <p className="mb-4 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                $90
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/iptv')}
                className="w-full"
              >
                Get Best Value
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          <div className="glass rounded-2xl p-6 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-blue-500 opacity-50" />
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Current Subscription
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">None</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <PackageOpen className="mx-auto mb-3 h-8 w-8 text-purple-500 opacity-50" />
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Total Orders
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <TrendingUp className="mx-auto mb-3 h-8 w-8 text-emerald-500 opacity-50" />
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Affiliate Earnings
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">$0.00</p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white/30 p-10 backdrop-blur dark:bg-slate-900/20 md:p-12">
          <h2 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">
            Why Choose Us?
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              'Instant Activation',
              '10K+ Channels',
              'Works Anywhere',
              'Earn and Referrals',
              'Fully Secure',
              '24/7 Support',
            ].map((feature) => (
              <p
                key={feature}
                className="font-medium text-slate-700 dark:text-slate-300"
              >
                {feature}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
