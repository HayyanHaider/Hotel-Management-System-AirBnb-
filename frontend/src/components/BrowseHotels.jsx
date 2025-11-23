import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Home.css';

const BrowseHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateInput, setActiveDateInput] = useState('checkIn'); // 'checkIn' or 'checkOut'
  const checkInInputRef = useRef(null);
  const checkOutInputRef = useRef(null);
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
  const navigate = useNavigate();

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
        toast.info('Removed from favorites');
      } else {
        await axios.post('http://localhost:5000/api/users/favorites', { hotelId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => [...prev, hotelIdStr]);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(error.response?.data?.message || 'Error updating favorite. Please try again.');
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

  const handleSort = (sortBy) => {
    const order = filters.sortBy === sortBy && filters.order === 'desc' ? 'asc' : 'desc';
    handleFilterChange('sortBy', sortBy);
    handleFilterChange('order', order);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDateDisplay = () => {
    if (filters.checkIn && filters.checkOut) {
      return `${formatDate(filters.checkIn)} - ${formatDate(filters.checkOut)}`;
    }
    if (filters.checkIn) {
      return formatDate(filters.checkIn);
    }
    return 'Add dates';
  };

  const getGuestsDisplay = () => {
    if (filters.guests === 1) {
      return '1 guest';
    }
    return `${filters.guests} guests`;
  };

  return (
    <div className="home-container" style={{ minHeight: '100vh' }}>
      {/* Modern Search Bar */}
      <div className="sticky-top bg-white border-bottom shadow-sm" style={{ top: '72px', zIndex: 100 }}>
        <div className="d-flex justify-content-center" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '24px', paddingRight: '24px' }}>
          <div 
            className="d-flex align-items-center bg-white rounded-pill shadow-sm"
            style={{ 
              maxWidth: '700px',
              width: '100%',
              border: '1px solid #ddd',
              overflow: 'hidden',
              height: '56px'
            }}
          >
              {/* Where Input */}
              <div 
                className="flex-grow-1 px-4"
                style={{ 
                  borderRight: '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minWidth: '160px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f7f7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div className="small text-muted" style={{ fontSize: '10px', fontWeight: '600', marginBottom: '2px', lineHeight: '1' }}>
                  Where
                </div>
                <input
                  type="text"
                  className="border-0 w-100"
                  placeholder="Search destinations"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  style={{ 
                    outline: 'none', 
                    fontSize: '14px',
                    backgroundColor: 'transparent',
                    padding: 0,
                    margin: 0
                  }}
                />
              </div>

              {/* When Input */}
              <div 
                className="px-4 position-relative"
                style={{ 
                  borderRight: '1px solid #ddd',
                  cursor: 'pointer',
                  minWidth: '200px',
                  transition: 'background-color 0.2s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f7f7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                onClick={(e) => {
                  // Don't trigger if clicking the clear button
                  if (e.target.closest('.clear-dates-btn')) {
                    return;
                  }
                  // Determine which input to trigger
                  if (!filters.checkIn) {
                    // No check-in date, trigger check-in picker
                    setActiveDateInput('checkIn');
                    setTimeout(() => {
                      if (checkInInputRef.current) {
                        checkInInputRef.current.showPicker?.();
                        checkInInputRef.current.focus();
                        checkInInputRef.current.click();
                      }
                    }, 10);
                  } else if (filters.checkIn && !filters.checkOut) {
                    // Check-in set, trigger check-out picker
                    setActiveDateInput('checkOut');
                    setTimeout(() => {
                      if (checkOutInputRef.current) {
                        checkOutInputRef.current.showPicker?.();
                        checkOutInputRef.current.focus();
                        checkOutInputRef.current.click();
                      }
                    }, 10);
                  } else {
                    // Both set, reset to check-in
                    setActiveDateInput('checkIn');
                    setTimeout(() => {
                      if (checkInInputRef.current) {
                        checkInInputRef.current.showPicker?.();
                        checkInInputRef.current.focus();
                        checkInInputRef.current.click();
                      }
                    }, 10);
                  }
                }}
              >
                <div className="small text-muted" style={{ fontSize: '10px', fontWeight: '600', marginBottom: '2px', lineHeight: '1' }}>
                  When
                </div>
                <div 
                  style={{ 
                    fontSize: '14px',
                    color: filters.checkIn ? '#000' : '#717171',
                    padding: 0,
                    margin: 0,
                    pointerEvents: 'none',
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{getDateDisplay()}</span>
                  {(filters.checkIn || filters.checkOut) && (
                    <button
                      className="clear-dates-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange('checkIn', '');
                        handleFilterChange('checkOut', '');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s',
                        width: '20px',
                        height: '20px',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e0e0e0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Clear dates"
                    >
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                      </svg>
                    </button>
                  )}
                </div>
                {/* Check-in Date Input */}
                <input
                  ref={checkInInputRef}
                  type="date"
                  data-date-type="checkIn"
                  value={filters.checkIn || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checkInDate = e.target.value;
                    handleFilterChange('checkIn', checkInDate);
                    // If check-out is before new check-in, clear it
                    if (filters.checkOut && checkInDate && filters.checkOut < checkInDate) {
                      handleFilterChange('checkOut', '');
                    }
                    // Auto-advance to check-out
                    if (checkInDate && !filters.checkOut) {
                      setTimeout(() => {
                        setActiveDateInput('checkOut');
                        if (checkOutInputRef.current) {
                          checkOutInputRef.current.showPicker?.();
                          checkOutInputRef.current.focus();
                          checkOutInputRef.current.click();
                        }
                      }, 100);
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: activeDateInput === 'checkIn' ? 20 : 2,
                    margin: 0,
                    padding: 0
                  }}
                />
                {/* Check-out Date Input */}
                <input
                  ref={checkOutInputRef}
                  type="date"
                  data-date-type="checkOut"
                  value={filters.checkOut || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleFilterChange('checkOut', e.target.value);
                  }}
                  min={filters.checkIn || new Date().toISOString().split('T')[0]}
                  disabled={!filters.checkIn}
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: filters.checkIn ? 'pointer' : 'not-allowed',
                    zIndex: activeDateInput === 'checkOut' ? 20 : 2,
                    margin: 0,
                    padding: 0
                  }}
                />
              </div>

              {/* Who Input */}
              <div 
                className="px-4 d-flex justify-content-between align-items-center"
                style={{ 
                  cursor: 'pointer',
                  minWidth: '180px',
                  transition: 'background-color 0.2s',
                  height: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f7f7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="small text-muted" style={{ fontSize: '10px', fontWeight: '600', marginBottom: '2px', lineHeight: '1' }}>
                    Who
                  </div>
                  <div 
                  style={{ 
                    fontSize: '14px',
                    color: filters.guests > 1 ? '#000' : '#717171',
                    padding: 0,
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}
                  >
                    {filters.guests === 1 ? 'Add guests' : getGuestsDisplay()}
                  </div>
                  <input
                    type="number"
                    className="border-0 w-100"
                    value={filters.guests}
                    onChange={(e) => handleFilterChange('guests', parseInt(e.target.value) || 1)}
                    min="1"
                    style={{ 
                      outline: 'none', 
                      fontSize: '14px',
                      backgroundColor: 'transparent',
                      display: 'none'
                    }}
                  />
                </div>
                <div className="d-flex align-items-center justify-content-center" style={{ gap: '8px', marginLeft: '16px' }}>
                  <button
                    className="btn btn-sm border rounded-circle"
                    style={{ width: '28px', height: '28px', padding: 0, flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (filters.guests > 1) {
                        handleFilterChange('guests', filters.guests - 1);
                      }
                    }}
                  >
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
                    </svg>
                  </button>
                  <span className="d-flex align-items-center justify-content-center" style={{ fontSize: '13px', width: '24px', textAlign: 'center' }}>
                    {filters.guests}
                  </span>
                  <button
                    className="btn btn-sm border rounded-circle"
                    style={{ width: '28px', height: '28px', padding: 0, flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFilterChange('guests', filters.guests + 1);
                    }}
                  >
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search Button */}
              <button
                className="btn d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: '#FF385C',
                  color: 'white',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  minWidth: '48px',
                  border: 'none',
                  margin: '4px',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 56, 92, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => fetchHotels()}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.397h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
              </button>
            </div>
          </div>

        {/* Sort Options */}
        <div className="d-flex justify-content-center mt-2 pb-2">
          <div className="d-flex gap-3 align-items-center">
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
        <div className="container py-3">
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
                      className="position-absolute top-0 end-0 m-3 border-0"
                      style={{ 
                        zIndex: 10,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        margin: '12px',
                        background: 'transparent'
                      }}
                      onClick={(e) => toggleFavorite(hotel.id || hotel._id, e)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title={checkIsFavorite(hotel.id || hotel._id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 16 16" 
                        style={{ 
                          transition: 'all 0.2s ease',
                          pointerEvents: 'none',
                          flexShrink: 0
                        }}
                      >
                        {checkIsFavorite(hotel.id || hotel._id) ? (
                          <path 
                            d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"
                            fill="#FF385C"
                            stroke="#FF385C"
                            strokeWidth="0.5"
                          />
                        ) : (
                          <path 
                            d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"
                            fill="white"
                            stroke="#222"
                            strokeWidth="1"
                          />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
                <div className="hotel-card-body">
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
                    <div className="d-flex align-items-baseline gap-1">
                      <span className="fw-semibold" style={{ fontSize: '16px' }}>
                        PKR {hotel.pricing?.basePrice || hotel.priceRange?.min || '0'}
                      </span>
                      <span className="text-muted" style={{ fontSize: '14px' }}>/ night</span>
                    </div>
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
