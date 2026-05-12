import { Alert } from 'react-native';

import type { PaywallAttemptResult } from '@/lib/hooks/usePro';

type ShowPaywall = () => Promise<PaywallAttemptResult>;

const TITLE_BY_OUTCOME: Record<PaywallAttemptResult['outcome'], string> = {
  already_entitled: 'Pro is already active',
  cancelled: 'Trial was not started',
  configure_error: 'Purchases are not ready',
  error: 'Purchase sheet failed',
  expo_go: 'Use TestFlight for purchases',
  missing_api_key: 'RevenueCat key missing',
  missing_offering: 'RevenueCat offering missing',
  not_presented: 'Paywall did not open',
  purchased: 'Pro is active',
  restored: 'Pro restored',
};

export async function showPaywallWithAlert(showPaywall: ShowPaywall): Promise<PaywallAttemptResult> {
  const result = await showPaywall();

  if (result.didUnlock && result.outcome !== 'already_entitled') {
    return result;
  }

  Alert.alert(TITLE_BY_OUTCOME[result.outcome], result.message);
  return result;
}
