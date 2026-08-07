import { useState, useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './hooks/useAuth';
import { AdminUser } from './types';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import StudentsPage from './pages/StudentsPage';
import ProcessingPage from './pages/ProcessingPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/Layout';

// =============================================
// Auth Guard — Allows direct access without mandatory login
// =============================================
function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Rehydrate or set default session
  useEffect(() => {
    const storedToken = localStorage.getItem('sp_token');
    const storedUser = localStorage.getItem('sp_admin');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AdminUser);
      } catch {
        localStorage.removeItem('sp_token');
        localStorage.removeItem('sp_admin');
      }
    } else {
      // Default session so visitors don't hit a login wall
      const defaultToken = 'guest_admin_token';
      const defaultUser: AdminUser = {
        id: 'admin-default-001',
        email: 'admin@shieldprotocol.com',
        name: 'Shield Admin',
      };
      localStorage.setItem('sp_token', defaultToken);
      localStorage.setItem('sp_admin', JSON.stringify(defaultUser));
      setToken(defaultToken);
      setUser(defaultUser);
    }
  }, []);

  const login = (newToken: string, newUser: AdminUser) => {
    localStorage.setItem('sp_token', newToken);
    localStorage.setItem('sp_admin', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_admin');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0f172a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="processing" element={<ProcessingPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
