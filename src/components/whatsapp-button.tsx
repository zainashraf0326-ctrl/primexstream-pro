'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function WhatsAppButton() {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <a
      href="https://wa.me/1234567890"
      target="_blank"
      rel="noopener noreferrer"
      title="Chat with us on WhatsApp"
      className="fixed bottom-[calc(var(--bottom-nav-height)+1.25rem)] right-4 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center z-40 md:right-6"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
