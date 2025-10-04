import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hovered, setHovered] = useState(false);
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

  const handleBecomeHost = () => {
    navigate('/signup?type=host');
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const isHomePage = location.pathname === '/';

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container">
        {/* Logo */}
        <Link
          to={user ? `/${user.role}-dashboard` : "/"}
          className="navbar-brand d-flex align-items-center text-decoration-none"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="#FF385C" d="M16 2c7.732 0 14 6.268 14 14s-6.268 14-14 14S2 23.732 2 16 8.268 2 16 2zm0 6a8 8 0 100 16 8 8 0 000-16z"/>
          </svg>
          <span className="ms-2 fw-bold text-dark fs-4">airbnb</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="d-none d-lg-flex align-items-center ms-auto">
          {user ? (
            <div className="d-flex align-items-center">
              <Link
                to={`/${user.role}-dashboard`}
                className="btn btn-outline-dark me-3"
              >
                Dashboard
              </Link>

              {/* User Dropdown */}
              <div className="dropdown">
                <button
                  className="btn btn-outline-dark dropdown-toggle d-flex align-items-center"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    className="me-2"
                  >
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                  </svg>
                  {user.name}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to={`/${user.role}-dashboard`}>Dashboard</Link></li>
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

              {/* Settings Dropdown */}
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

                <ul className="dropdown-menu dropdown-menu-end mt-3">
                  <li><Link className="dropdown-item" to="/login">Log in</Link></li>
                  <li><Link className="dropdown-item" to="/signup">Sign up</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleBecomeHost}>Host your home</button></li>
                </ul>
              </div>
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
