import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupType, setSignupType] = useState('customer');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'customer') {
      setSignupType('customer');
      setFormData(prev => ({ ...prev, role: 'customer' }));
    } else if (type === 'host') {
      setSignupType('host');
      setFormData(prev => ({ ...prev, role: 'hotel_owner' }));
    } else {
      setSignupType('all');
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.dispatchEvent(new Event('userStatusChanged'));
        navigate(`/${response.data.user.role}-dashboard`);
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Signup failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-10 col-md-7 col-lg-5">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-body p-4">
                {/* Logo */}
                <div className="text-center mb-3">
                  <svg width="40" height="40" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="mb-2" aria-hidden="true">
                    <path fill="#FF385C" d="M16 2c7.732 0 14 6.268 14 14s-6.268 14-14 14S2 23.732 2 16 8.268 2 16 2zm0 6a8 8 0 100 16 8 8 0 000-16z"/>
                  </svg>
                  <h2 className="h5 fw-bold text-dark mb-1">
                    {signupType === 'host' ? 'Become a Host' : 'Create Account'}
                  </h2>
                  <p className="text-muted small mb-0">
                    {signupType === 'host' 
                      ? 'Start your hosting journey with us' 
                      : 'Join our Airbnb community'
                    }
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row g-2">
                    <div className="col-md-6 mb-2">
                      <label htmlFor="name" className="form-label fw-semibold">First name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="Enter your first name"
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                    
                    <div className="col-md-6 mb-2">
                      <label htmlFor="email" className="form-label fw-semibold">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="Enter your email"
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                  </div>

                  <div className="mb-2">
                    <label htmlFor="phone" className="form-label fw-semibold">Phone number (optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {signupType === 'all' && (
                    <div className="mb-2">
                      <label htmlFor="role" className="form-label fw-semibold">Account Type</label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="customer">Customer</option>
                        <option value="hotel_owner">Hotel Owner</option>
                      </select>
                    </div>
                  )}

                  <div className="mb-2">
                    <label htmlFor="password" className="form-label fw-semibold">Password</label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-control ${errors.password ? 'is-invalid' : ''} pe-5`}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute top-50 translate-middle-y text-muted p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{border: 'none', background: 'none', right: '8px'}}
                      >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">Confirm password</label>
                    <div className="position-relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''} pe-5`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute top-50 translate-middle-y text-muted p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{border: 'none', background: 'none', right: '8px'}}
                      >
                        {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                  </div>

                  {errors.submit && (
                    <div className="alert alert-danger" role="alert">
                      {errors.submit}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-danger w-100 mb-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {signupType === 'host' ? 'Creating Host Account...' : 'Creating Account...'}
                      </>
                    ) : (
                      signupType === 'host' ? 'Become a Host' : 'Sign up'
                    )}
                  </button>
                </form>

                <div className="text-center mt-2">
                  <p className="text-muted mb-1 small">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none fw-semibold" style={{color: '#FF385C'}}>
                      Log in
                    </Link>
                  </p>
                  
                  {signupType === 'customer' && (
                    <p className="text-muted mb-0 small">
                      Want to become a host?{' '}
                      <Link to="/signup?type=host" className="text-decoration-none fw-semibold" style={{color: '#FF385C'}}>
                        Host Signup
                      </Link>
                    </p>
                  )}
                  
                  {signupType === 'host' && (
                    <p className="text-muted mb-0 small">
                      Want to sign up as a customer?{' '}
                      <Link to="/signup?type=customer" className="text-decoration-none fw-semibold" style={{color: '#FF385C'}}>
                        Customer Signup
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
