import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [userHovered, setUserHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Sync user state with localStorage
  useEffect(() => {
    const checkUserStatus = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

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
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('userStatusChanged'));
    navigate('/');
  };

  const handleLogoClick = (e) => {
    if (user && user.role === 'admin') {
      e.preventDefault();
      navigate('/admin-dashboard', { replace: true });
      // Dispatch event to reset admin dashboard to overview
      window.dispatchEvent(new Event('resetAdminDashboard'));
    }
  };

  const handleBecomeHost = () => {
    navigate('/signup?type=host');
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container-fluid">
        {/* Logo */}
        <Link
          to={user && user.role === 'admin' ? "/admin-dashboard" : "/"}
          className="navbar-brand d-flex align-items-center text-decoration-none"
          onClick={handleLogoClick}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="#FF385C" d="M16 2c7.732 0 14 6.268 14 14s-6.268 14-14 14S2 23.732 2 16 8.268 2 16 2zm0 6a8 8 0 100 16 8 8 0 000-16z"/>
          </svg>
          <span className="ms-2 fw-bold text-dark fs-4">airbnb</span>
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

                <ul className="dropdown-menu dropdown-menu-end mt-3" style={{ minWidth: "270px" }}>
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
                  <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>

            </div>
          ) : (
            <div className="d-flex align-items-center">
              {isHomePage && (
                <button
                  onClick={handleBecomeHost}
                  className="btn btn-outline-dark me-3"
                >
                  Become a Host
                </button>
              )}

              {/* Settings Dropdown - Only show when not on auth pages */}
              {!isAuthPage && (
                <div className="dropdown me-3">
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
                    onMouseDown={() => setHovered(true)}
                    onMouseUp={() => setHovered(false)}
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

                  <ul className="dropdown-menu dropdown-menu-end mt-4">
                    <li><Link className="dropdown-item" to="/login">Log in</Link></li>
                    <li><Link className="dropdown-item" to="/signup">Sign up</Link></li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="navbar-toggler d-lg-none border-0"
          type="button"
          onClick={toggleMobileMenu}
        >
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
        </button>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="collapse navbar-collapse d-lg-none">
            <div className="navbar-nav ms-auto">
              {user ? (
                <>
                  <Link className="nav-link" to={`/${user.role}-dashboard`}>Dashboard</Link>
                  <button className="nav-link btn btn-link text-start" onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <>
                  <Link className="nav-link" to="/login">Log in</Link>
                  <Link className="nav-link" to="/signup">Sign up</Link>
                  <button className="nav-link btn btn-link text-start" onClick={handleBecomeHost}>Host your home</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
