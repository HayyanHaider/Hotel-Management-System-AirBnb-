import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const BrowseHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests')) || 1,
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    amenities: searchParams.get('amenities') ? searchParams.get('amenities').split(',') : [],
    sortBy: searchParams.get('sortBy') || 'popularity',
    order: searchParams.get('order') || 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const availableAmenities = ['WiFi', 'AC', 'Parking', 'Pool', 'Breakfast', 'Gym', 'Spa', 'Restaurant'];

  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'amenities') {
          params.append(key, filters[key]);
        }
      });
      
      if (filters.amenities && filters.amenities.length > 0) {
        params.append('amenities', filters.amenities.join(','));
      }

      // Add limit parameter to fetch more hotels (default 50)
      if (!params.has('limit')) {
        params.append('limit', '50');
      }
      
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
  }, [filters]);

  const fetchFavorites = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      const response = await axios.get('http://localhost:5000/api/users/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const favoriteIds = (response.data.favorites || []).map(f => String(f._id || f.id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    // Check login status on mount and when hotels are fetched
    const token = sessionStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    fetchHotels();
    if (token) {
      fetchFavorites();
    }
  }, [fetchHotels]);

  const toggleFavorite = async (hotelId, e) => {
    e.stopPropagation();
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        // This shouldn't happen since button is hidden when not logged in, but just in case
        return;
      }

      const hotelIdStr = String(hotelId);
      const isFavorite = favorites.includes(hotelIdStr);

      if (isFavorite) {
        await axios.delete(`http://localhost:5000/api/users/favorites/${hotelId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => prev.filter(id => id !== hotelIdStr));
      } else {
        await axios.post('http://localhost:5000/api/users/favorites', { hotelId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => [...prev, hotelIdStr]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert(error.response?.data?.message || 'Error updating favorite. Please try again.');
    }
  };

  const checkIsFavorite = (hotelId) => {
    return favorites.includes(String(hotelId));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key === 'amenities' && Array.isArray(value)) {
      if (value.length > 0) {
        newParams.set('amenities', value.join(','));
      } else {
        newParams.delete('amenities');
      }
    }
    setSearchParams(newParams);
  };

  const toggleAmenity = (amenity) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    handleFilterChange('amenities', newAmenities);
  };

  const handleSort = (sortBy) => {
    const order = filters.sortBy === sortBy && filters.order === 'desc' ? 'asc' : 'desc';
    handleFilterChange('sortBy', sortBy);
    handleFilterChange('order', order);
  };

  return (
    <div className="bg-white" style={{ minHeight: '100vh', paddingTop: '80px' }}>
      {/* Sticky Search Bar */}
      <div className="sticky-top bg-white border-bottom shadow-sm" style={{ top: '72px', zIndex: 100 }}>
        <div className="container py-3">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex gap-3 flex-wrap">
                <div className="border rounded-pill px-4 py-2" style={{ cursor: 'pointer' }}>
                  <small className="fw-semibold">Location</small>
                  <input
                    type="text"
                    className="border-0 ms-2"
                    placeholder="Where to?"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    style={{ outline: 'none', width: '150px' }}
                  />
                </div>
                <div className="border rounded-pill px-4 py-2" style={{ cursor: 'pointer' }}>
                  <small className="fw-semibold">Check in</small>
                  <input
                    type="date"
                    className="border-0 ms-2"
                    value={filters.checkIn}
                    onChange={(e) => handleFilterChange('checkIn', e.target.value)}
                    style={{ outline: 'none' }}
                  />
                </div>
                <div className="border rounded-pill px-4 py-2" style={{ cursor: 'pointer' }}>
                  <small className="fw-semibold">Check out</small>
                  <input
                    type="date"
                    className="border-0 ms-2"
                    value={filters.checkOut}
                    onChange={(e) => handleFilterChange('checkOut', e.target.value)}
                    style={{ outline: 'none' }}
                  />
                </div>
                <div className="border rounded-pill px-4 py-2" style={{ cursor: 'pointer' }}>
                  <small className="fw-semibold">Guests</small>
                  <input
                    type="number"
                    className="border-0 ms-2"
                    value={filters.guests}
                    onChange={(e) => handleFilterChange('guests', parseInt(e.target.value) || 1)}
                    min="1"
                    style={{ outline: 'none', width: '60px' }}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <button
                className="btn btn-outline-dark rounded-pill"
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                  <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
                </svg>
                Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 border rounded-4 bg-white">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-semibold">Price Range ($)</label>
                  <div className="d-flex gap-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-semibold">Minimum Rating</label>
                  <select
                    className="form-select"
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  >
                    <option value="">Any rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="1">1+ Stars</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Amenities</label>
                  <div className="d-flex flex-wrap gap-2">
                    {availableAmenities.map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        className={`btn btn-sm ${filters.amenities.includes(amenity) ? 'btn-dark' : 'btn-outline-dark'}`}
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  className="btn btn-link text-decoration-underline"
                  onClick={() => {
                    setFilters({
                      location: '',
                      checkIn: '',
                      checkOut: '',
                      guests: 1,
                      minPrice: '',
                      maxPrice: '',
                      minRating: '',
                      amenities: [],
                      sortBy: 'popularity',
                      order: 'desc'
                    });
                    setSearchParams({});
                  }}
                >
                  Clear all
                </button>
                <button
                  className="btn btn-dark rounded-pill px-4"
                  onClick={() => setShowFilters(false)}
                >
                  Show {hotels.length} places
                </button>
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="mt-3 d-flex gap-3 align-items-center">
            <span className="text-muted small">Sort by:</span>
            <button
              className={`btn btn-sm ${filters.sortBy === 'popularity' ? 'btn-dark' : 'btn-outline-dark'} rounded-pill`}
              onClick={() => handleSort('popularity')}
            >
              Popularity
            </button>
            <button
              className={`btn btn-sm ${filters.sortBy === 'price' ? 'btn-dark' : 'btn-outline-dark'} rounded-pill`}
              onClick={() => handleSort('price')}
            >
              Price {filters.sortBy === 'price' && (filters.order === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`btn btn-sm ${filters.sortBy === 'rating' ? 'btn-dark' : 'btn-outline-dark'} rounded-pill`}
              onClick={() => handleSort('rating')}
            >
              Rating {filters.sortBy === 'rating' && (filters.order === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Hotel Listings with Map */}
      {loading ? (
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      ) : hotels.length === 0 ? (
        <div className="container py-5">
          <div className="text-center">
            <h3 className="mb-3">No places found</h3>
            <p className="text-muted">Try adjusting your search or filters</p>
          </div>
        </div>
      ) : (
        <div className="container py-4">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {hotels.map((hotel) => (
              <div
                key={hotel.id || hotel._id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/hotel/${hotel.id || hotel._id}`)}
                className="hotel-card"
              >
                <div className="position-relative" style={{ height: '300px' }}>
                  {(() => {
                    // Handle images - they might be objects with url property or direct URLs
                    let imageUrl = '';
                    if (hotel.images && hotel.images.length > 0) {
                      const firstImage = hotel.images[0];
                      if (typeof firstImage === 'string') {
                        imageUrl = firstImage;
                      } else if (firstImage && typeof firstImage === 'object' && firstImage.url) {
                        imageUrl = firstImage.url;
                      } else if (firstImage) {
                        imageUrl = String(firstImage);
                      }
                      
                      // Ensure the URL is properly formatted
                      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                        // If it's a local path, prepend the backend URL
                        if (imageUrl.startsWith('/uploads/')) {
                          imageUrl = `http://localhost:5000${imageUrl}`;
                        } else if (!imageUrl.startsWith('/')) {
                          imageUrl = `http://localhost:5000/uploads/${imageUrl}`;
                        }
                      }
                    }
                    
                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={hotel.name}
                        className="w-100 rounded-4 position-relative"
                        style={{
                          height: '300px',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                          zIndex: 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null;
                  })()}
                  <div
                    className="w-100 h-100 rounded-4 bg-light d-flex align-items-center justify-content-center position-absolute top-0 start-0 image-placeholder"
                    style={{ 
                      display: (hotel.images && hotel.images.length > 0) ? 'none' : 'flex',
                      zIndex: 0
                    }}
                  >
                    <span className="text-muted">Preview unavailable</span>
                  </div>
                  {isLoggedIn && (
                    <button
                      className="position-absolute top-0 end-0 m-3 bg-white rounded-circle border-0 d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        zIndex: 10,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s ease'
                      }}
                      onClick={(e) => toggleFavorite(hotel.id || hotel._id, e)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title={checkIsFavorite(hotel.id || hotel._id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg 
                        width="20" 
                        height="20" 
                        fill={checkIsFavorite(hotel.id || hotel._id) ? '#FF385C' : 'currentColor'} 
                        viewBox="0 0 16 16"
                        style={{ transition: 'fill 0.2s ease' }}
                      >
                        {checkIsFavorite(hotel.id || hotel._id) ? (
                          <path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"/>
                        ) : (
                          <path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                        )}
                      </svg>
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="flex-grow-1">
                      <div className="fw-semibold" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                        {hotel.location?.city || 'Unknown'}, {hotel.location?.country || 'Unknown'}
                      </div>
                      <div className="text-muted small mt-1" style={{ fontSize: '14px' }}>
                        {hotel.name}
                      </div>
                    </div>
                    <div className="d-flex align-items-center ms-2">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="text-warning">
                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                      </svg>
                      <span className="ms-1" style={{ fontSize: '14px', fontWeight: '500' }}>
                        {hotel.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                  <div className="text-muted small mb-1" style={{ fontSize: '14px' }}>
                    {hotel.totalReviews || 0} {hotel.totalReviews === 1 ? 'review' : 'reviews'}
                  </div>
                  <div className="mt-2">
                    <span className="fw-semibold" style={{ fontSize: '16px' }}>
                      ${hotel.pricing?.basePrice || hotel.priceRange?.min || '0'}
                    </span>
                    <span className="text-muted" style={{ fontSize: '14px' }}> night</span>
                  </div>
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap gap-1">
                      {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="badge bg-light text-dark small">
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="badge bg-light text-dark small">
                          +{hotel.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseHotels;
