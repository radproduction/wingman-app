import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../theme/Icon';
import { HomeScreen } from '../screens/HomeScreen';
import { Placeholder } from '../screens/Placeholder';
import {
  Home01Icon,
  Calendar01Icon,
  Mail01Icon,
  Task01Icon,
  DashboardSquare01Icon,
  type IconSvgElement,
} from '../../wingman-ds/icons/duotone';

/**
 * The five tabs are SIBLINGS (foundations §10): home, calendar, email, tasks,
 * more. They rise-and-fade between each other, never slide — sideways travel is
 * reserved for going a level deeper.
 *
 * Detail layers (a screen opened from a tab) are NOT tabs: each becomes a
 * native-stack push WITHIN its tab that slides in, carries its own back bar, and
 * hides this tab bar. Wrap a tab's component in a native-stack and push detail
 * screens onto it as you build them — see mobile/README.md. Do not put detail
 * screens in one global stack; that changes the product's structure.
 */
const Tab = createBottomTabNavigator();

const CalendarScreen = () => <Placeholder title="Calendar" note="Your schedule and Wingman's brief live here." />;
const EmailScreen = () => <Placeholder title="Email" note="Triaged mail: urgent, needs reply, FYI." />;
const TasksScreen = () => <Placeholder title="Tasks" note="What's due, and what Wingman is handling." />;
const MoreScreen = () => <Placeholder title="More" note="Modules, connections, and settings." />;

export function AppTabs() {
  const { theme, palette } = useTheme();

  const tabIcon = (glyph: IconSvgElement) => ({ focused }: { focused: boolean }) => (
    <Icon glyph={glyph} size={theme.chipIcon.md} color={focused ? palette.accent : palette.muted} />
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.cardLine,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon(Home01Icon) }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarIcon: tabIcon(Calendar01Icon) }} />
      <Tab.Screen name="Email" component={EmailScreen} options={{ tabBarIcon: tabIcon(Mail01Icon) }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: tabIcon(Task01Icon) }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarIcon: tabIcon(DashboardSquare01Icon) }} />
    </Tab.Navigator>
  );
}
