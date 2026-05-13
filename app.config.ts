import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GlowPep',
  slug: 'glowpep',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/glowpep-app-icon.png',
  scheme: 'glowpep',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/images/glowpep-app-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0907',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.glowpep.app',
    buildNumber: '6',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    versionCode: 6,
    adaptiveIcon: {
      foregroundImage: './assets/images/glowpep-app-icon.png',
      backgroundColor: '#0A0907',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'server',
    favicon: './assets/images/glowpep-app-icon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        color: '#D4A84B',
        defaultChannel: 'routine-reminders',
      },
    ],
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? '',
    apiClientToken: process.env.EXPO_PUBLIC_API_CLIENT_TOKEN ?? '',
    revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? process.env.REVENUECAT_PUBLIC_SDK_KEY ?? '',
    revenueCatEntitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? process.env.REVENUECAT_ENTITLEMENT_ID ?? 'glowpep_pro',
    appStoreReviewUrl: process.env.EXPO_PUBLIC_APP_STORE_REVIEW_URL ?? '',
    eas: {
      projectId: '2f526879-a645-4c6b-a813-410e3399aec8',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
