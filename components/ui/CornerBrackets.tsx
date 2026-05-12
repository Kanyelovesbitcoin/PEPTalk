import { StyleSheet, View } from 'react-native';

import { colors } from '@/lib/constants/colors';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

interface CornerBracketsProps {
  armLength?: number;
  color?: string;
  corners?: Corner[];
  opacity?: number;
}

export function CornerBrackets({
  armLength = 18,
  color = colors.accent,
  corners = ['tl', 'tr', 'bl', 'br'],
  opacity = 0.55,
}: CornerBracketsProps) {
  const baseStyle = {
    borderColor: color,
    height: armLength,
    opacity,
    width: armLength,
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {corners.includes('tl') ? <View style={[styles.bracket, baseStyle, styles.tl]} /> : null}
      {corners.includes('tr') ? <View style={[styles.bracket, baseStyle, styles.tr]} /> : null}
      {corners.includes('bl') ? <View style={[styles.bracket, baseStyle, styles.bl]} /> : null}
      {corners.includes('br') ? <View style={[styles.bracket, baseStyle, styles.br]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bracket: {
    position: 'absolute',
  },
  tl: {
    borderLeftWidth: 1,
    borderTopWidth: 1,
    left: 0,
    top: 0,
  },
  tr: {
    borderRightWidth: 1,
    borderTopWidth: 1,
    right: 0,
    top: 0,
  },
  bl: {
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    bottom: 0,
    left: 0,
  },
  br: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    bottom: 0,
    right: 0,
  },
});
