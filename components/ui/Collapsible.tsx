import { useState, type ReactNode } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleProps {
  title: string;
  number?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Collapsible({
  title,
  number,
  defaultOpen = false,
  children,
}: Readonly<CollapsibleProps>) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((value) => !value);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.headerLeft}>
          {number ? <Text style={styles.number}>§ {number}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>+</Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  number: {
    ...t.sectionNum,
    color: colors.accent,
    fontSize: 10,
  },
  title: {
    ...t.label,
    color: colors.text,
    flexShrink: 1,
    fontSize: 15,
  },
  chevron: {
    color: colors.textDim,
    fontFamily: t.data.fontFamily,
    fontSize: 22,
    lineHeight: 22,
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    color: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  body: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
});
