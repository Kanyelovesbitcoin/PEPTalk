import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconProps {
  color: string;
  size?: number;
}

/* ─── Home: orbital target mark ─── */
export function HomeIcon({ color, size = 24 }: IconProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.ring, { borderColor: color, width: size, height: size }]} />
      <View style={[styles.ringSmall, { borderColor: color, width: size * 0.5, height: size * 0.5 }]} />
      <View style={[styles.dot, { backgroundColor: color, width: size * 0.16, height: size * 0.16 }]} />
    </View>
  );
}

/* ─── Library: unified open book / pages ─── */
export function LibraryIcon({ color, size = 24 }: IconProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* spine */}
      <View style={[styles.bookSpine, { backgroundColor: color, height: size * 0.74 }]} />
      {/* left page */}
      <View style={[styles.bookPage, { borderColor: color, width: size * 0.38, height: size * 0.62, right: size * 0.48, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }]} />
      {/* right page */}
      <View style={[styles.bookPage, { borderColor: color, width: size * 0.38, height: size * 0.62, left: size * 0.48, borderTopRightRadius: 3, borderBottomRightRadius: 3 }]} />
    </View>
  );
}

/* ─── Tracker: simple pill capsule with dot ─── */
export function TrackerIcon({ color, size = 24 }: IconProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.pill, { borderColor: color, width: size * 0.55, height: size * 0.8 }]}>
        <View style={[styles.pillDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

/* ─── AI: simple 4-point spark ─── */
export function AIIcon({ color, size = 24 }: IconProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* center glow */}
      <View style={[styles.sparkCenter, { backgroundColor: color }]} />
      {/* four rays */}
      <View style={[styles.sparkRay, { backgroundColor: color, height: size * 0.28, top: 0 }]} />
      <View style={[styles.sparkRay, { backgroundColor: color, height: size * 0.28, bottom: 0 }]} />
      <View style={[styles.sparkRay, { backgroundColor: color, width: size * 0.28, left: 0 }]} />
      <View style={[styles.sparkRay, { backgroundColor: color, width: size * 0.28, right: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* home */
  ring: {
    borderRadius: 999,
    borderWidth: 1.5,
    opacity: 0.8,
    position: 'absolute',
  },
  ringSmall: {
    borderRadius: 999,
    borderWidth: 1,
    opacity: 0.4,
    position: 'absolute',
  },
  dot: {
    borderRadius: 999,
    position: 'absolute',
  },
  /* library */
  bookSpine: {
    borderRadius: 1,
    opacity: 0.7,
    position: 'absolute',
    width: 1.5,
  },
  bookPage: {
    borderRadius: 2,
    borderWidth: 1.5,
    opacity: 0.65,
    position: 'absolute',
  },
  /* tracker */
  pill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.6,
    justifyContent: 'center',
    opacity: 0.9,
  },
  pillDot: {
    borderRadius: 999,
    height: 4,
    opacity: 0.75,
    width: 4,
  },
  /* ai spark */
  sparkCenter: {
    borderRadius: 999,
    height: 5,
    opacity: 0.9,
    position: 'absolute',
    width: 5,
    zIndex: 2,
  },
  sparkRay: {
    borderRadius: 999,
    height: 1.8,
    opacity: 0.45,
    position: 'absolute',
    width: 1.8,
    zIndex: 1,
  },
});
