import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/lib/constants/colors';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 14, radius = 4, style }: SkeletonProps) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(0.85);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced]);

  return (
    <Animated.View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={[
        styles.base,
        {
          borderRadius: radius,
          height,
          opacity,
          width: typeof width === 'number' ? width : (width as ViewStyle['width']),
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  rows?: number;
}

export function SkeletonCard({ rows = 3 }: Readonly<SkeletonCardProps>) {
  return (
    <View style={styles.card}>
      <Skeleton height={10} radius={2} width="30%" />
      <View style={{ height: 14 }} />
      <Skeleton height={22} radius={4} width="65%" />
      <View style={{ height: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <Skeleton height={11} radius={3} width={i === rows - 1 ? '70%' : '100%'} />
        </View>
      ))}
      <View style={styles.cardMeta}>
        <Skeleton height={9} radius={2} width="20%" />
        <Skeleton height={9} radius={2} width="25%" />
        <Skeleton height={9} radius={2} width="20%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceAlt,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    padding: 20,
  },
  cardMeta: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 18,
    marginTop: 18,
    paddingTop: 14,
  },
});
