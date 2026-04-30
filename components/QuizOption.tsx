import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

interface QuizOptionProps {
  description?: string;
  isSelected: boolean;
  label: string;
  onPress: () => void;
  multiSelect?: boolean;
}

export function QuizOption({ description, isSelected, label, onPress, multiSelect }: QuizOptionProps) {
  return (
    <Pressable
      accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.selected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.row}>
        <Text style={[styles.label, isSelected && styles.labelOn]}>{label}</Text>
        {multiSelect ? (
          <View style={[styles.box, isSelected && styles.boxSelected]}>
            {isSelected ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        ) : (
          <View style={[styles.dot, isSelected && styles.dotSelected]}>
            {isSelected ? <View style={styles.dotInner} /> : null}
          </View>
        )}
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1D1D1D',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  selected: {
    backgroundColor: '#102A1C',
    borderColor: colors.accent,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...t.label,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    paddingRight: 12,
  },
  labelOn: {
    color: colors.text,
  },
  description: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginTop: 8,
  },
  dot: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  dotSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dotInner: {
    backgroundColor: colors.accentInk,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  box: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  boxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkMark: {
    color: colors.accentInk,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 14,
  },
});
