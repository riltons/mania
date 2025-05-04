import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionService, SubscriptionWithPlan } from '@/services/subscriptionService';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionContextType {
  subscription?: SubscriptionWithPlan | null;
}

const SubscriptionContext = createContext<SubscriptionContextType>({ subscription: undefined });

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>();

  useEffect(() => {
    if (user) {
      subscriptionService
        .getUserSubscription(user.id)
        .then((sub) => setSubscription(sub))
        .catch(() => setSubscription(null));
    } else {
      setSubscription(null);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{ subscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => useContext(SubscriptionContext);
