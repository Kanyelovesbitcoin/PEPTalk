import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { rhythm } from '@/lib/constants/layout';

export function useAdaptiveLayout() {
  const { fontScale, height, width } = useWindowDimensions();

  return useMemo(() => {
    const shortestSide = Math.min(width, height);
    const isLandscape = width > height;
    const isTablet = shortestSide >= 744 || width >= 900;

    return {
      fontScale,
      height,
      isLandscape,
      isTablet,
      pageMaxWidth: isTablet ? (isLandscape ? 920 : 760) : undefined,
      readableMaxWidth: isTablet ? 700 : undefined,
      screenX: isTablet ? 36 : rhythm.screenX,
      width,
    };
  }, [fontScale, height, width]);
}
