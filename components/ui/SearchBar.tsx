import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
}

export function SearchBar({ placeholder = 'Search', value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1D1D1D',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  input: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingVertical: 15,
  },
});
