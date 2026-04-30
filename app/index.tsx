import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { STORAGE_KEYS } from '@/lib/constants/storage';

export default function IndexScreen() {
  const [target, setTarget] = useState<'/onboarding' | '/(tabs)' | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const hasOnboarded = await AsyncStorage.getItem(STORAGE_KEYS.hasOnboarded);
      setTarget(hasOnboarded === 'true' ? '/(tabs)' : '/onboarding');
    }

    checkOnboarding();
  }, []);

  if (target) {
    return <Redirect href={target} />;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
