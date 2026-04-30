import { BlurView } from 'expo-blur';
import { router, Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

const TABS = [
  { routeName: 'index', icon: 'home-outline', activeIcon: 'home', label: 'Today' },
  { routeName: 'ai', icon: 'flask-outline', activeIcon: 'flask', label: 'Stack' },
  { routeName: 'tracker', icon: 'reader-outline', activeIcon: 'reader', label: 'Log' },
  { routeName: 'library', icon: 'library-outline', activeIcon: 'library', label: 'Library' },
] as const;

type TabRouteName = (typeof TABS)[number]['routeName'];

interface TabItemConfig {
  routeName: TabRouteName;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
}

function TabItem({ focused, iconName, label }: {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <View style={styles.tabContent}>
        <Ionicons name={iconName} size={31} color={focused ? colors.accent : colors.text} />
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function CameraButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.cameraSlot}>
      <Pressable
        accessibilityLabel="Capture specimen"
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.cameraBtn, pressed && styles.cameraBtnPressed]}>
        <Ionicons color={colors.accentInk} name="camera" size={32} />
      </Pressable>
    </View>
  );
}

function RouteTabButton({ config, props }: { config: TabItemConfig; props: BottomTabBarProps }) {
  const { descriptors, navigation, state } = props;
  const routeIndex = state.routes.findIndex((route) => route.name === config.routeName);
  const route = state.routes[routeIndex];

  if (!route) return null;

  const isFocused = state.index === routeIndex;
  const { options } = descriptors[route.key];

  const onPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const onLongPress = () => {
    navigation.emit({ type: 'tabLongPress', target: route.key });
  };

  return (
    <Pressable
      accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.tabTouch, pressed && styles.tabPressed]}>
      <TabItem focused={isFocused} iconName={isFocused ? config.activeIcon : config.icon} label={config.label} />
    </Pressable>
  );
}

function CustomTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.barOuter, { paddingBottom: safeBottom }]}>
      <View style={styles.barBackground}>
        <BlurView intensity={72} style={StyleSheet.absoluteFill} tint="dark" />
      </View>
      <View style={styles.barInner}>
        <RouteTabButton config={TABS[0]} props={props} />
        <RouteTabButton config={TABS[1]} props={props} />
        <CameraButton onPress={() => router.push('/scan')} />
        <RouteTabButton config={TABS[2]} props={props} />
        <RouteTabButton config={TABS[3]} props={props} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="ai" />
      <Tabs.Screen name="tracker" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="favorites" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const TAB_BAR_HEIGHT = 64;
const CAMERA_SIZE = 70;

const styles = StyleSheet.create({
  barOuter: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.46,
    shadowRadius: 22,
    elevation: 12,
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 19, 14, 0.96)',
    borderColor: colors.border,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  barInner: {
    alignItems: 'center',
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  tabTouch: {
    flex: 1,
    height: 58,
    minWidth: 44,
    minHeight: 44,
  },
  tabPressed: {
    opacity: 0.78,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: 20,
    height: 58,
    justifyContent: 'center',
    opacity: 0.72,
  },
  tabItemActive: {
    backgroundColor: colors.background,
    opacity: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.accent,
  },
  cameraSlot: {
    alignItems: 'center',
    flex: 1,
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  cameraBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.accentSoft,
    borderRadius: 999,
    borderWidth: 4,
    height: CAMERA_SIZE,
    justifyContent: 'center',
    marginTop: -34,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    width: CAMERA_SIZE,
    elevation: 14,
  },
  cameraBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
