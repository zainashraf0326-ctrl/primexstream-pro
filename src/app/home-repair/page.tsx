'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, Phone, MapPin, Calendar, Send, ArrowLeft, Star, CheckCircle } from 'lucide-react';
import { createOrder } from '@/services/dbService';
import { getConfig, ConfigData } from '@/lib/supabase-service';

interface Service {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  icon?: React.ReactNode;
  type: 'service' | 'custom';
}

interface Order {
  id: string;
  service: string;
  date: string;
  country: string;
  city: string;
  issue: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  createdAt: Date;
}

// Sample team success stories
// Sample team success stories
const TEAM_STORIES = [
  { name: 'Mike Johnson', title: 'Master Locksmith', image: '👨‍🔧', years: '12 years', rating: 4.9 },
  { name: 'Sarah Davis', title: 'Tree Specialist', image: '👩‍🌾', years: '8 years', rating: 4.8 },
  { name: 'Tom Wilson', title: 'Roofing Expert', image: '👨‍🔨', years: '15 years', rating: 4.95 },
  { name: 'Lisa Brown', title: 'Plumber', image: '👨‍🔧', years: '10 years', rating: 4.85 },
  { name: 'John Smith', title: 'Electrician', image: '⚡', years: '14 years', rating: 4.9 },
];

const usaCities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const ukCities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Bristol', 'Edinburgh', 'Liverpool', 'Newcastle'];

