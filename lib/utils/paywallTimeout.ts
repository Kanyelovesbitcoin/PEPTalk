import type { PaywallAttemptResult } from '@/lib/hooks/usePro';

export const PAYWALL_TIMEOUT_MS = 12000;

export type PaywallCheckResult =
  | { result: PaywallAttemptResult; status: 'result' }
  | { status: 'timeout' };

export function showPaywallWithTimeout(
  showPaywall: () => Promise<PaywallAttemptResult>,
  timeoutMs = PAYWALL_TIMEOUT_MS,
): Promise<PaywallCheckResult> {
  return new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ status: 'timeout' });
    }, timeoutMs);

    showPaywall()
      .then((result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ result, status: 'result' });
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ status: 'timeout' });
      });
  });
}
