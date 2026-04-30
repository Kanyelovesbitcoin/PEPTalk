import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  SourceSerif4_300Light,
  SourceSerif4_400Regular,
  useFonts,
} from '@expo-google-fonts/source-serif-4';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { migrateLegacyKeys } from '@/lib/constants/storage';
import { FavoritesProvider } from '@/lib/hooks/useFavorites';
import { ProProvider } from '@/lib/hooks/usePro';
import { QuizProvider } from '@/lib/hooks/useQuiz';
import { TrackerProvider } from '@/lib/hooks/useTracker';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.backgroundAlt,
    border: colors.border,
    primary: colors.accent,
    text: colors.text,
    notification: colors.accent,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SourceSerif4_300Light,
    SourceSerif4_400Regular,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    migrateLegacyKeys();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <FavoritesProvider>
          <ProProvider>
            <QuizProvider>
              <TrackerProvider>
                <StatusBar style="light" />
                  <Stack
                    screenOptions={{
                      animation: 'slide_from_right',
                      contentStyle: { backgroundColor: colors.background },
                      headerShown: false,
                    }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="goal/[goalId]" />
                    <Stack.Screen name="compound/[compoundId]" />
                    <Stack.Screen name="quiz/index" />
                    <Stack.Screen name="quiz/[step]" />
                    <Stack.Screen name="quiz/results" />
                    <Stack.Screen
                      name="scan"
                      options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                      }}
                    />
                    <Stack.Screen
                      name="profile-modal"
                      options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                      }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>
              </TrackerProvider>
            </QuizProvider>
          </ProProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
