import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
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
        <h1>Welcome Admin, {user.name}!</h1>
        <p>Manage the entire Airbnb platform from here</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>User Management</h3>
            <p>View, edit, and manage all user accounts and permissions</p>
            <button className="card-button">Manage Users</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🏢</div>
            <h3>Property Management</h3>
            <p>Oversee all property listings and approve new submissions</p>
            <button className="card-button">Manage Properties</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Analytics & Reports</h3>
            <p>View platform statistics and generate detailed reports</p>
            <button className="card-button">View Analytics</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚙️</div>
            <h3>System Settings</h3>
            <p>Configure platform settings and system preferences</p>
            <button className="card-button">System Settings</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🛡️</div>
            <h3>Security & Moderation</h3>
            <p>Monitor platform security and moderate content</p>
            <button className="card-button">Security Center</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💰</div>
            <h3>Financial Overview</h3>
            <p>Track revenue, commissions, and financial metrics</p>
            <button className="card-button">Financial Reports</button>
          </div>
        </div>

        <div className="dashboard-stats">
          <h3>Platform Overview</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Active Properties</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Total Bookings</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">$0</span>
              <span className="stat-label">Revenue (Monthly)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
