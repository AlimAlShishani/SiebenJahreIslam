import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { ThemeProvider } from './context/ThemeContext';
import { RecordingProvider } from './context/RecordingContext';
import { Layout } from './components/Layout';
import { useVersionCheck } from './hooks/useVersionCheck';
import { VersionCheckModal } from './components/VersionCheckModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import Login from './pages/Login';
import Datenschutz from './pages/Datenschutz';
import Entwickler from './pages/Entwickler';
import AndroidNutzung from './pages/AndroidNutzung';
import Quran from './pages/Quran';
import QuranMenu from './pages/QuranMenu';
import QuranReader from './pages/QuranReader';
import Learn from './pages/Learn';
import BuchstabenUebersicht from './pages/BuchstabenUebersicht';
import LearnLevel from './pages/LearnLevel';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';

function AppContent() {
  const { updateAvailable, latestVersion, dismiss, reload } = useVersionCheck();

  return (
    <>
      {updateAvailable && (
        <VersionCheckModal
          latestVersion={latestVersion}
          onDismiss={dismiss}
          onReload={reload}
        />
      )}
      <OfflineProvider>
      <AuthProvider>
      <ThemeProvider>
      <RecordingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/entwickler" element={<Entwickler />} />
          <Route path="/android-nutzung" element={<AndroidNutzung />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/hatim" replace />} />
              <Route path="/hatim" element={<Quran />} />
              <Route path="/quran" element={<QuranMenu />} />
              <Route path="/quran/read" element={<QuranReader />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/alphabet" element={<BuchstabenUebersicht />} />
              <Route path="/learn/:levelId" element={<LearnLevel />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/admin" element={<AdminRoute />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </RecordingProvider>
      </ThemeProvider>
    </AuthProvider>
    </OfflineProvider>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
