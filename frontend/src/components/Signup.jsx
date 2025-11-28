import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
      setFormData(prev => ({ ...prev, role: 'hotel' }));
    } else {
      setSignupType('all');
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors = {};
    let hasError = false;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      if (!hasError) {
        toast.error('Name is required');
        hasError = true;
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      if (!hasError) {
        toast.error('Email is required');
        hasError = true;
      }
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      if (!hasError) {
        toast.error('Please enter a valid email address');
        hasError = true;
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      if (!hasError) {
        toast.error('Password is required');
        hasError = true;
      }
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      if (!hasError) {
        toast.error('Password must be at least 6 characters');
        hasError = true;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      if (!hasError) {
        toast.error('Passwords do not match');
        hasError = true;
      }
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

  const handlePasswordBlur = (e) => {
    const { value } = e.target;
    if (value.length > 0 && value.length < 6) {
      toast.error('Password must be at least 6 characters', { autoClose: 3000 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting signup data:', {
        name: formData.name,
        email: formData.email,
        password: formData.password ? '***' : '',
        phone: formData.phone,
        role: formData.role
      });

      const requestData = {
        name: formData.name?.trim() || '',
        email: formData.email?.trim() || '',
        password: formData.password || '',
        role: formData.role || 'customer'
      };
      
      // Only include phone if it has a value
      if (formData.phone && formData.phone.trim()) {
        requestData.phone = formData.phone.trim();
      }

      console.log('Request data being sent:', { ...requestData, password: '***' });

      const response = await axios.post('http://localhost:5000/api/auth/signup', requestData);

      console.log('Signup response:', response.data);

      if (response.data.success) {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        window.dispatchEvent(new Event('userStatusChanged'));
        
        toast.success('Account created successfully! Welcome to Airbnb!');
        
        // Redirect based on role
        if (response.data.user.role === 'customer') {
          navigate('/');
        } else if (response.data.user.role === 'hotel') {
          navigate('/hotel-dashboard');
        } else if (response.data.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate(`/${response.data.user.role}-dashboard`);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.log('Setting error message:', errorMessage);
      setErrors({
        submit: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center bg-light"
    style={{
      minHeight: 'calc(100vh - 80px)',
      padding: '20px 0'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
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
                        <option value="hotel">Hotel Owner</option>
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
                        onBlur={handlePasswordBlur}
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
