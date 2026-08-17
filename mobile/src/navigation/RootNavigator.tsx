import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppTabs } from './AppTabs';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useTheme } from '../theme/ThemeProvider';
import { getToken } from '../lib/auth';
import { api } from '../api/client';

/**
 * Auth gate + first-run flow. A stored token the backend still accepts → the
 * app. Otherwise a new user walks the intro carousel, then signs in. Login is
 * kept out of the tab stack on purpose: it is not a screen you go back to.
 */
export function RootNavigator() {
  const { palette } = useTheme();
  const [state, setState] = useState<'loading' | 'onboarding' | 'login' | 'in'>('loading');

  const resolve = useCallback(async () => {
    const token = await getToken();
    if (!token) return setState('onboarding');
    try {
      await api.authMe(); // token still valid?
      setState('in');
    } catch {
      setState('onboarding');
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

  if (state === 'onboarding') return <OnboardingScreen onDone={() => setState('login')} />;
  if (state === 'login') return <LoginScreen onAuthed={resolve} />;
  return <AppTabs />;
}
