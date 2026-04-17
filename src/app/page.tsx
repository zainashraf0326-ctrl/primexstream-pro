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
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden pb-24">
      {/* Hero Section */}
      <section className="pt-20 md:pt-32 pb-20 md:pb-40 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8"
            variants={itemVariants}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              ✨ Join 50K+ satisfied customers
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 text-gray-900 dark:text-white"
            variants={itemVariants}
          >
            Premium IPTV{' '}
            <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Made Simple
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
            variants={itemVariants}
          >
            Buy premium IPTV in 3 steps, get instant access, and earn money by referring friends. No hidden charges. No complications.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => router.push('/login')}
              className="btn-glass btn-glass-primary rounded-xl px-8 py-4 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Start Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-glass btn-glass-secondary rounded-xl px-8 py-4"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.3)' }}
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
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>256-bit Secure</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-5 h-5 text-blue-500" />
              <span>50K+ Active Users</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Rocket className="w-5 h-5 text-blue-500" />
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
          <div className="glass rounded-3xl p-2 md:p-4 backdrop-blur-xl">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5 rounded-2xl aspect-video flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-20 h-20 text-blue-500/50 mx-auto mb-4 animate-pulse-glow" />
                <p className="text-gray-600 dark:text-gray-400">Premium IPTV Dashboard Preview</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
              variants={itemVariants}
            >
              Why Choose Us?
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-400"
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
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className="w-10 h-10 text-blue-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white/40 dark:bg-black/40 relative z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
              variants={itemVariants}
            >
              3 Simple Steps
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-400"
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
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto glass rounded-3xl px-8 md:px-12 py-12 md:py-20 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of satisfied customers and get premium IPTV today.
          </p>
          <motion.button
            onClick={() => router.push('/login')}
            className="btn-glass btn-glass-primary rounded-xl px-8 py-4 flex items-center justify-center gap-2 mx-auto"
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            Create Account Now
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 dark:border-white/5 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
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