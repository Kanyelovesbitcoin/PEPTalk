import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/lib/constants/colors';

interface BookmarkMarkProps {
  active?: boolean;
  locked?: boolean;
  size?: number;
}

export function BookmarkMark({ active = false, locked = false, size = 16 }: BookmarkMarkProps) {
  return (
    <View style={[styles.mark, active && styles.markOn]}>
      <Ionicons
        color={active ? colors.accent : colors.textMuted}
        name={locked ? 'lock-closed-outline' : active ? 'bookmark' : 'bookmark-outline'}
        size={size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  markOn: {
    backgroundColor: 'rgba(212, 168, 75, 0.09)',
    borderColor: 'rgba(212, 168, 75, 0.32)',
  },
});
