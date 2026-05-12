import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/lib/constants/colors';

interface AmbientGlowProps {
  bottom?: number;
  left?: number;
  opacity?: number;
  right?: number;
  size?: number;
  style?: ViewStyle;
  top?: number;
}

export function AmbientGlow({
  bottom,
  left,
  opacity = 0.055,
  right,
  size = 340,
  style,
  top,
}: AmbientGlowProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          backgroundColor: colors.accent,
          borderRadius: size / 2,
          bottom,
          height: size,
          left,
          opacity,
          right,
          top,
          width: size,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    transform: [{ scaleX: 1.18 }, { scaleY: 0.82 }],
  },
});
