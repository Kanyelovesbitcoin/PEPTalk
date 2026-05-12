import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

interface SectionHeadProps {
  kicker: string;
  number: string;
  right?: ReactNode;
  title: string;
}

export function SectionHead({ kicker, number, right, title }: SectionHeadProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text style={styles.kicker}>{`§ ${number} · ${kicker}`.toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    paddingRight: 14,
  },
  kicker: {
    ...t.dataSmall,
    color: colors.accent,
    marginBottom: 7,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 23,
    letterSpacing: -0.35,
    lineHeight: 28,
  },
  wrap: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});
