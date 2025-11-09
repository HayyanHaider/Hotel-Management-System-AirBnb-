import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const token = sessionStorage.getItem('token');
  const userData = sessionStorage.getItem('user');
  
  // Check if user is logged in
  if (!token || !userData) {
    return <Navigate to="/login" replace />;
  }
  
  // If a specific role is required, check if user has that role
  if (requiredRole) {
    const user = JSON.parse(userData);
    if (user.role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

export default ProtectedRoute;
