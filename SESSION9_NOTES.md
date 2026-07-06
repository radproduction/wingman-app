# Session 9 progress — Wingman re-architecture

## Done
- Phase 1: DB schema + auth/users repos (verified)
- Phase 2: OTP auth backend
  - src/api/authRoutes.js (request-otp, verify-otp, logout, me)
  - src/api/middleware/auth.js (readToken, requireAuth, attachUserOptional, hydrateFromToken)
  - server.js mounts /api/auth then attachUserOptional on /api
  - dashboard.js: resolveUser prefers req.user; added PATCH /me + /settings, POST /onboarding/complete; GET /me exposes onboarding fields
  - config.js: auth block + wingmanNumber
  - scripts/test-auth-flow.js (12 assertions PASS)
- Phase 3: separate-number WhatsApp model + gating
  - engine/conversation.js: bounce unregistered/un-onboarded; skill-gated intents; removed WA onboarding
  - whatsapp/client.js: registered-user gating, groups/fromMe ignored, bounce logging
  - src/services/proactiveGate.js (NEW): level+skill rules; allows(user, job), eligibleUsers
  - Gating applied in morningBriefing, billAlerts, deliveryAlerts, endOfDayWrap, followupTracker, meetingPrep, travelAssistant, engine/taskIntents
  - systemPrompt.js: per-user tone + communication_style injected
  - scripts/test-gating.js (PASS)

## Phase 4 (in progress)
- client: installed framer-motion
- types.ts: Me extended + RequestOtpResponse, VerifyOtpResponse, SettingsPatch, ProactivenessLevel/Tone/CommunicationStyle/Skill
- lib/api.ts: token storage (localStorage wingman_token), Bearer injection, auth+settings methods, ApiError
- lib/auth.tsx: AuthProvider/useAuth (user, authed, onboarded, signIn, signOut, updateUser, refresh)
- components/authUi.tsx: AuthShell, BigButton, Field, OptionCards, ToggleRow, StepProgress
- pages/Login.tsx: phone -> OTP -> signIn -> route to /onboarding or /
- pages/Onboarding.tsx: 10-step wizard (welcome, what-i-do, whatsapp, name, timezone, work hours + briefing/debrief, proactiveness, skills, personality, done)

### REMAINING Phase 4
- Wrap main.tsx in <AuthProvider>
- App.tsx: add /login and /onboarding routes; AuthGuard that redirects; hide Sidebar/BottomNav on auth routes
- Sidebar.tsx: dynamic "Signed in as {name}" + sign out

## Phase 5
- Settings.tsx: proactiveness selector, briefing/debrief time pickers, skills toggles, tone + style, connected accounts, save via api.updateSettings; sign out

## Phase 6
- Ensure Google OAuth connect uses user's real phone (Settings connect buttons)
- Rebuild client (pnpm build), self-test end-to-end, deliver

## Design tokens: bg #020633, card #0a1050, accent #8b8fff, success #66ff88, warning #ffaa00, danger #ff6b6b, max-w-mobile 480px
## Dev: DISABLE_WHATSAPP=1 exposes dev_code in request-otp response (NODE_ENV!=production)
