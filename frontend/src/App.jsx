import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Home from './components/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import HotelOwnerDashboard from './components/HotelOwnerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppContent() {
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyStoredToken = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/verify-token', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('userStatusChanged'));
          } else {
            const data = await response.json();
            if (!data.success || !data.valid) {
              // Token verification failed
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.dispatchEvent(new Event('userStatusChanged'));
            } else {
              // Update user data in case it changed
              localStorage.setItem('user', JSON.stringify(data.user));
              window.dispatchEvent(new Event('userStatusChanged'));
            }
          }
        } catch (error) {
          console.error('Token verification error:', error);
          // On network error, keep user logged in (don't logout on server/network issues)
          // Only logout if the token is actually invalid (handled above)
        }
      }
      
      setIsVerifying(false);
    };

    verifyStoredToken();
  }, []);

  if (isVerifying) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/customer-dashboard" 
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hotel_owner-dashboard" 
          element={
            <ProtectedRoute requiredRole="hotel_owner">
              <HotelOwnerDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
