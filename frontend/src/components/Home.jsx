import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    if (guests) params.append('guests', guests);
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="bg-white">
      {/* Hero Section with Search */}
      <div className="bg-white py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center mb-5">
              <h1 className="display-4 fw-bold text-dark mb-3">
                Find your next stay
              </h1>
              <p className="lead text-muted mb-4">
                Search deals on hotels, homes, and much more...
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <form onSubmit={handleSearch}>
                <div className="card shadow-lg border-0 rounded-pill overflow-hidden" style={{ maxWidth: '850px', margin: '0 auto' }}>
                  <div className="card-body p-0">
                    <div className="row g-0 align-items-center">
                      {/* Location */}
                      <div className="col-md-4">
                        <div className="p-3 border-end" style={{ cursor: 'pointer' }}>
                          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '12px' }}>Where</label>
                          <input 
                            type="text" 
                            className="form-control border-0 p-0" 
                            placeholder="Search destinations"
                            value={searchLocation}
                            onChange={(e) => setSearchLocation(e.target.value)}
                            style={{ outline: 'none', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                      
                      {/* Check-in */}
                      <div className="col-md-3">
                        <div className="p-3 border-end" style={{ cursor: 'pointer' }}>
                          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '12px' }}>Check in</label>
                          <input 
                            type="date" 
                            className="form-control border-0 p-0" 
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            style={{ outline: 'none', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                      
                      {/* Check-out */}
                      <div className="col-md-3">
                        <div className="p-3 border-end" style={{ cursor: 'pointer' }}>
                          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '12px' }}>Check out</label>
                          <input 
                            type="date" 
                            className="form-control border-0 p-0" 
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            style={{ outline: 'none', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                      
                      {/* Guests */}
                      <div className="col-md-2">
                        <div className="p-3">
                          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '12px' }}>Who</label>
                          <select 
                            className="form-select border-0 p-0" 
                            value={guests}
                            onChange={(e) => setGuests(e.target.value)}
                            style={{ outline: 'none', fontSize: '14px' }}
                          >
                            <option value="1">1 guest</option>
                            <option value="2">2 guests</option>
                            <option value="3">3 guests</option>
                            <option value="4">4 guests</option>
                            <option value="5">5+ guests</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Search Button */}
                      <div className="col-md-auto">
                        <button 
                          type="submit"
                          className="btn rounded-pill m-2 d-flex align-items-center justify-content-center"
                          style={{
                            backgroundColor: '#FF385C',
                            width: '48px',
                            height: '48px',
                            border: 'none',
                            color: '#fff'
                          }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
