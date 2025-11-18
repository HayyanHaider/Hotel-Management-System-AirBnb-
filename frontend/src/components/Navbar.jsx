import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [userHovered, setUserHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // NEW: Track compact mode based on viewport width (Bootstrap lg breakpoint: 992px)
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 992 : false);

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Sync user state with sessionStorage
  useEffect(() => {
    const checkUserStatus = () => {
      const token = sessionStorage.getItem('token');
      const userData = sessionStorage.getItem('user');

      if (token && userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    checkUserStatus();
    window.addEventListener('storage', checkUserStatus);
    window.addEventListener('userStatusChanged', checkUserStatus);

    return () => {
      window.removeEventListener('storage', checkUserStatus);
      window.removeEventListener('userStatusChanged', checkUserStatus);
    };
  }, []);

  // Update when location changes
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('userStatusChanged'));
    toast.info('You have been logged out.');
    navigate('/');
  };

  const handleLogoClick = (e) => {
    if (user) {
      e.preventDefault();
      if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
        window.dispatchEvent(new Event('resetAdminDashboard'));
      } else if (user.role === 'customer') {
        navigate('/', { replace: true });
      } else if (user.role === 'hotel' || user.role === 'hotel_owner') {
        navigate('/hotel-dashboard', { replace: true });
        window.dispatchEvent(new Event('resetHotelDashboard'));
      }
    } else {
      e.preventDefault();
      navigate('/', { replace: true });
    }
  };

  const handleBecomeHost = () => {
    navigate('/signup?type=host');
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container-fluid">
        {/* Logo */}
        <Link
          to={
            user && user.role === 'admin' ? "/admin-dashboard" :
            user && user.role === 'customer' ? "/" :
            (user && (user.role === 'hotel' || user.role === 'hotel_owner')) ? "/hotel-dashboard" : "/"
          }
          className="navbar-brand d-flex align-items-center text-decoration-none"
          onClick={handleLogoClick}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="#FF385C" d="M16 2c7.732 0 14 6.268 14 14s-6.268 14-14 14S2 23.732 2 16 8.268 2 16 2zm0 6a8 8 0 100 16 8 8 0 000-16z"/>
          </svg>
          <span className="ms-2" style={{ 
            color: '#FF385C', 
            fontSize: '24px', 
            fontWeight: '600',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.5px'
          }}>airbnb</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-nav d-none d-lg-flex align-items-center ms-auto">
          {user ? (
            <div className="d-flex align-items-center">
              {/* Circular User Button */}
              <div className="dropdown me-3">
                <button
                  className="btn rounded-circle d-flex align-items-center justify-content-center"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{
                    width: "40px",
                    height: "40px",
                    boxShadow: "none",
                    border: userHovered ? "2px solid #007bff" : "2px solid #dee2e6",
                    background: userHovered ? "#f8f9fa" : "transparent",
                    transition: "all 0.2s ease",
                    color: userHovered ? "#007bff" : "#6c757d",
                  }}
                  onMouseEnter={() => setUserHovered(true)}
                  onMouseLeave={() => setUserHovered(false)}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </button>

                <ul className="dropdown-menu dropdown-menu-end mt-3 p-2 shadow border-0 rounded-4" style={{ minWidth: "280px" }}>
                  {/* User Details Header */}
                  <li className="dropdown-header">
                    <div className="d-flex align-items-center mb-2">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: "40px", height: "40px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{user.name}</div>
                        <div className="text-muted small">{user.email}</div>
                        <div className="text-muted small text-capitalize">{user.role}</div>
                      </div>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  
                  {/* Role-specific navigation links */}
                  {user.role === 'admin' && (
                    <>
                      
                    </>
                  )}
                  
                  {user.role === 'customer' && (
                    <>
                      <li>
                        <Link className="dropdown-item py-2" to="/booking-history">
                          <span className="me-2">📅</span> My Bookings
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item py-2" to="/favorites">
                          <span className="me-2">❤️</span> Favorites
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item py-2" to="/edit-profile">
                          <span className="me-2">✏️</span> Edit Profile
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                    </>
                  )}
                  
                  {(user.role === 'hotel' || user.role === 'hotel_owner') && (
                    <>
                      
                    </>
                  )}
                  
                  <li><button className="dropdown-item py-2" onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>

            </div>
          ) : (
            <div className="d-flex align-items-center">
              {/* Become a Host button and Settings dropdown - Only show when not on auth pages */}
              {!isAuthPage && (
                <>
                  <button
                    onClick={handleBecomeHost}
                    className="btn btn-outline-dark me-3"
                    style={{ fontSize: '14px', borderRadius: '22px' }}
                  >
                    Become a Host
                  </button>
                  <div className="dropdown">
                    <button
                      className="btn d-flex align-items-center"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{
                        boxShadow: "none",
                        borderColor: "transparent",
                        background: "transparent",
                      }}
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={hovered ? "grey" : "black"}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M19.14,12.936c.036-.303,.06-.612,.06-.936s-.024-.633-.072-.936l2.055-1.605c.183-.144,.231-.411,.111-.624l-1.947-3.369c-.12-.213-.372-.297-.585-.213l-2.427,.978c-.507-.393-1.059-.717-1.659-.951l-.369-2.58c-.036-.231-.231-.408-.471-.408h-3.894c-.24,0-.435,.177-.471,.408l-.369,2.58c-.6,.234-1.152,.558-1.659,.951l-2.427-.978c-.219-.084-.465,0-.585,.213l-1.947,3.369c-.12,.213-.072,.48,.111,.624l2.055,1.605c-.048,.303-.075,.612-.075,.936s.027,.633,.075,.936l-2.055,1.605c-.183,.144-.231,.411-.111,.624l1.947,3.369c.12,.213,.372,.297,.585,.213l2.427-.978c.507,.393,1.059,.717,1.659,.951l.369,2.58c.036,.231,.231,.408,.471,.408h3.894c.24,0,.435-.177,.471-.408l.369-2.58c.6-.234,1.152-.558,1.659-.951l2.427,.978c.213,.081,.465,0,.585-.213l1.947-3.369c.12-.213,.072-.48-.111-.624l-2.055-1.605Zm-7.14,2.064c-1.656,0-3-1.344-3-3s1.344-3,3-3,3,1.344,3,3-1.344,3-3,3Z"/>
                      </svg>
                    </button>

                    <ul className="dropdown-menu dropdown-menu-end mt-3 p-2 shadow border-0 rounded-4" style={{ minWidth: "220px" }}>
                      <li><Link className="dropdown-item py-2" to="/login">Log in</Link></li>
                      <li><Link className="dropdown-item py-2" to="/signup">Sign up</Link></li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Small-screen right actions (show settings/avatar without 3-dot toggler) */}
        <div className="d-flex d-lg-none align-items-center ms-auto">
          {user ? (
            <>
              <div className="dropdown position-relative">
              <button
                className="btn rounded-circle d-flex align-items-center justify-content-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="Account menu"
                style={{ width: "40px", height: "40px", border: "2px solid #dee2e6" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
              <ul
                className="dropdown-menu dropdown-menu-end mt-3 p-2 shadow border-0 rounded-4"
                style={{ minWidth: "280px", right: 0, left: "auto", zIndex: 1080 }}
              >
                <li className="px-2 py-1 text-muted small">Signed in as <span className="fw-semibold text-dark">{user.name}</span></li>
                <li><hr className="dropdown-divider" /></li>
                
                {/* Role-specific navigation links for mobile */}
                {user.role === 'admin' && (
                  <li>
                    <Link className="dropdown-item py-2" to="/admin-dashboard">
                      <span className="me-2">🏠</span> Dashboard
                    </Link>
                  </li>
                )}
                
                {user.role === 'customer' && (
                  <>
                    <li>
                      <Link className="dropdown-item py-2" to="/booking-history">
                        <span className="me-2">📅</span> My Bookings
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item py-2" to="/favorites">
                        <span className="me-2">❤️</span> Favorites
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item py-2" to="/edit-profile">
                        <span className="me-2">✏️</span> Edit Profile
                      </Link>
                    </li>
                  </>
                )}
                
                {user.role === 'hotel' && (
                  <>
                    <li>
                      <Link className="dropdown-item py-2" to="/hotel-dashboard">
                        <span className="me-2">🏠</span> Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item py-2" to="/manage-hotel-profile">
                        <span className="me-2">🏨</span> Manage Hotel
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item py-2" to="/manage-rooms">
                        <span className="me-2">🛏️</span> Manage Rooms
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item py-2" to="/owner-bookings">
                        <span className="me-2">📋</span> Reservations
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item py-2" to="/earnings-dashboard">
                        <span className="me-2">💰</span> Earnings
                      </Link>
                    </li>
                  </>
                )}
                
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item py-2" onClick={handleLogout}>Logout</button>
                </li>
              </ul>
            </div>
            </>
          ) : (
            !isAuthPage && (
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={handleBecomeHost}
                  className="btn btn-outline-dark btn-sm me-2"
                  style={{ fontSize: '12px', borderRadius: '22px' }}
                >
                  Become a Host
                </button>
                <div className="dropdown">
                  <button
                    className="btn d-flex align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ boxShadow: "none", borderColor: "transparent", background: "transparent" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.14,12.936c.036-.303,.06-.612,.06-.936s-.024-.633-.072-.936l2.055-1.605c.183-.144,.231-.411,.111-.624l-1.947-3.369c-.12-.213-.372-.297-.585-.213l-2.427,.978c-.507-.393-1.059-.717-1.659-.951l-.369-2.58c-.036-.231-.231-.408-.471-.408h-3.894c-.24,0-.435,.177-.471,.408l-.369,2.58c-.6,.234-1.152,.558-1.659,.951l-2.427-.978c-.219-.084-.465,0-.585,.213l-1.947,3.369c-.12,.213-.072,.48,.111,.624l2.055,1.605c-.048,.303-.075,.612-.075,.936s.027,.633,.075,.936l-2.055,1.605c-.183,.144-.231,.411-.111,.624l1.947,3.369c.12,.213,.372,.297,.585,.213l2.427-.978c.507,.393,1.059,.717,1.659,.951l.369,2.58c.036,.231,.231,.408,.471,.408h3.894c.24,0,.435-.177,.471-.408l.369-2.58c.6-.234,1.152-.558,1.659-.951l2.427,.978c.213,.081,.465,0,.585-.213l1.947-3.369c.12-.213,.072-.48-.111-.624l-2.055-1.605Zm-7.14,2.064c-1.656,0-3-1.344-3-3s1.344-3,3-3,3,1.344,3,3-1.344,3-3,3Z"/>
                    </svg>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end mt-3 p-2 shadow border-0 rounded-4" style={{ minWidth: "220px", right: 0, left: "auto", zIndex: 1080 }}>
                    <li><Link className="dropdown-item py-2" to="/login">Log in</Link></li>
                    <li><Link className="dropdown-item py-2" to="/signup">Sign up</Link></li>
                  </ul>
                </div>
              </div>
            )
          )}
        </div>

        {/* Removed 3-dot mobile toggler and slide-out mobile menu */}
      </div>
    </nav>
  );
};

export default Navbar;