export default function HomeRepairPage() {
  const { isLoggedIn, isLoading, user } = useApp();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<'services' | 'booking' | 'team'>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    location: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 123-4567');

  // Load config from Supabase
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await getConfig();
        setConfig(configData);
        
        // Convert home services from config object to Service array format
        if (configData.homeServices) {
          const configServices: Service[] = [];
          
          // Map each home service from config - add all 6 services
          configServices.push({
            id: 'locksmith',
            name: configData.homeServices.locksmith?.name || 'Locksmith',
            description: `Call: ${configData.homeServices.locksmith?.phone || '+1-800-LOCKSMITH'}`,
            emoji: '🔐',
            type: 'service',
          });
          
          configServices.push({
            id: 'plumbing',
            name: configData.homeServices.plumbing?.name || 'Plumbing',
            description: `Call: ${configData.homeServices.plumbing?.phone || '+1-800-PLUMBING'}`,
            emoji: '💧',
            type: 'service',
          });
          
          configServices.push({
            id: 'electrician',
            name: configData.homeServices.electrician?.name || 'Electrician',
            description: `Call: ${configData.homeServices.electrician?.phone || '+1-800-ELECTRIC'}`,
            emoji: '⚡',
            type: 'service',
          });
          
          configServices.push({
            id: 'roofing',
            name: configData.homeServices.roofing?.name || 'Roofing',
            description: `Call: ${configData.homeServices.roofing?.phone || '+1-800-ROOFING'}`,
            emoji: '🏠',
            type: 'service',
          });
          
          configServices.push({
            id: 'tree-trimming',
            name: configData.homeServices.treeTrimming?.name || 'Tree Trimming',
            description: `Call: ${configData.homeServices.treeTrimming?.phone || '+1-800-TREES'}`,
            emoji: '🌳',
            type: 'service',
          });
          
          // Add custom service at the end
          configServices.push({
            id: 'custom',
            name: 'Custom Service',
            description: 'Request any service you need',
            emoji: '✨',
            type: 'custom',
          });
          
          setServices(configServices);
        }
        
        // Get first home service phone number for general inquiries
        if (configData.homeServices?.locksmith?.phone) {
          setPhoneNumber(configData.homeServices.locksmith.phone);
        }
      } catch (err) {
        console.error('Error loading config:', err);
        // Fall back to default services if config fails to load
        setServices([
          {
            id: 'locksmith',
            name: 'Locksmith',
            description: 'Lock repairs, key making, emergency lockout',
            emoji: '🔐',
            type: 'service',
          },
          {
            id: 'plumbing',
            name: 'Plumbing',
            description: 'Leak fixes, pipe repairs, installations',
            emoji: '💧',
            type: 'service',
          },
          {
            id: 'electrician',
            name: 'Electrician',
            description: 'Wiring, outlets, electrical repairs',
            emoji: '⚡',
            type: 'service',
          },
          {
            id: 'roofing',
            name: 'Roofing',
            description: 'Roof repair, installation, maintenance',
            emoji: '🏠',
            type: 'service',
          },
          {
            id: 'tree-trimming',
            name: 'Tree Trimming',
            description: 'Tree pruning, cutting, removal services',
            emoji: '🌳',
            type: 'service',
          },
          {
            id: 'custom',
            name: 'Custom Service',
            description: 'Request any service you need',
            emoji: '✨',
            type: 'custom',
          },
        ]);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    if (service.type === 'custom') {
      // Custom service - show booking form
      setCurrentPage('booking');
    } else {
      // Standard service - show team and phone
      setCurrentPage('team');
    }
  };

  const handleSubmitCustomOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !selectedService) {
      alert('Please log in and select a service');
      return;
    }

    if (!bookingData.date || !bookingData.location || !bookingData.description) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create order with custom service data
      const order = await createOrder(user.id, {
        userName: user.name || 'User',
        email: user.email || '',
        plan: selectedService.name,
        amount: 0, // Service request
        paymentMethod: 'Service Request',
        description: `Service: ${selectedService.name}\nDate: ${bookingData.date}\nLocation: ${bookingData.location}\nDetails: ${bookingData.description}`,
      });

      if (order?.id) {
        setOrderSubmitted(true);
        // Reset form
        setBookingData({ date: '', location: '', description: '' });
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        alert('Failed to create order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error submitting order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToServices = () => {
    setSelectedService(null);
    setCurrentPage('services');
    setBookingData({ date: '', location: '', description: '' });
  };

  return (
    <AppLayout title="Home Services">
      <div className="w-full">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          {/* Services Grid Page */}
          {currentPage === 'services' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Wrench className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  Our Services
                </h1>
                <p className="text-slate-600 dark:text-slate-400">Choose a service or request a custom one</p>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    className="text-left group"
                  >
                    <Card className="glass h-full hover:shadow-lg transition-all hover:scale-105 hover:border-orange-500 dark:hover:border-orange-500">
                      <CardContent className="pt-6">
                        <div className="text-4xl mb-3">{service.emoji}</div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full">
                            {service.type === 'custom' ? 'Custom Request' : 'Book Service'}
                          </span>
                          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors rotate-180" />
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Booking Form Page */}
          {currentPage === 'booking' && selectedService && !orderSubmitted && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleBackToServices}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Back to services"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                    {selectedService.emoji} {selectedService.name}
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Request Custom Service
                  </h2>
                </div>
              </div>

              <Card className="glass">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmitCustomOrder} className="space-y-6">
                    {/* Date Input */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Preferred Date
                      </label>
                      <Input
                        type="date"
                        value={bookingData.date}
                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                        required
                        className="w-full"
                      />
                    </div>

                    {/* Location Input */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Location / Address
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your address or location"
                        value={bookingData.location}
                        onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                        required
                        className="w-full"
                      />
                    </div>

                    {/* Description Input */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        <Send className="w-4 h-4 inline mr-2" />
                        What Do You Need?
                      </label>
                      <textarea
                        placeholder="Describe the service you need in detail..."
                        value={bookingData.description}
                        onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 resize-none h-32"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={handleBackToServices}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-500">
                      Our team will contact you within 24 hours
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Order Submitted Success Page */}
          {currentPage === 'booking' && orderSubmitted && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="glass max-w-sm w-full">
                <CardContent className="pt-10 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="mb-2">Request Submitted!</CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Your {selectedService?.name} service request has been received
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 text-sm">
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      <strong>What&apos;s Next?</strong>
                    </p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <li>✓ Check your email for request confirmation</li>
                      <li>✓ Get WhatsApp notification with details</li>
                      <li>✓ Our team will contact you within 24 hours</li>
                    </ul>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Redirecting to dashboard...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team & Phone Page for Standard Services */}
          {currentPage === 'team' && selectedService && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleBackToServices}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Back to services"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                    {selectedService.emoji} {selectedService.name}
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Our Expert Team
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Stories */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Success Stories
                  </h3>
                  {TEAM_STORIES.map((member, index) => (
                    <Card key={index} className="glass">
                      <CardContent className="pt-4">
                        <div className="flex gap-3">
                          <div className="text-3xl">{member.image}</div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                              {member.title}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">
                                {member.years}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(member.rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-slate-600 dark:text-slate-400">
                                  {member.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Contact Card */}
                <div className="flex flex-col justify-center">
                  <Card className="glass bg-gradient-to-br from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 h-full">
                    <CardContent className="pt-8 text-center space-y-6">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Ready to get started?
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                          Call Us Now
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <Phone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            <a
                              href={`tel:${phoneNumber.replace(/\s/g, '')}`}
                              className="text-2xl font-bold text-orange-600 dark:text-orange-400 hover:underline"
                            >
                              {phoneNumber}
                            </a>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Available 9 AM - 9 PM
                          </p>
                        </div>

                        <Button
                          onClick={() => window.location.href = `tel:${phoneNumber.replace(/\s/g, '')}`}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
                        >
                          <Phone className="w-5 h-5 mr-2" />
                          Call Now
                        </Button>

                        <p className="text-xs text-slate-600 dark:text-slate-400 pt-2">
                          Or we can call you! Just provide your number and we&apos;ll reach out
                        </p>
                      </div>

                      {/* Info Cards */}
                      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Instant responder dispatch
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Transparent pricing
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Guaranteed satisfaction
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
