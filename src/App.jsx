import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CurrencyProvider } from './hooks/useCurrency';
import './i18n/config'; // Import i18n config
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Finances from './pages/Finances';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import Rotations from './pages/Rotations';
import CashFund from './pages/CashFund';
import Settings from './pages/Settings';
import AdminManagement from './pages/AdminManagement';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="finances" element={<Finances />} />
              <Route path="loans" element={<Loans />} />
              <Route path="reports" element={<Reports />} />
              <Route path="rotations" element={<Rotations />} />
              <Route path="cash-fund" element={<CashFund />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<AdminManagement />} />
              <Route
  path="subscription/success"
  element={<SubscriptionSuccess />}
/>

<Route
  path="subscription/cancel"
  element={<SubscriptionCancel />}
/>

            </Route>
          </Routes>
        </Router>
      </CurrencyProvider>
    </AuthProvider>
  );
}