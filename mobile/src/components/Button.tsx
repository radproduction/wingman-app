import React from 'react';
import { Pressable, Text, View, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/**
 * The app's ONE button (button.md). Seven tones over one pill, two sizes, and
 * nothing else — a new kind of action is a tone here, never a new button. Every
 * colour, size and radius reads from the theme; nothing is hardcoded.
 *
 * Motion phase animates the 0.99 scale dip (150ms, smooth-out); for now the dip
 * is applied instantly on press, which is faithful in look if not yet in timing.
 */
export type ButtonTone = 'primary' | 'quiet' | 'outline' | 'soft' | 'whatsapp' | 'danger' | 'warn';

interface ButtonProps {
  label: string;
  tone?: ButtonTone;
  small?: boolean;
  full?: boolean;
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Button({
  label,
  tone = 'primary',
  small = false,
  full = false,
  leadingIcon,
  disabled = false,
  onPress,
  accessibilityLabel,
}: ButtonProps) {
  const { theme, palette } = useTheme();
  const p = palette;

  // fill / label / ring / press behaviour per tone (button.md § Tones)
  const tones: Record<ButtonTone, { bg: string; fg: string; ring?: string; pressBg?: string; pressScale?: boolean }> = {
    primary: { bg: p.accent, fg: p.onAccent, pressBg: p.accentDeep },
    quiet: { bg: p.cardTonal, fg: p.ink, pressBg: p.track },
    outline: { bg: 'transparent', fg: p.accentDeep, ring: p.accent },
    soft: { bg: p.accentTonal, fg: p.accentDeep, pressScale: true },
    whatsapp: { bg: p.okTonal, fg: p.ok, pressScale: true },
    danger: { bg: p.chipRose, fg: p.alert, pressScale: true },
    warn: { bg: p.chipSand, fg: p.warn, pressBg: p.warnTonal },
  };
  const t = tones[tone];

  const fontSize = small ? 13 : 15;
  const nudge = fontSize * theme.type.pillNudgeEm; // optical-centre sink
  const lineHeight = fontSize * theme.type.pillLine;

  const padTop = (small ? theme.space['8'] : theme.space['16']) + nudge;
  const padBottom = (small ? theme.space['8'] : theme.space['16']) - nudge;
  const padSide = full ? theme.space['16'] : small ? theme.space['16'] : theme.space['24'];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={small ? 8 : 0}
      style={({ pressed }): StyleProp<ViewStyle> => {
        const bg = disabled ? p.cardTonal : pressed && t.pressBg ? t.pressBg : t.bg;
        return {
          alignSelf: full ? 'stretch' : 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space['8'],
          backgroundColor: bg,
          borderRadius: theme.radius.pill,
          borderWidth: t.ring ? 1.5 : 0,
          borderColor: t.ring ?? 'transparent',
          paddingTop: padTop,
          paddingBottom: padBottom,
          paddingLeft: padSide,
          paddingRight: padSide,
          transform: [{ scale: !disabled && pressed && t.pressScale ? 0.99 : 1 }],
        };
      }}
    >
      {leadingIcon ? <View>{leadingIcon}</View> : null}
      <Text
        numberOfLines={1}
        style={{
          color: disabled ? p.muted : t.fg,
          fontSize,
          lineHeight,
          fontWeight: '500',
          ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
