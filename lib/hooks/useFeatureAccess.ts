import { getFeatureAccess, type FeatureAccess, type FeatureKey } from '@/lib/constants/features';
import { usePro } from '@/lib/hooks/usePro';

export function useFeatureAccess(key: FeatureKey): FeatureAccess {
  const { isPro } = usePro();
  return getFeatureAccess(key, isPro);
}
