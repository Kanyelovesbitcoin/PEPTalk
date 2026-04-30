import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

const ENTITLEMENT_ID = 'GlowPep Pro';
const RC_API_KEY = (Constants.expoConfig?.extra?.revenueCatApiKey as string) ?? '';
const isExpoGo = Constants.appOwnership === 'expo';

interface ProContextValue {
  isPro: boolean;
  isReady: boolean;
  showPaywall: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  showCustomerCenter: () => Promise<void>;
}

const ProContext = createContext<ProContextValue | null>(null);

function checkEntitlement(customerInfo: CustomerInfo): boolean {
  return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(__DEV__ ? true : false);
  const [isReady, setIsReady] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    async function initRevenueCat() {
      try {
        if (!RC_API_KEY || isExpoGo) {
          setIsConfigured(false);
          return;
        }

        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        }

        Purchases.configure({ apiKey: RC_API_KEY });
        setIsConfigured(true);

        const customerInfo = await Purchases.getCustomerInfo();
        setIsPro(checkEntitlement(customerInfo));
      } catch {
        // RevenueCat may fail in dev/web — fall back to free
      } finally {
        setIsReady(true);
      }
    }

    initRevenueCat();
  }, []);

  // Listen for subscription status changes
  useEffect(() => {
    if (!isConfigured) {
      return undefined;
    }

    const listener = (customerInfo: CustomerInfo) => {
      setIsPro(checkEntitlement(customerInfo));
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured]);

  const showPaywall = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      return false;
    }

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          return true;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }, [isConfigured]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      return false;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasEntitlement = checkEntitlement(customerInfo);
      setIsPro(hasEntitlement);
      return hasEntitlement;
    } catch {
      return false;
    }
  }, [isConfigured]);

  const showCustomerCenter = useCallback(async (): Promise<void> => {
    if (!isConfigured) {
      return;
    }

    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch {
      // Customer Center may not be available on all platforms
    }
  }, [isConfigured]);

  const value: ProContextValue = {
    isPro,
    isReady,
    showPaywall,
    restorePurchases,
    showCustomerCenter,
  };

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const context = useContext(ProContext);

  if (!context) {
    throw new Error('usePro must be used inside ProProvider');
  }

  return context;
}
