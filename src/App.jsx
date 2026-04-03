import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Policy from './pages/Policy';
import PremiumCalc from './pages/PremiumCalc';
import Claims from './pages/Claims';
import WeatherMonitor from './pages/WeatherMonitor';
import './index.css';

function ProtectedRoute({ children }) {
  const { user } = useApp();
  return user ? children : <Navigate to="/register" replace />;
}

function AppRoutes() {
  const { user } = useApp();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/policy" element={<ProtectedRoute><Policy /></ProtectedRoute>} />
      <Route path="/premium" element={<ProtectedRoute><PremiumCalc /></ProtectedRoute>} />
      <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
      <Route path="/weather" element={<ProtectedRoute><WeatherMonitor /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}