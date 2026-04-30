'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { motion } from 'framer-motion';
import { Zap, Shield, Users, ArrowRight, Sparkles, Layers, Rocket } from 'lucide-react';
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 },
  },
};

export default function LandingPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (isLoggedIn) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Hero Section */}
      <section className="pt-20 md:pt-28 pb-16 md:pb-28 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 shadow-sm"
            variants={itemVariants}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              ✨ Join 50K+ satisfied customers
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-slate-900 dark:text-slate-100"
            variants={itemVariants}
          >
            Premium IPTV{' '}
            <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Made Simple
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
            variants={itemVariants}
          >
            Buy premium IPTV in 3 steps with instant activation and clear pricing. Refer friends and earn rewards without extra complexity.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => router.push('/login')}
              className="btn-glass btn-glass-primary rounded-xl px-8 py-4 flex items-center justify-center gap-2 shadow-sm"
              whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)' }}
              whileTap={{ scale: 0.95 }}
            >
              Start Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-glass btn-glass-secondary rounded-xl px-8 py-4 shadow-sm"
              whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.95)' }}
              whileTap={{ scale: 0.95 }}
            >
              How It Works
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Shield className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <span>256-bit Secure</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <span>50K+ Active Users</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Rocket className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <span>Lightning Fast</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          className="mt-16 md:mt-24 max-w-4xl mx-auto"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="glass rounded-3xl p-2 md:p-4">
            <div className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 rounded-2xl aspect-video flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-20 h-20 text-slate-500/60 mx-auto mb-4 animate-pulse-glow" />
                <p className="text-slate-600 dark:text-slate-400">Premium IPTV Dashboard Preview</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4"
              variants={itemVariants}
            >
              Why Choose Us?
            </motion.h2>
            <motion.p
              className="text-lg text-slate-600 dark:text-slate-400"
              variants={itemVariants}
            >
              Industry-leading features designed for you
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Zap,
                title: 'Instant Activation',
                description: 'Get access within minutes, not hours',
              },
              {
                icon: Layers,
                title: '10K+ Channels',
                description: 'Movies, series, sports, and more',
              },
              {
                icon: Rocket,
                title: 'Earn Money',
                description: 'Refer friends and earn 20% commission',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                className="glass rounded-2xl p-8 cursor-pointer"
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(255,255,255,0.96)',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className="w-10 h-10 text-slate-700 dark:text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/40 dark:bg-slate-900/40 relative z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4"
              variants={itemVariants}
            >
              3 Simple Steps
            </motion.h2>
            <motion.p
              className="text-lg text-slate-600 dark:text-slate-400"
              variants={itemVariants}
            >
              Get premium IPTV access in just 3 minutes
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                number: '1',
                title: 'Choose Your Plan',
                description: 'Select from 1-month, 6-month, or 12-month plans',
              },
              {
                number: '2',
                title: 'Make Payment',
                description: 'Pay securely via Remitly, Binance, or PayPal',
              },
              {
                number: '3',
                title: 'Get Access',
                description: 'Instant access across all devices',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="glass rounded-2xl p-8"
                variants={itemVariants}
                whileHover={{ translateY: -8 }}
              >
                <div className="w-14 h-14 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold text-2xl mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto glass rounded-3xl px-8 md:px-12 py-12 md:py-16 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join thousands of satisfied customers and get premium IPTV today.
          </p>
          <motion.button
            onClick={() => router.push('/login')}
            className="btn-glass btn-glass-primary rounded-xl px-8 py-4 flex items-center justify-center gap-2 mx-auto shadow-sm"
            whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)' }}
            whileTap={{ scale: 0.95 }}
          >
            Create Account Now
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-500 transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-blue-500 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-500 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-blue-500 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-500 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-blue-500 transition-colors">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-500 transition-colors">Support</Link></li>
                <li><Link href="#" className="hover:text-blue-500 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 dark:border-white/5 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; 2026 PrimexStream Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}