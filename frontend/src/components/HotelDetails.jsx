import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Home.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Red marker icon for hotel location
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const HotelDetails = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [showAllImages, setShowAllImages] = useState(false);

  useEffect(() => {
    fetchHotelDetails();
    checkFavorite();
    fetchReviews();
  }, [hotelId]);

  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/hotels/${hotelId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data.success) {
        setHotel(response.data.hotel);
      }
    } catch (error) {
      console.error('Error fetching hotel details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reviews/hotel/${hotelId}`);
      if (response.data.success) {
        setReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkFavorite = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/users/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const favorites = response.data.favorites || [];
        setIsFavorite(favorites.some(f => String(f._id || f.id) === String(hotelId)));
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (isFavorite) {
        await axios.delete(`http://localhost:5000/api/users/favorites/${hotelId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
      } else {
        await axios.post('http://localhost:5000/api/users/favorites', { hotelId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBookNow = () => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }
    navigate(`/booking/${hotelId}`, {
      state: { checkIn, checkOut, guests }
    });
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotal = () => {
    if (!hotel) return 0;
    const nights = calculateNights();
    const basePrice = hotel.pricing?.basePrice || 0;
    const cleaningFee = hotel.pricing?.cleaningFee || 0;
    const serviceFee = hotel.pricing?.serviceFee || 0;
    return (basePrice * nights) + cleaningFee + serviceFee;
  };

  if (loading) {
    return (
      <div className="bg-white" style={{ minHeight: '100vh', paddingTop: '100px' }}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="bg-white" style={{ minHeight: '100vh', paddingTop: '100px' }}>
        <div className="container text-center py-5">
          <h2>Hotel not found</h2>
          <button className="btn btn-outline-dark mt-3" onClick={() => navigate('/browse-hotels')}>
            Browse Hotels
          </button>
        </div>
      </div>
    );
  }

  const images = hotel.images || [];
  const displayImages = showAllImages ? images : images.slice(0, 5);

  return (
    <div className="bg-white" style={{ minHeight: '100vh', paddingTop: '80px' }}>
      <div className="container" style={{ maxWidth: '1760px' }}>
        {/* Header */}
        <div className="mb-4">
          <button 
            className="btn btn-link text-dark text-decoration-none p-0 mb-3" 
            onClick={() => navigate(-1)}
            style={{ fontSize: '14px' }}
          >
            ← Back
          </button>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="fw-bold mb-2" style={{ fontSize: '26px' }}>{hotel.name}</h1>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-warning">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                  </svg>
                  <span className="ms-1 fw-semibold">{hotel.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-muted ms-1">({hotel.totalReviews || 0} {hotel.totalReviews === 1 ? 'review' : 'reviews'})</span>
                </div>
                <span className="text-muted">·</span>
                <span className="text-decoration-underline" style={{ cursor: 'pointer' }}>
                  {hotel.location?.city || 'Unknown'}, {hotel.location?.country || 'Unknown'}
                </span>
                {hotel.location?.coordinates && (
                  <>
                    <span className="text-muted">·</span>
                    <span className="text-decoration-underline" style={{ cursor: 'pointer' }}>
                      Show map
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              className="btn btn-outline-dark rounded-pill d-flex align-items-center gap-2"
              onClick={toggleFavorite}
            >
              <svg width="20" height="20" fill={isFavorite ? '#FF385C' : 'currentColor'} viewBox="0 0 16 16">
                <path d={isFavorite ? "M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z" : "M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"}/>
              </svg>
              {isFavorite ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="mb-4">
            <div 
              className="rounded-4 overflow-hidden"
              style={{
                display: 'grid',
                gridTemplateColumns: images.length >= 2 ? '1fr 1fr' : '1fr',
                gridTemplateRows: images.length >= 3 ? 'repeat(2, 300px)' : '400px',
                gap: '8px'
              }}
            >
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  className="position-relative"
                  style={{
                    gridRow: index === 0 && images.length >= 3 ? 'span 2' : 'span 1',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`${hotel.name} ${index + 1}`}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                  {index === 4 && images.length > 5 && !showAllImages && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllImages(true);
                      }}
                    >
                      <span className="text-white fw-bold" style={{ fontSize: '18px' }}>
                        Show all {images.length} photos
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="row">
          {/* Main Content */}
          <div className="col-lg-7 pe-lg-5">
            {/* Description */}
            <div className="mb-5 pb-4 border-bottom">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2 className="fw-bold mb-2" style={{ fontSize: '22px' }}>{hotel.name}</h2>
                  <p className="text-muted mb-0">
                    {hotel.location?.address}, {hotel.location?.city}, {hotel.location?.country}
                  </p>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3 mb-3">
                <div className="d-flex align-items-center">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                    <path d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A7.5 7.5 0 0 0 8 16.016zM8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z"/>
                    <path d="M8 4.5a.5.5 0 0 1 .5.5v2.5h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0v-2.5h-2a.5.5 0 0 1 0-1h2V5a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                  <span>{hotel.capacity?.guests || 1} {hotel.capacity?.guests === 1 ? 'guest' : 'guests'}</span>
                </div>
                {hotel.capacity?.bedrooms && (
                  <div className="d-flex align-items-center">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                      <path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"/>
                    </svg>
                    <span>{hotel.capacity.bedrooms} {hotel.capacity.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
                  </div>
                )}
                {hotel.capacity?.bathrooms && (
                  <div className="d-flex align-items-center">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                      <path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"/>
                    </svg>
                    <span>{hotel.capacity.bathrooms} {hotel.capacity.bathrooms === 1 ? 'bath' : 'baths'}</span>
                  </div>
                )}
              </div>
              <p className="mb-0" style={{ fontSize: '16px', lineHeight: '1.6' }}>{hotel.description}</p>
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="mb-5 pb-4 border-bottom">
                <h3 className="fw-bold mb-4" style={{ fontSize: '22px' }}>What this place offers</h3>
                <div className="row">
                  {hotel.amenities.map((amenity, index) => (
                    <div key={index} className="col-md-6 mb-3 d-flex align-items-center">
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="me-3">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                      </svg>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="mb-5">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h3 className="fw-bold mb-0" style={{ fontSize: '22px' }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-warning me-2">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                  </svg>
                  {hotel.rating?.toFixed(1) || '0.0'} · {hotel.totalReviews || 0} {hotel.totalReviews === 1 ? 'review' : 'reviews'}
                </h3>
              </div>
              {reviews.length === 0 ? (
                <p className="text-muted">No reviews yet</p>
              ) : (
                <div>
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review._id || review.id} className="mb-4 pb-4 border-bottom">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-semibold">{review.userId?.name || review.customer?.name || 'Anonymous'}</div>
                          <div className="text-muted small">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="d-flex align-items-center">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-warning me-1">
                            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                          </svg>
                          <span>{review.rating}</span>
                        </div>
                      </div>
                      <p className="mb-0">{review.comment || 'No comment'}</p>
                      {review.reply && review.reply.text && (
                        <div className="mt-3 p-3 bg-light rounded">
                          <div className="fw-semibold small mb-1">Response from host:</div>
                          <div className="small">{review.reply.text}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            {hotel.location && (
              <div className="mb-5">
                <h3 className="fw-bold mb-4" style={{ fontSize: '22px' }}>Where you'll be</h3>
                {hotel.location.coordinates && 
                 hotel.location.coordinates.lat != null && 
                 hotel.location.coordinates.lng != null &&
                 !isNaN(Number(hotel.location.coordinates.lat)) &&
                 !isNaN(Number(hotel.location.coordinates.lng)) ? (
                  <div className="border rounded-4 overflow-hidden" style={{ height: '400px', zIndex: 0, position: 'relative' }}>
                    <MapContainer
                      center={[Number(hotel.location.coordinates.lat), Number(hotel.location.coordinates.lng)]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                      key={`${hotel.location.coordinates.lat}-${hotel.location.coordinates.lng}`}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[Number(hotel.location.coordinates.lat), Number(hotel.location.coordinates.lng)]}
                        icon={redIcon}
                      >
                        <Popup>
                          <strong>{hotel.name}</strong><br />
                          {hotel.location.address || ''}<br />
                          {hotel.location.city || ''}, {hotel.location.country || ''}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                ) : (
                  <div className="border rounded-4 overflow-hidden" style={{ height: '400px', backgroundColor: '#f7f7f7' }}>
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center flex-column">
                      <p className="text-muted mb-2">Map location not available</p>
                      <p className="text-muted small">The hotel owner needs to set the map coordinates when creating the hotel.</p>
                    </div>
                  </div>
                )}
                <p className="mt-3 mb-0">
                  {hotel.location.address}, {hotel.location.city}, {hotel.location.state} {hotel.location.zipCode}, {hotel.location.country}
                </p>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="col-lg-5">
            <div className="sticky-top" style={{ top: '90px' }}>
              <div className="border rounded-4 p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <span className="fw-bold" style={{ fontSize: '22px' }}>
                      ${hotel.pricing?.basePrice || 0}
                    </span>
                    <span className="text-muted"> / night</span>
                  </div>
                </div>

                <div className="border rounded-3 p-3 mb-3">
                  <div className="row g-0">
                    <div className="col-6 border-end pe-3">
                      <label className="form-label small fw-semibold mb-1">CHECK-IN</label>
                      <input
                        type="date"
                        className="form-control border-0 p-0"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                    <div className="col-6 ps-3">
                      <label className="form-label small fw-semibold mb-1">CHECKOUT</label>
                      <input
                        type="date"
                        className="form-control border-0 p-0"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold mb-1">GUESTS</label>
                  <select
                    className="form-select"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-danger w-100 rounded-pill py-3 mb-3"
                  onClick={handleBookNow}
                  style={{ backgroundColor: '#FF385C', border: 'none', fontSize: '16px', fontWeight: '600' }}
                >
                  Reserve
                </button>

                {checkIn && checkOut && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-decoration-underline" style={{ cursor: 'pointer' }}>
                        ${hotel.pricing?.basePrice || 0} x {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
                      </span>
                      <span>${(hotel.pricing?.basePrice || 0) * calculateNights()}</span>
                    </div>
                    {hotel.pricing?.cleaningFee > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-decoration-underline" style={{ cursor: 'pointer' }}>Cleaning fee</span>
                        <span>${hotel.pricing.cleaningFee}</span>
                      </div>
                    )}
                    {hotel.pricing?.serviceFee > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-decoration-underline" style={{ cursor: 'pointer' }}>Service fee</span>
                        <span>${hotel.pricing.serviceFee}</span>
                      </div>
                    )}
                    <div className="border-top pt-3 mt-3">
                      <div className="d-flex justify-content-between fw-bold">
                        <span>Total</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center small text-muted">
                  You won't be charged yet
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;
