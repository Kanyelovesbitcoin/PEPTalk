import { Image, StyleSheet, type ImageStyle } from 'react-native';

interface BrandLogoProps {
  height?: number;
  style?: ImageStyle;
  width?: number;
}

export function BrandLogo({ height = 64, style, width = 52 }: BrandLogoProps) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      source={require('@/assets/images/glowpep-app-icon.png')}
      style={[styles.logo, { height, width }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    flexShrink: 0,
  },
});
