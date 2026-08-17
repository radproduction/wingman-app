import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Stand-in for a tab whose screens are not built yet. Uses the empty-state voice
 * ("an invitation, never a blank"). Replace each with the real screen as you
 * work down the component inventory's build order.
 */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  const { theme, palette } = useTheme();
  return (
    <Screen ground="panel">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.space['8'] }}>
        <Text style={{ color: palette.ink, fontSize: 19 }}>{title}</Text>
        <Text style={{ color: palette.muted, fontSize: 13.5, textAlign: 'center' }}>
          {note ?? 'This screen is next on the build list.'}
        </Text>
      </View>
    </Screen>
  );
}
