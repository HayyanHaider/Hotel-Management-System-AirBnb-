import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const HotelOwnerDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'hotel_owner') {
      navigate('/login');
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome Hotel Owner, {user.name}!</h1>
        <p>Manage your properties and grow your hospitality business</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon">🏨</div>
            <h3>My Properties</h3>
            <p>View and manage all your listed properties</p>
            <button className="card-button">View Properties</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">➕</div>
            <h3>Add New Property</h3>
            <p>List a new property to expand your portfolio</p>
            <button className="card-button">Add Property</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📋</div>
            <h3>Reservations</h3>
            <p>Manage incoming bookings and guest requests</p>
            <button className="card-button">View Reservations</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💬</div>
            <h3>Guest Messages</h3>
            <p>Communicate with your guests and respond to inquiries</p>
            <button className="card-button">View Messages</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⭐</div>
            <h3>Reviews & Ratings</h3>
            <p>Monitor guest feedback and improve your service</p>
            <button className="card-button">View Reviews</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💰</div>
            <h3>Earnings</h3>
            <p>Track your income and payout information</p>
            <button className="card-button">View Earnings</button>
          </div>
        </div>

        <div className="dashboard-stats">
          <h3>Your Business Overview</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Active Properties</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Total Bookings</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Pending Requests</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">$0</span>
              <span className="stat-label">Monthly Earnings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelOwnerDashboard;
