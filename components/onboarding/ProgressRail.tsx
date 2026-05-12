import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/lib/constants/colors';

interface ProgressRailProps {
  index: number;
  total: number;
}

export function ProgressRail({ index, total }: ProgressRailProps) {
  const progress = total > 1 ? Math.max(0, Math.min(1, index / (total - 1))) : 1;
  const animatedProgress = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      duration: 220,
      toValue: progress,
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, progress]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.track}>
      <Animated.View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 3,
  },
  track: {
    backgroundColor: colors.textFaint,
    borderRadius: 999,
    height: 3,
    overflow: 'hidden',
  },
});
