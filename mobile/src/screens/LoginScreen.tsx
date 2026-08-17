import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { api, ApiError } from '../api/client';

/**
 * Phone + one-time-code login. The code is delivered to WhatsApp by the SAME
 * backend the web app uses, so nothing new is needed server-side. On success the
 * token is stored (SecureStore) and onAuthed() lets the root re-resolve.
 */
export function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const { theme, palette } = useTheme();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = {
    backgroundColor: palette.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: palette.cardLine,
    color: palette.ink,
    fontSize: 17,
    paddingVertical: theme.space['12'],
    paddingHorizontal: theme.space['16'],
  } as const;

  async function requestCode() {
    setError(null);
    setBusy(true);
    try {
      await api.requestOtp(phone.trim());
      setStep('code');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send the code. Check the number.');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError(null);
    setBusy(true);
    try {
      await api.verifyOtp(phone.trim(), code.trim());
      onAuthed();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That code did not work.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.space['16'] }}>
        <Text style={{ color: palette.ink, fontSize: 30, lineHeight: 34, letterSpacing: -0.3 }}>
          Wingman
        </Text>
        <Text style={{ color: palette.muted, fontSize: 15, lineHeight: 22 }}>
          {step === 'phone'
            ? 'Enter your WhatsApp number and I will send you a code.'
            : `Enter the code I sent to ${phone}.`}
        </Text>

        {step === 'phone' ? (
          <TextInput
            style={field}
            value={phone}
            onChangeText={setPhone}
            placeholder="+92 300 1234567"
            placeholderTextColor={palette.muted}
            keyboardType="phone-pad"
            autoFocus
          />
        ) : (
          <TextInput
            style={field}
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            placeholderTextColor={palette.muted}
            keyboardType="number-pad"
            autoFocus
          />
        )}

        {error ? <Text style={{ color: palette.alert, fontSize: 13.5 }}>{error}</Text> : null}

        {step === 'phone' ? (
          <Button label="Send my code" full disabled={busy || phone.trim().length < 6} onPress={requestCode} />
        ) : (
          <Button label="Go to Wingman" full disabled={busy || code.trim().length < 4} onPress={verify} />
        )}
      </View>
    </Screen>
  );
}
