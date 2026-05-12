import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface MetaRowProps {
  k: string;
  last?: boolean;
  v: ReactNode;
}

export function MetaRow({ k, last = false, v }: MetaRowProps) {
  return (
    <View style={[styles.row, last && styles.last]}>
      <Text style={styles.key}>{k.toUpperCase()}</Text>
      <View style={styles.valueWrap}>
        {typeof v === 'string' ? <Text style={styles.value}>{v}</Text> : v}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  key: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    maxWidth: '42%',
  },
  last: {
    borderBottomWidth: 0,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 12,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    textAlign: 'right',
  },
  valueWrap: {
    alignItems: 'flex-end',
    flex: 1,
    paddingLeft: 16,
  },
});
