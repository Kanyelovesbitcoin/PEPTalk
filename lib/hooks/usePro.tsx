import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';

const ENTITLEMENT_ID =
  (Constants.expoConfig?.extra?.revenueCatEntitlementId as string | undefined)?.trim() ||
  'glowpep_pro';
const RC_API_KEY = (Constants.expoConfig?.extra?.revenueCatApiKey as string | undefined)?.trim() ?? '';
const isExpoGo = Constants.appOwnership === 'expo';

export type PaywallOutcome =
  | 'idle'
  | 'configured'
  | 'purchased'
  | 'restored'
  | 'already_entitled'
  | 'cancelled'
  | 'not_presented'
  | 'missing_api_key'
  | 'expo_go'
  | 'missing_offering'
  | 'configure_error'
  | 'error';

export interface PaywallAttemptResult {
  didUnlock: boolean;
  message: string;
  outcome: Exclude<PaywallOutcome, 'idle' | 'configured'>;
}

export interface PaywallStatus {
  canPresent: boolean;
  entitlementId: string;
  isConfigured: boolean;
  message: string;
  outcome: PaywallOutcome;
  updatedAt?: number;
}

export type DevAccessMode = 'free' | 'live' | 'pro';

interface ProContextValue {
  appUserId: string;
  devAccessMode: DevAccessMode;
  hasEntitlement: (entitlementId: string) => boolean;
  isPro: boolean;
  isReady: boolean;
  paywallStatus: PaywallStatus;
  setDevAccessMode: (mode: DevAccessMode) => void;
  showPaywall: (entitlementId?: string) => Promise<PaywallAttemptResult>;
  restorePurchases: () => Promise<boolean>;
  showCustomerCenter: () => Promise<void>;
}

const ProContext = createContext<ProContextValue | null>(null);

