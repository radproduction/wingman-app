import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthShell, BigButton, Field } from '../components/authUi';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

type Stage = 'phone' | 'otp';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const phoneValid = phone.replace(/[^0-9]/g, '').length >= 8;

  async function requestOtp() {
    setBusy(true); setErr(null); setDevCode(null);
    try {
      const r = await api.requestOtp(phone);
      setDevCode(r.dev_code ?? null);
      setStage('otp');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send code');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true); setErr(null);
    try {
      const r = await api.verifyOtp(phone, code);
      signIn(r.token, r.user);
      navigate(r.user.onboarding_complete ? '/' : '/onboarding', { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex-1 flex flex-col justify-center py-10">
        <div className="flex items-center gap-3 mb-8">
          <img src="/wingman.png" alt="Wingman" className="w-11 h-11 rounded-xl" />
          <div>
            <p className="text-title text-white leading-none">Wingman</p>
            <p className="text-caption text-gray mt-1">Your AI chief of staff on WhatsApp</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-title text-white mb-1">Sign in</h1>
              <p className="text-body text-gray mb-6">
                Enter your WhatsApp number and we’ll send you a verification code.
              </p>
              <Field
                label="Phone number"
                value={phone}
                onChange={setPhone}
                placeholder="+971 50 123 4567"
                type="tel"
                inputMode="tel"
                autoFocus
              />
              {err && <p className="text-caption text-danger mt-3 px-1">{err}</p>}
              <div className="mt-6">
                <BigButton onClick={requestOtp} disabled={!phoneValid || busy}>
                  {busy ? 'Sending…' : 'Send code'}
                </BigButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-title text-white mb-1">Enter code</h1>
              <p className="text-body text-gray mb-6">
                We sent a 6-digit code to <span className="text-white">{phone}</span>.
              </p>
              <Field
                value={code}
                onChange={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />
              {devCode && (
                <p className="text-caption text-accent mt-3 px-1">
                  Dev mode: your code is <span className="font-bold">{devCode}</span>
                </p>
              )}
              {err && <p className="text-caption text-danger mt-3 px-1">{err}</p>}
              <div className="mt-6 flex flex-col gap-3">
                <BigButton onClick={verify} disabled={code.length !== 6 || busy}>
                  {busy ? 'Verifying…' : 'Verify & continue'}
                </BigButton>
                <button
                  onClick={() => { setStage('phone'); setCode(''); setErr(null); }}
                  className="text-caption text-gray"
                >
                  ← Use a different number
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="text-caption text-gray text-center pb-4">
        By continuing you agree to let Wingman message you on WhatsApp.
      </p>
    </AuthShell>
  );
}
