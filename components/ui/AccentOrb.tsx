import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/lib/constants/colors';

interface AccentOrbProps {
  bottom?: number;
  left?: number;
  opacity?: string;
  right?: number;
  size: number;
  style?: ViewStyle;
  top?: number;
}

export function AccentOrb({
  bottom,
  left,
  opacity = '12',
  right,
  size,
  style,
  top,
}: AccentOrbProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          backgroundColor: `${colors.accent}${opacity}`,
          borderRadius: size / 2,
          bottom,
          height: size,
          left,
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
  orb: {
    position: 'absolute',
  },
});
