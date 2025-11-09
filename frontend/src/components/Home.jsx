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

      {/* Categories Section */}
      <div className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h2 className="h4 fw-bold mb-4">Explore Airbnb</h2>
              <div className="row g-4">
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
                      <svg width="32" height="32" fill="#FF385C" viewBox="0 0 16 16">
                        <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146zM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5z"/>
                      </svg>
                    </div>
                    <h6 className="fw-semibold">Stays</h6>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
                      <svg width="32" height="32" fill="#FF385C" viewBox="0 0 16 16">
                        <path d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A7.5 7.5 0 0 0 8 16.016zM8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z"/>
                        <path d="M8 4.5a.5.5 0 0 1 .5.5v2.5h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0v-2.5h-2a.5.5 0 0 1 0-1h2V5a.5.5 0 0 1 .5-.5z"/>
                      </svg>
                    </div>
                    <h6 className="fw-semibold">Experiences</h6>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
                      <svg width="32" height="32" fill="#FF385C" viewBox="0 0 16 16">
                        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                      </svg>
                    </div>
                    <h6 className="fw-semibold">Online Experiences</h6>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
                      <svg width="32" height="32" fill="#FF385C" viewBox="0 0 16 16">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                      </svg>
                    </div>
                    <h6 className="fw-semibold">Host your home</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="py-5">
        <div className="container">
          <h2 className="h4 fw-bold mb-4">Live anywhere</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card border-0">
                <div className="card-img-top bg-light rounded-3" style={{height: '200px', backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
                <div className="card-body p-0 pt-3">
                  <h6 className="fw-semibold">Outdoor getaways</h6>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0">
                <div className="card-img-top bg-light rounded-3" style={{height: '200px', backgroundImage: 'url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=200&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
                <div className="card-body p-0 pt-3">
                  <h6 className="fw-semibold">Unique stays</h6>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0">
                <div className="card-img-top bg-light rounded-3" style={{height: '200px', backgroundImage: 'url(https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=200&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
                <div className="card-body p-0 pt-3">
                  <h6 className="fw-semibold">Entire homes</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Host Section */}
      <div className="py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="h3 fw-bold mb-3">Try hosting</h2>
              <p className="text-muted mb-4">
                Earn extra income and unlock new opportunities by sharing your space.
              </p>
              <Link to="/signup?type=host" className="btn btn-dark">
                Learn more
          </Link>
            </div>
            <div className="col-lg-6">
              <div className="bg-light rounded-3" style={{height: '300px', backgroundImage: 'url(https://images.unsplash.com/photo-1560185127-6c189449e1a0?w=600&h=300&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
