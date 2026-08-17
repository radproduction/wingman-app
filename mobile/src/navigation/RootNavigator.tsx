import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppTabs } from './AppTabs';
import { LoginScreen } from '../screens/LoginScreen';
import { useTheme } from '../theme/ThemeProvider';
import { getToken } from '../lib/auth';
import { api } from '../api/client';

/**
 * Auth gate. A stored token that the backend still accepts → the app. Otherwise
 * → login. Kept out of the tab stack on purpose: login is not a screen you can
 * navigate back to once you are in.
 */
export function RootNavigator() {
  const { palette } = useTheme();
  const [state, setState] = useState<'loading' | 'in' | 'out'>('loading');

  const resolve = useCallback(async () => {
    const token = await getToken();
    if (!token) return setState('out');
    try {
      await api.authMe(); // token still valid?
      setState('in');
    } catch {
      setState('out');
    }
  }, []);

  useEffect(() => {
    resolve();
  }, [resolve]);

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas }}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return state === 'in' ? <AppTabs /> : <LoginScreen onAuthed={resolve} />;
}
