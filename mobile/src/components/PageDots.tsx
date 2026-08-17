import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/**
 * The pager under the intro carousel (page-dots.md). The active dot stretches
 * into a short bar and takes the accent, so position reads by shape as well as
 * colour. (Width animation is a motion-phase polish; the shape/colour are here.)
 */
export function PageDots({ count, index, onPick }: { count: number; index: number; onPick?: (i: number) => void }) {
  const { theme, palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.space['8'], alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === index;
        const dot = (
          <View
            style={{
              width: active ? 18 : 6,
              height: 6,
              borderRadius: theme.radius.pill,
              backgroundColor: active ? palette.accent : palette.track,
            }}
          />
        );
        return onPick ? (
          <Pressable key={i} onPress={() => onPick(i)} hitSlop={8}>
            {dot}
          </Pressable>
        ) : (
          <View key={i}>{dot}</View>
        );
      })}
    </View>
  );
}
