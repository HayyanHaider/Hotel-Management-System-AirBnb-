import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const BrowseHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (searchParams.location) params.append('location', searchParams.location);
      if (searchParams.checkIn) params.append('checkIn', searchParams.checkIn);
      if (searchParams.checkOut) params.append('checkOut', searchParams.checkOut);
      if (searchParams.guests) params.append('guests', searchParams.guests);

      const response = await axios.get(`http://localhost:5000/api/hotels?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data.success) {
        setHotels(response.data.hotels || []);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHotels();
  };

  // Group hotels by country for categorized sections
  const groupHotelsByCountry = () => {
    const grouped = {};
    hotels.forEach(hotel => {
      const country = hotel.location?.country || 'Other';
      if (!grouped[country]) {
        grouped[country] = [];
      }
      grouped[country].push(hotel);
    });
    return grouped;
  };

  const groupedHotels = groupHotelsByCountry();
  const countries = Object.keys(groupedHotels);

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingTop: '20px' }}>
      {/* Search Bar */}
      <div className="container mb-4">
        <form onSubmit={handleSearch}>
          <div 
            className="d-flex align-items-center justify-content-between p-3 rounded-pill shadow-sm"
            style={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              maxWidth: '850px',
              margin: '0 auto'
            }}
          >
            <div className="d-flex flex-grow-1">
              <div className="flex-grow-1 px-3" style={{ borderRight: '1px solid #ddd' }}>
                <label className="small fw-semibold d-block mb-1" style={{ fontSize: '12px' }}>Where</label>
                <input
                  type="text"
                  className="border-0 w-100"
                  placeholder="Search destinations"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                  style={{ outline: 'none', fontSize: '14px' }}
                />
              </div>
              <div className="px-3" style={{ borderRight: '1px solid #ddd', minWidth: '150px' }}>
                <label className="small fw-semibold d-block mb-1" style={{ fontSize: '12px' }}>Check in</label>
                <input
                  type="date"
                  className="border-0 w-100"
                  placeholder="Add dates"
                  value={searchParams.checkIn}
                  onChange={(e) => setSearchParams({...searchParams, checkIn: e.target.value})}
                  style={{ outline: 'none', fontSize: '14px' }}
                />
              </div>
              <div className="px-3" style={{ borderRight: '1px solid #ddd', minWidth: '150px' }}>
                <label className="small fw-semibold d-block mb-1" style={{ fontSize: '12px' }}>Check out</label>
                <input
                  type="date"
                  className="border-0 w-100"
                  placeholder="Add dates"
                  value={searchParams.checkOut}
                  onChange={(e) => setSearchParams({...searchParams, checkOut: e.target.value})}
                  style={{ outline: 'none', fontSize: '14px' }}
                />
              </div>
              <div className="px-3 flex-grow-1">
                <label className="small fw-semibold d-block mb-1" style={{ fontSize: '12px' }}>Who</label>
                <input
                  type="number"
                  className="border-0 w-100"
                  placeholder="Add guests"
                  value={searchParams.guests}
                  onChange={(e) => setSearchParams({...searchParams, guests: e.target.value})}
                  style={{ outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn rounded-circle ms-3 d-flex align-items-center justify-content-center"
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
        </form>
      </div>

      {/* Hotel Listings by Category */}
      <div className="container-fluid px-4">
        {loading ? (
          <div className="text-center py-5">Loading...</div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-5">
            <p>No hotels found</p>
          </div>
        ) : (
          countries.map((country, index) => {
            const countryHotels = groupedHotels[country];
            return (
              <div key={country} className="mb-5" style={{ marginTop: index === 0 ? '0' : '40px' }}>
                <div className="mb-3">
                  <h2 className="fw-bold mb-0" style={{ fontSize: '22px' }}>
                    Popular in {country}
                  </h2>
                </div>
                <div 
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                  }}
                >
                  {countryHotels.map((hotel) => (
                    <div
                      key={hotel.id || hotel._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/hotel/${hotel.id || hotel._id}`)}
                    >
                      <div className="position-relative">
                        {hotel.images && hotel.images.length > 0 ? (
                          <img
                            src={hotel.images[0]}
                            alt={hotel.name}
                            className="rounded-3 w-100"
                            style={{ height: '300px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="rounded-3 w-100 d-flex align-items-center justify-content-center bg-light"
                            style={{ height: '300px' }}
                          >
                            <span className="text-muted">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div className="flex-grow-1">
                            <div className="fw-semibold" style={{ fontSize: '15px' }}>
                              {hotel.location?.city || 'Unknown'}, {hotel.location?.country || 'Unknown'}
                            </div>
                            <div className="text-muted small" style={{ fontSize: '13px' }}>
                              {hotel.name}
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="text-warning me-1">
                              <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                            </svg>
                            <span style={{ fontSize: '14px' }}>{hotel.rating?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                        <div className="text-muted small" style={{ fontSize: '13px' }}>
                          {hotel.priceRange?.min ? (
                            <>${hotel.priceRange.min} per night</>
                          ) : (
                            <>Price not available</>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BrowseHotels;

