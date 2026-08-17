import React from 'react';
import { ScrollView, View, RefreshControl, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Screen scaffold (screen.md / foundations §10). The base every tab and detail
 * screen sits on: a safe-area frame on the ground colour, then a scrollable
 * panel that runs on the one 16 rhythm (side gutter, top inset, row gap all the
 * same step). Separation is tonal, never lined.
 */
export function Screen({
  children,
  scroll = true,
  onRefresh,
  refreshing = false,
  ground = 'canvas',
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  ground?: 'canvas' | 'panel';
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { theme, palette } = useTheme();
  const bg = ground === 'panel' ? palette.panel : palette.canvas;
  const pad = {
    paddingHorizontal: theme.space['16'],
    paddingTop: theme.space['16'],
    paddingBottom: theme.space['32'],
    gap: theme.space['16'],
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.muted} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
