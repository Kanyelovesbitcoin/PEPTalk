import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

import type { SlideConfig } from './types';

type LoaderSlideConfig = Extract<SlideConfig, { kind: 'loader' }>;

interface LoaderSlideProps {
  onDone: () => void;
  slide: LoaderSlideConfig;
}

export function LoaderSlide({ onDone, slide }: LoaderSlideProps) {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const taglines = slide.taglines.length > 0 ? slide.taglines : ['Preparing your file'];

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      duration: slide.durationMs,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 900, toValue: 1, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 900, toValue: 0, useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();

    const taglineTimer = setInterval(() => {
      setTaglineIndex((current) => (current + 1) % taglines.length);
    }, Math.max(700, Math.floor(slide.durationMs / taglines.length)));

    const doneTimer = setTimeout(onDone, slide.durationMs);

    return () => {
      clearInterval(taglineTimer);
      clearTimeout(doneTimer);
      pulseLoop.stop();
    };
  }, [onDone, progress, pulse, slide.durationMs, taglines.length]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.12] });

  return (
    <View style={styles.wrap}>
      <View style={styles.markWrap}>
        <Animated.View style={[styles.markHalo, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
        <View style={styles.mark}>
          <Text style={styles.markText}>GP</Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.tagline}>{taglines[taglineIndex]}</Text>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
    textAlign: 'center',
  },
  fill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 4,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  markHalo: {
    backgroundColor: colors.glow,
    borderRadius: 999,
    height: 132,
    position: 'absolute',
    width: 132,
  },
  markText: {
    color: colors.accent,
    fontFamily: fonts.monoMedium,
    fontSize: 20,
    letterSpacing: 1.2,
  },
  markWrap: {
    alignItems: 'center',
    height: 148,
    justifyContent: 'center',
    marginBottom: 16,
  },
  tagline: {
    ...t.body,
    color: colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
  title: {
    ...t.display,
    color: colors.text,
    letterSpacing: 0,
    lineHeight: 34,
    textAlign: 'center',
  },
  track: {
    alignSelf: 'center',
    backgroundColor: colors.textFaint,
    borderRadius: 999,
    height: 4,
    marginTop: 32,
    overflow: 'hidden',
    width: '78%',
  },
  wrap: {
    alignItems: 'center',
    paddingBottom: 20,
  },
});
