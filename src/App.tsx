import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
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

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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
              <Route path="/admin" element={<AdminRoute />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
