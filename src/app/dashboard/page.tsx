'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, PackageOpen, TrendingUp, Wallet, Star, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, isLoggedIn, isLoading } = useApp();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark pb-28">
      {/* Hero Welcome */}
      <section className="pt-8 md:pt-16 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-2">
            {isLoggedIn && user ? `Welcome back, ${user.name?.split(' ')[0]} 👋` : 'Welcome to PrimexStream Pro 👋'}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
            {isLoggedIn ? 'Manage your IPTV subscription and start earning today' : 'Get premium IPTV access instantly'}
          </p>
        </div>
      </section>

      {/* Main Actions - 3 CTAs */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Action 1: Buy IPTV */}
            <Link href="/iptv" className="group">
              <Card className="h-full cursor-pointer hover:shadow-2xl transition-all duration-300 hover:border-emerald-500/50">
                <CardContent className="p-8 md:p-10 flex flex-col h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    Buy IPTV
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 flex-grow">
                    Choose a plan and get instant access to premium streaming
                  </p>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Action 2: Track Orders */}
            <Link href="/orders" className="group">
              <Card className="h-full cursor-pointer hover:shadow-2xl transition-all duration-300 hover:border-emerald-500/50">
                <CardContent className="p-8 md:p-10 flex flex-col h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <PackageOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    Track Orders
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 flex-grow">
                    View your subscriptions, credentials, and order status
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                    View Orders
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Action 3: Earn Money */}
            <Link href="/earn" className="group">
              <Card className="h-full cursor-pointer hover:shadow-2xl transition-all duration-300 hover:border-emerald-500/50">
                <CardContent className="p-8 md:p-10 flex flex-col h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    Earn Money
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 flex-grow">
                    Refer friends and earn 20% commission on every purchase
                  </p>
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                    Start Earning
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Wallet Preview */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Wallet Balance */}
          <Link href="/wallet" className="group">
            <Card className="h-full cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">WALLET</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-4">$0.00</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 dark:text-emerald-400 p-0"
                >
                  Manage Wallet →
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Recommended Plan */}
          <Card className="h-full bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/50">
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-bold bg-emerald-500 text-white px-3 py-1 rounded-full">BEST VALUE</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Recommended Plan</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">12 Months</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">$90</p>
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

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 text-center">
            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-3 opacity-50" />
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Current Subscription</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">None</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <PackageOpen className="w-8 h-8 text-purple-500 mx-auto mb-3 opacity-50" />
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-50" />
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Affiliate Earnings</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">$0.00</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-white/30 dark:bg-slate-900/20 rounded-3xl p-10 md:p-12 backdrop-blur">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Why Choose Us?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              '✨ Instant Activation',
              '📺 10K+ Channels',
              '🌍 Works Anywhere',
              '💰 Earn & Referrals',
              '🔒 Fully Secure',
              '⚡ 24/7 Support',
            ].map((feature, i) => (
              <p key={i} className="text-slate-700 dark:text-slate-300 font-medium">
                {feature}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
