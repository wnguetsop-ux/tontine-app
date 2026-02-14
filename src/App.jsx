import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CurrencyProvider } from './hooks/useCurrency';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n/config'; // Import i18n config

// Layout
import Layout from './components/layout/Layout';

// Public pages
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';

// Protected pages
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Finances from './pages/Finances';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import Rotations from './pages/Rotations';
import CashFund from './pages/CashFund';
import Settings from './pages/Settings';
import AdminManagement from './pages/AdminManagement';

// Optional pages (commentez si pas installés)
// import HelpCenter from './pages/HelpCenter';
// import NotificationSettings from './pages/NotificationSettings';

// Subscription pages
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  // Si user connecté, rediriger vers dashboard au lieu de landing
  return user ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <Router>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            
            <Route path="/login" element={<Login />} />
            
            <Route path="/about" element={<AboutPage />} />
            
            {/* Protected routes avec Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/rotations" element={<Rotations />} />
              <Route path="/cash-fund" element={<CashFund />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminManagement />} />
              
              {/* Décommentez si installés */}
              {/* <Route path="/help" element={<HelpCenter />} /> */}
              {/* <Route path="/notifications" element={<NotificationSettings />} /> */}
              
              {/* Subscription routes */}
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            </Route>

            {/* 404 - Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}