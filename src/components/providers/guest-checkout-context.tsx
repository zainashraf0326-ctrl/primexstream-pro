'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface GuestCheckoutData {
  email: string;
  name: string;
}

interface GuestCheckoutContextType {
  guestCheckout: GuestCheckoutData | null;
  isGuestMode: boolean;
  setGuestCheckout: (data: GuestCheckoutData) => void;
  clearGuestCheckout: () => void;
  setIsGuestMode: (isGuest: boolean) => void;
}

const GuestCheckoutContext = createContext<GuestCheckoutContextType | undefined>(undefined);

export function GuestCheckoutProvider({ children }: { children: ReactNode }) {
  const [guestCheckout, setGuestCheckout] = useState<GuestCheckoutData | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const handleSetGuestCheckout = (data: GuestCheckoutData) => {
    setGuestCheckout(data);
    setIsGuestMode(true);
  };

  const handleClearGuestCheckout = () => {
    setGuestCheckout(null);
    setIsGuestMode(false);
  };

  const value: GuestCheckoutContextType = {
    guestCheckout,
    isGuestMode,
    setGuestCheckout: handleSetGuestCheckout,
    clearGuestCheckout: handleClearGuestCheckout,
    setIsGuestMode,
  };

  return (
    <GuestCheckoutContext.Provider value={value}>
      {children}
    </GuestCheckoutContext.Provider>
  );
}

export function useGuestCheckout() {
  const context = useContext(GuestCheckoutContext);
  if (context === undefined) {
    throw new Error('useGuestCheckout must be used within GuestCheckoutProvider');
  }
  return context;
}
