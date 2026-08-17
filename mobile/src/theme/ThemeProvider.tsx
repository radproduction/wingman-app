import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { theme, type ThemeMode } from '../../wingman-ds/theme/theme';

/**
 * The single source of colour for the app. Every screen reads its palette from
 * here — never a hardcoded hex — so one switch re-themes the whole app, exactly
 * as the design system requires ("Dark is a re-point, not a second design").
 *
 * `preference` is the user's in-app choice: 'system' follows the OS, 'light' /
 * 'dark' force it. The resolved `mode` + `palette` are what components consume.
 */
type Preference = 'system' | ThemeMode;

type ThemeContextValue = {
  theme: typeof theme;
  palette: (typeof theme.palette)[ThemeMode];
  mode: ThemeMode;
  preference: Preference;
  setPreference: (p: Preference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<Preference>('system');

  const value = useMemo<ThemeContextValue>(() => {
    const mode: ThemeMode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return { theme, palette: theme.palette[mode], mode, preference, setPreference };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
