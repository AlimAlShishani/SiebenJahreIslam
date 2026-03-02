import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import BuchstabenUebersicht from './pages/BuchstabenUebersicht';
import LearnLevel from './pages/LearnLevel';
import Admin from './pages/Admin';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={null} />
              <Route path="learn" element={null} />
              <Route path="profile" element={null} />
              <Route path="learn/alphabet" element={<BuchstabenUebersicht />} />
              <Route path="learn/:levelId" element={<LearnLevel />} />
              <Route path="admin" element={<Admin />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
