'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { BillingSubscription, BillingProvider as ProviderType } from '@/lib/billing/types';
import { effectiveBillingPlan, hasActiveEntitlement } from '@/lib/billing/types';
import { PLAN_CATALOG, type QuotaFeature } from '@/lib/usage/plan-catalog';
import type { QuotaSnapshot } from '@/lib/usage/quota-service';

export type UpgradeModalFeature = 'tarot' | 'wallpaper' | 'indicators' | 'general';

export interface UpgradeModalContext {
  feature?: UpgradeModalFeature;
  title?: string;
  description?: string;
}

interface BillingContextType {
  plan: 'free' | 'pro';
  isPro: boolean;
  subscription: BillingSubscription | null;
  isLoading: boolean;
  monthlyLimits: Record<QuotaFeature, number>;
  quota: QuotaSnapshot | null;
  periodStart: string | null;
  periodEnd: string | null;
  isUpgradeModalOpen: boolean;
  modalContext: UpgradeModalContext | null;
  openUpgradeModal: (context?: UpgradeModalContext) => void;
  closeUpgradeModal: () => void;
  refreshSubscription: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [modalContext, setModalContext] = useState<UpgradeModalContext | null>(null);
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setQuota(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/billing/subscription', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription || null);
        setQuota(data.quota || null);
        setPeriodStart(data.periodStart || null);
        setPeriodEnd(data.periodEnd || null);
      }
    } catch (err) {
      console.warn('[useBilling] Failed to load subscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  const plan = useMemo(() => effectiveBillingPlan(subscription), [subscription]);
  const isPro = useMemo(() => hasActiveEntitlement(subscription), [subscription]);
  const monthlyLimits = useMemo(() => PLAN_CATALOG[plan], [plan]);

  const openUpgradeModal = useCallback((context: UpgradeModalContext = { feature: 'general' }) => {
    setModalContext(context);
    setIsUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
    setModalContext(null);
  }, []);

  const value = useMemo(
    () => ({
      plan,
      isPro,
      subscription,
      isLoading,
      monthlyLimits,
      quota,
      periodStart,
      periodEnd,
      isUpgradeModalOpen,
      modalContext,
      openUpgradeModal,
      closeUpgradeModal,
      refreshSubscription: fetchSubscription,
    }),
    [
      plan,
      isPro,
      subscription,
      isLoading,
      monthlyLimits,
      quota,
      periodStart,
      periodEnd,
      isUpgradeModalOpen,
      modalContext,
      openUpgradeModal,
      closeUpgradeModal,
      fetchSubscription,
    ]
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingContextType {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
