import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Signup from './components/Signup';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import HotelOwnerDashboard from './components/HotelOwnerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
// Customer components
import BrowseHotels from './components/BrowseHotels';
import HotelDetails from './components/HotelDetails';
import Favorites from './components/Favorites';
import CreateBooking from './components/CreateBooking';
import Payment from './components/Payment';
import BookingHistory from './components/BookingHistory';
import LeaveReview from './components/LeaveReview';
// Hotel Owner components
import ManageHotelProfile from './components/ManageHotelProfile';
import ManageCoupons from './components/ManageCoupons';
import OwnerBookingManagement from './components/OwnerBookingManagement';
import ReplyToReviews from './components/ReplyToReviews';
import EarningsDashboard from './components/EarningsDashboard';
import './App.css';

function AppContent() {
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyStoredToken = async () => {
      const token = sessionStorage.getItem('token');
      const userData = sessionStorage.getItem('user');

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
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.dispatchEvent(new Event('userStatusChanged'));
          } else {
            const data = await response.json();
            if (!data.success || !data.valid) {
              // Token verification failed
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('user');
              window.dispatchEvent(new Event('userStatusChanged'));
            } else {
              // Update user data in case it changed
              sessionStorage.setItem('user', JSON.stringify(data.user));
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
        <Route path="/" element={<BrowseHotels />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        
        {/* Customer Routes */}
        <Route 
          path="/customer-dashboard" 
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/browse-hotels" element={<BrowseHotels />} />
        <Route path="/hotel/:hotelId" element={<HotelDetails />} />
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute requiredRole="customer">
              <Favorites />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/booking/:hotelId" 
          element={
            <ProtectedRoute requiredRole="customer">
              <CreateBooking />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment/:bookingId" 
          element={
            <ProtectedRoute requiredRole="customer">
              <Payment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/booking-history" 
          element={
            <ProtectedRoute requiredRole="customer">
              <BookingHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/review/:bookingId" 
          element={
            <ProtectedRoute requiredRole="customer">
              <LeaveReview />
            </ProtectedRoute>
          } 
        />
        
        {/* Hotel Owner Routes */}
        <Route 
          path="/hotel_owner-dashboard" 
          element={
            <ProtectedRoute requiredRole="hotel_owner">
              <HotelOwnerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manage-hotel-profile" 
          element={
            <ProtectedRoute requiredRole="hotel_owner">
              <ManageHotelProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manage-coupons" 
          element={
            <ProtectedRoute requiredRole="hotel_owner">
              <ManageCoupons />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner-bookings" 
          element={
            <ProtectedRoute requiredRole="hotel_owner">
              <OwnerBookingManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reply-reviews" 
          element={
            <ProtectedRoute requiredRole="hotel_owner">
              <ReplyToReviews />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/earnings-dashboard" 
          element={
            <ProtectedRoute requiredRole="hotel_owner">
              <EarningsDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
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
