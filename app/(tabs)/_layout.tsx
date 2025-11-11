import { useThemeController } from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_BASE_HEIGHT = 60;
const TAB_BAR_BOTTOM_PADDING = 12;

const TAB_BAR_THEMES = {
  light: {
    background: '#FFFFFF',
    border: 'rgba(0,0,0,0.06)',
    active: '#00AEEF',
    inactive: '#7A7F8C',
    shadow: '#000',
  },
  dark: {
    background: '#0E1117',
    border: 'rgba(255,255,255,0.08)',
    active: '#00AEEF',
    inactive: '#8D94A1',
    shadow: '#000',
  },
} as const;

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName } = useThemeController();
  const palette = TAB_BAR_THEMES[themeName];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: palette.active,
        tabBarInactiveTintColor: palette.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 6,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
          paddingBottom: Math.max(insets.bottom, TAB_BAR_BOTTOM_PADDING),
          paddingTop: 10,
          shadowColor: palette.shadow,
          shadowOpacity: 0.35,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 16,
          elevation: 30,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: t('operations'),
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('notifications'),
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
