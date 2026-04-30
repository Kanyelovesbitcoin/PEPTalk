import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GlowPep',
  slug: 'glowpep',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/clear-logo.png',
  scheme: 'glowpep',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0907',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.glowpep.app',
    usesIcloudStorage: true,
    entitlements: {
      'com.apple.developer.icloud-container-identifiers': ['iCloud.com.glowpep.app'],
      'com.apple.developer.icloud-services': ['CloudKit', 'CloudDocuments'],
      'com.apple.developer.ubiquity-kvstore-identifier': '$(TeamIdentifierPrefix)com.glowpep.app',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0A0907',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow GlowPep to use your camera for three-angle face scans.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow GlowPep to use existing photos for face scans.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#00FF88',
        defaultChannel: 'protocol-reminders',
      },
    ],
  ],
  extra: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? '',
    revenueCatApiKey: process.env.REVENUECAT_API_KEY ?? '',
    eas: {
      projectId: '2f526879-a645-4c6b-a813-410e3399aec8',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