function checkEntitlement(customerInfo: CustomerInfo): boolean {
  return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

function checkEntitlementById(customerInfo: CustomerInfo, entitlementId: string): boolean {
  return typeof customerInfo.entitlements.active[entitlementId] !== 'undefined';
}

function warnPaywall(result: PaywallAttemptResult) {
  if (result.outcome === 'cancelled' || result.outcome === 'already_entitled') {
    return;
  }

  console.warn(`[RevenueCat] Paywall ${result.outcome}: ${result.message}`);
}

export function ProProvider({ children }: { children: ReactNode }) {
  const [appUserId, setAppUserId] = useState('');
  const [entitlementPro, setEntitlementPro] = useState(false);
  const [activeEntitlements, setActiveEntitlements] = useState<Record<string, true>>({});
  const [devAccessMode, setDevAccessMode] = useState<DevAccessMode>(__DEV__ ? 'free' : 'live');
  const [isReady, setIsReady] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [paywallStatus, setPaywallStatus] = useState<PaywallStatus>({
    canPresent: false,
    entitlementId: ENTITLEMENT_ID,
    isConfigured: false,
    message: 'RevenueCat has not initialized yet.',
    outcome: 'idle',
  });

  const isPro =
    __DEV__ && devAccessMode !== 'live'
      ? devAccessMode === 'pro'
      : entitlementPro;

  const setPaywallState = useCallback((status: Omit<PaywallStatus, 'entitlementId' | 'updatedAt'>) => {
    setPaywallStatus({
      ...status,
      entitlementId: ENTITLEMENT_ID,
      updatedAt: Date.now(),
    });
  }, []);

  const finishPaywallAttempt = useCallback(
    (result: PaywallAttemptResult): PaywallAttemptResult => {
      setPaywallState({
        canPresent: isConfigured,
        isConfigured,
        message: result.message,
        outcome: result.outcome,
      });
      warnPaywall(result);
      return result;
    },
    [isConfigured, setPaywallState],
  );

  useEffect(() => {
    async function initRevenueCat() {
      try {
        if (!RC_API_KEY) {
          setIsConfigured(false);
          setPaywallState({
            canPresent: false,
            isConfigured: false,
            message: 'EXPO_PUBLIC_REVENUECAT_API_KEY or REVENUECAT_PUBLIC_SDK_KEY is missing from the app config. Add the public Apple SDK key to the EAS production environment.',
            outcome: 'missing_api_key',
          });
          return;
        }

        if (isExpoGo) {
          setIsConfigured(false);
          setPaywallState({
            canPresent: false,
            isConfigured: false,
            message: 'RevenueCat native purchases are disabled in Expo Go. Use an EAS development or TestFlight build.',
            outcome: 'expo_go',
          });
          return;
        }

        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        }

        Purchases.configure({ apiKey: RC_API_KEY });
        setIsConfigured(true);
        setPaywallState({
          canPresent: true,
          isConfigured: true,
          message: `RevenueCat configured for entitlement "${ENTITLEMENT_ID}".`,
          outcome: 'configured',
        });

        const [customerInfo, nextAppUserId] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getAppUserID(),
        ]);
        setAppUserId(nextAppUserId);
        await storage.setItem(STORAGE_KEYS.revenueCatAppUserId, nextAppUserId);
        setEntitlementPro(checkEntitlement(customerInfo));
        setActiveEntitlements(
          Object.keys(customerInfo.entitlements.active).reduce<Record<string, true>>((lookup, key) => {
            lookup[key] = true;
            return lookup;
          }, {}),
        );
      } catch (error) {
        setIsConfigured(false);
        setPaywallState({
          canPresent: false,
          isConfigured: false,
          message: error instanceof Error ? error.message : 'RevenueCat failed to initialize.',
          outcome: 'configure_error',
        });
      } finally {
        setIsReady(true);
      }
    }

    initRevenueCat();
  }, [setPaywallState]);

  useEffect(() => {
    if (!isConfigured) {
      return undefined;
    }

    const listener = (customerInfo: CustomerInfo) => {
      setEntitlementPro(checkEntitlement(customerInfo));
      setActiveEntitlements(
        Object.keys(customerInfo.entitlements.active).reduce<Record<string, true>>((lookup, key) => {
          lookup[key] = true;
          return lookup;
        }, {}),
      );
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured]);

  const showPaywall = useCallback(async (entitlementId = ENTITLEMENT_ID): Promise<PaywallAttemptResult> => {
    if (!isConfigured) {
      const result: PaywallAttemptResult = {
        didUnlock: false,
        message: paywallStatus.message || 'RevenueCat is not configured.',
        outcome:
          paywallStatus.outcome === 'missing_api_key' || paywallStatus.outcome === 'expo_go'
            ? paywallStatus.outcome
            : 'configure_error',
      };
      return finishPaywallAttempt(result);
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasRequestedEntitlement = checkEntitlementById(customerInfo, entitlementId);

      if (hasRequestedEntitlement) {
        setEntitlementPro(checkEntitlement(customerInfo));
        setActiveEntitlements(
          Object.keys(customerInfo.entitlements.active).reduce<Record<string, true>>((lookup, key) => {
            lookup[key] = true;
            return lookup;
          }, {}),
        );
        Purchases.getAppUserID().then((nextAppUserId) => {
          setAppUserId(nextAppUserId);
          storage.setItem(STORAGE_KEYS.revenueCatAppUserId, nextAppUserId);
        }).catch(() => undefined);
        return finishPaywallAttempt({
          didUnlock: true,
          message: `Customer already has active entitlement "${entitlementId}".`,
          outcome: 'already_entitled',
        });
      }

      const offerings = await Purchases.getOfferings();
      if (!offerings.current || offerings.current.availablePackages.length === 0) {
        return finishPaywallAttempt({
          didUnlock: false,
          message: 'No current RevenueCat offering with available packages was found.',
          outcome: 'missing_offering',
        });
      }

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: entitlementId,
      });

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
          {
            const updatedCustomerInfo = await Purchases.getCustomerInfo();
            setEntitlementPro(checkEntitlement(updatedCustomerInfo));
            setActiveEntitlements(
              Object.keys(updatedCustomerInfo.entitlements.active).reduce<Record<string, true>>((lookup, key) => {
                lookup[key] = true;
                return lookup;
              }, {}),
            );
          }
          Purchases.getAppUserID().then((nextAppUserId) => {
            setAppUserId(nextAppUserId);
            storage.setItem(STORAGE_KEYS.revenueCatAppUserId, nextAppUserId);
          }).catch(() => undefined);
          return finishPaywallAttempt({
            didUnlock: true,
            message: `Purchase completed and entitlement "${entitlementId}" is active.`,
            outcome: 'purchased',
          });
        case PAYWALL_RESULT.RESTORED:
          {
            const updatedCustomerInfo = await Purchases.getCustomerInfo();
            setEntitlementPro(checkEntitlement(updatedCustomerInfo));
            setActiveEntitlements(
              Object.keys(updatedCustomerInfo.entitlements.active).reduce<Record<string, true>>((lookup, key) => {
                lookup[key] = true;
                return lookup;
              }, {}),
            );
          }
          Purchases.getAppUserID().then((nextAppUserId) => {
            setAppUserId(nextAppUserId);
            storage.setItem(STORAGE_KEYS.revenueCatAppUserId, nextAppUserId);
          }).catch(() => undefined);
          return finishPaywallAttempt({
            didUnlock: true,
            message: `Purchase restored and entitlement "${entitlementId}" is active.`,
            outcome: 'restored',
          });
        case PAYWALL_RESULT.CANCELLED:
          return finishPaywallAttempt({
            didUnlock: false,
            message: 'Customer dismissed or cancelled the paywall.',
            outcome: 'cancelled',
          });
        case PAYWALL_RESULT.NOT_PRESENTED:
          return finishPaywallAttempt({
            didUnlock: false,
            message: 'RevenueCat did not present a paywall. Check entitlement, targeting, and offering setup.',
            outcome: 'not_presented',
          });
        default:
          return finishPaywallAttempt({
            didUnlock: false,
            message: 'RevenueCat returned an error result from the paywall.',
            outcome: 'error',
          });
      }
    } catch (error) {
      return finishPaywallAttempt({
        didUnlock: false,
        message: error instanceof Error ? error.message : 'RevenueCat paywall presentation failed.',
        outcome: 'error',
      });
    }
  }, [finishPaywallAttempt, isConfigured, paywallStatus.message, paywallStatus.outcome]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      return false;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasEntitlement = checkEntitlement(customerInfo);
      setEntitlementPro(hasEntitlement);
      setActiveEntitlements(
        Object.keys(customerInfo.entitlements.active).reduce<Record<string, true>>((lookup, key) => {
          lookup[key] = true;
          return lookup;
        }, {}),
      );
      if (hasEntitlement) {
        const nextAppUserId = await Purchases.getAppUserID();
        setAppUserId(nextAppUserId);
        await storage.setItem(STORAGE_KEYS.revenueCatAppUserId, nextAppUserId);
      }
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
      // Customer Center may not be available on all platforms.
    }
  }, [isConfigured]);

  const value: ProContextValue = useMemo(
    () => ({
      appUserId,
      devAccessMode,
      hasEntitlement: (entitlementId: string) =>
        (__DEV__ && devAccessMode === 'pro') || Boolean(activeEntitlements[entitlementId]),
      isPro,
      isReady,
      paywallStatus,
      setDevAccessMode,
      showPaywall,
      restorePurchases,
      showCustomerCenter,
    }),
    [activeEntitlements, appUserId, devAccessMode, isPro, isReady, paywallStatus, restorePurchases, showCustomerCenter, showPaywall],
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const context = useContext(ProContext);

  if (!context) {
    throw new Error('usePro must be used inside ProProvider');
  }

  return context;
}
