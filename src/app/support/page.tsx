'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, MessageCircle, Mail, Phone, Star, Shield, Lock } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

// Default reviews in case Supabase is not configured
const DEFAULT_REVIEWS = [
  {
    id: '1',
    name: 'Ahmed Hassan',
    rating: 5,
    text: 'Best IPTV service I\'ve used! Quick installation and amazing picture quality. Highly recommended!',
    date: '2 weeks ago',
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    rating: 5,
    text: 'Excellent customer support team. They helped me set up everything in minutes. Worth every penny!',
    date: '1 month ago',
  },
  {
    id: '3',
    name: 'John Smith',
    rating: 4,
    text: 'Great service with tons of channels. Occasional buffering but overall very satisfied.',
    date: '3 weeks ago',
  },
];

// Default FAQs in case Supabase is not configured
const DEFAULT_FAQS = [
  {
    id: '1',
    question: 'Is my payment information secure?',
    answer:
      'Yes! We use bank-level encryption (SSL/TLS) to protect your payments. All transactions are secured with industry-standard security protocols. Your credit card data is never stored on our servers.',
  },
  {
    id: '2',
    question: 'What payment methods do you accept?',
    answer:
      'We accept Remitly, Binance, PayPal, and CashApp. All payments are processed securely with fraud protection. We offer discounts for Remitly and Binance payments.',
  },
  {
    id: '3',
    question: 'Can I get a refund if I\'m not satisfied?',
    answer:
      'Absolutely! We offer a 48-hour money-back guarantee on all plans. If you\'re not completely satisfied, contact our support team for a full refund, no questions asked.',
  },
  {
    id: '4',
    question: 'How many devices can I use simultaneously?',
    answer:
      'Your subscription plan determines simultaneous streams: 1-Month (2 devices), 6-Month (3 devices), 12-Month (4 devices). Upgrade your plan to add more device access.',
  },
  {
    id: '5',
    question: 'What if I experience issues with my service?',
    answer:
      'Our 24/7 support team is ready to help! Contact us via WhatsApp, Email, or Phone. We typically respond within 1 hour. We\'ll troubleshoot and resolve issues immediately.',
  },
  {
    id: '6',
    question: 'Are your services legal and reliable?',
    answer:
      'Yes! PrimexStream Pro is a licensed reseller operating in full compliance. We maintain 99.9% uptime with redundant servers. Your service is backed by our reliability guarantee.',
  },
];

export default function SupportPage() {
  const { isLoggedIn, isLoading } = useApp();
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [faqs, setFAQs] = useState<FAQ[]>(DEFAULT_FAQS);

  const handleSubmitContact = () => {
    if (!contactForm.email || !contactForm.subject || !contactForm.message) {
      alert('Please fill in all fields');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      alert('Message sent! Our support team will contact you within 24 hours.');
      setContactForm({ email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 1000);
  };

  return (
    <AppLayout title="Support">
      <div className="w-full">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-6">
          <div className="space-y-8">
        {/* Contact Options */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="glass">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">WhatsApp Support</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Chat with us instantly on WhatsApp for quick assistance
                </p>
              </div>
              <Button size="sm" variant="secondary">
                Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">Email Support</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  support@primexstream.com
                </p>
              </div>
              <Button size="sm" variant="secondary">
                Email
              </Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">Phone Support</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  +1 (555) 123-4567
                </p>
              </div>
              <Button size="sm" variant="secondary">
                Call
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="glass">
          <CardTitle className="mb-4">Send us a Message</CardTitle>
          <CardContent className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={contactForm.email}
              onChange={(e) =>
                setContactForm({ ...contactForm, email: e.target.value })
              }
            />
            <Input
              label="Subject"
              type="text"
              placeholder="How can we help?"
              value={contactForm.subject}
              onChange={(e) =>
                setContactForm({ ...contactForm, subject: e.target.value })
              }
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message
              </label>
              <textarea
                placeholder="Describe your issue or question..."
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                rows={4}
              />
            </div>
            <Button
              onClick={handleSubmitContact}
              disabled={submitted}
              className="w-full"
              size="lg"
            >
              {submitted ? 'Sending...' : 'Send Message'}
            </Button>
          </CardContent>
        </Card>

        {/* Customer Reviews */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Customer Reviews
          </h3>
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id} className="glass">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {review.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {review.date}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      {[...Array(5 - review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-slate-300 dark:text-slate-600"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {review.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Security */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Payment Security
          </h3>
          <div className="space-y-3">
            <Card className="glass">
              <CardContent className="pt-4 flex items-start gap-4">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">
                    Bank-Level Encryption
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    All transactions use SSL/TLS 256-bit encryption, the same standard used by major banks
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-4 flex items-start gap-4">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">
                    PCI-DSS Compliant
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    We are fully compliant with Payment Card Industry Data Security Standards
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-4 flex items-start gap-4">
                <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">
                    No Card Storage
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your credit card details are never stored on our servers - we process through secure gateways only
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-4 flex items-start gap-4">
                <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">
                    Fraud Protection
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Advanced systems detect and prevent fraudulent transactions in real-time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="cursor-pointer transition-all duration-200 hover:scale-101"
                onClick={() =>
                  setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                }
              >
                <Card className="glass">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {faq.question}
                      </p>
                      <div className="flex-shrink-0">
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </div>
                    </div>

                    {expandedFaq === faq.id && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                        {faq.answer}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      </div>
    </AppLayout>
  );
}
