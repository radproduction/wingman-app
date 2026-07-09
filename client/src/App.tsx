import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { useAuth } from './lib/auth';
import { Loading } from './components/ui';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Email from './pages/Email';
import Tasks from './pages/Tasks';
import Bills from './pages/Bills';
import Deliveries from './pages/Deliveries';
import Travel from './pages/Travel';
import HealthPage from './pages/Health';
import People from './pages/People';
import Settings from './pages/Settings';

/** The authenticated app shell (sidebar + bottom nav + routed pages). */
function AppShell() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex justify-center">
        <main
          className="w-full max-w-mobile lg:max-w-3xl min-h-screen lg:pb-8 relative"
          style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Keyed by route so a crash on one page clears when navigating away. */}
          <ErrorBoundary key={location.pathname}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/email" element={<Email />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/deliveries" element={<Deliveries />} />
              <Route path="/travel" element={<Travel />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/people" element={<People />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

/** Routes the user to the right place based on auth + onboarding state. */
function Root() {
  const { loading, authed, onboarded } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Not signed in → only /login is reachable.
  if (!authed) {
    if (location.pathname !== '/login') return <Navigate to="/login" replace />;
    return <Login />;
  }

  // Signed in but on the login page → send them into the app/onboarding.
  if (location.pathname === '/login') {
    return <Navigate to={onboarded ? '/' : '/onboarding'} replace />;
  }

  // Signed in but not onboarded → force the wizard.
  if (!onboarded) {
    if (location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
    return <Onboarding />;
  }

  // Onboarded users shouldn't see the wizard again.
  if (location.pathname === '/onboarding') return <Navigate to="/" replace />;

  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}
