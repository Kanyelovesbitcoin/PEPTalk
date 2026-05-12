import { BlurView } from 'expo-blur';
import { router, Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';
import { hapticSelection } from '@/lib/utils/haptics';

const TABS = [
  { routeName: 'index', icon: 'sparkles-outline', activeIcon: 'sparkles', label: 'Today' },
  { routeName: 'ai', icon: 'flask-outline', activeIcon: 'flask', label: 'Peptides' },
  { routeName: 'library', icon: 'book-outline', activeIcon: 'book', label: 'Library' },
  { routeName: 'tracker', icon: 'stats-chart-outline', activeIcon: 'stats-chart', label: 'Progress' },
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
        <Ionicons name={iconName} size={focused ? 25 : 24} color={focused ? colors.accent : colors.textMuted} />
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      </View>
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
      hapticSelection();
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
  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  const openQuickLog = () => {
    hapticSelection();
    router.push({ pathname: '/(tabs)/tracker', params: { quickLog: '1' } });
  };

  return (
    <View style={[styles.barOuter, { paddingBottom: safeBottom }]}>
      <View style={styles.barBackground}>
        <BlurView intensity={72} style={StyleSheet.absoluteFill} tint="dark" />
      </View>
      <View style={styles.barInner}>
        {leftTabs.map((tab) => (
          <RouteTabButton config={tab} key={tab.routeName} props={props} />
        ))}
        <Pressable
          accessibilityLabel="Log an entry"
          accessibilityRole="button"
          onPress={openQuickLog}
          style={({ pressed }) => [styles.logTouch, pressed && styles.logPressed]}>
          <View style={styles.logButton}>
            <Ionicons color={colors.accentInk} name="add" size={25} />
          </View>
          <Text style={styles.logLabel}>Log</Text>
        </Pressable>
        {rightTabs.map((tab) => (
          <RouteTabButton config={tab} key={tab.routeName} props={props} />
        ))}
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

const TAB_BAR_HEIGHT = 70;

const styles = StyleSheet.create({
  barOuter: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 14,
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 20, 16, 0.96)',
    borderColor: colors.borderStrong,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  barInner: {
    alignItems: 'center',
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.accentSoft,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 58,
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    width: 58,
  },
  logLabel: {
    color: colors.accent,
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  logPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  logTouch: {
    alignItems: 'center',
    flex: 1,
    height: 76,
    justifyContent: 'flex-start',
    marginTop: -16,
    minHeight: 44,
    minWidth: 58,
  },
  tabTouch: {
    flex: 1,
    height: 54,
    minWidth: 44,
    minHeight: 44,
  },
  tabPressed: {
    opacity: 0.78,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: 24,
    height: 54,
    justifyContent: 'center',
    opacity: 0.72,
    paddingHorizontal: 8,
  },
  tabItemActive: {
    backgroundColor: 'rgba(212, 168, 75, 0.18)',
    opacity: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 13,
    marginTop: 3,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.accent,
  },
});
