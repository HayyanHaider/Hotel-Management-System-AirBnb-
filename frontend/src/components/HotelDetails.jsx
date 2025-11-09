import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const HotelDetails = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    fetchHotelDetails();
    checkFavorite();
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
        alert('Please login to add favorites');
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

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  if (!hotel) {
    return <div className="dashboard-container text-center">Hotel not found</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="row">
          <div className="col-md-8">
            <h1>{hotel.name}</h1>
            <p className="text-muted">{hotel.location?.address}, {hotel.location?.city}, {hotel.location?.country}</p>
            <p className="text-warning">⭐ {hotel.rating || 0} ({hotel.totalReviews || 0} reviews)</p>

            {hotel.images && hotel.images.length > 0 && (
              <div className="mb-4">
                <img
                  src={hotel.images[0]}
                  className="img-fluid rounded"
                  alt={hotel.name}
                  style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div className="mb-4">
              <h3>Description</h3>
              <p>{hotel.description}</p>
            </div>

            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="mb-4">
                <h3>Amenities</h3>
                <ul>
                  {hotel.amenities.map((amenity, index) => (
                    <li key={index}>{amenity}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h4>Book Now</h4>
                <div className="mb-3">
                  <label className="form-label">Check-in</label>
                  <input
                    type="date"
                    className="form-control"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Check-out</label>
                  <input
                    type="date"
                    className="form-control"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Guests</label>
                  <input
                    type="number"
                    className="form-control"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    min="1"
                  />
                </div>
                <button className="btn btn-primary w-100 mb-2" onClick={handleBookNow}>
                  Book Now
                </button>
                <button
                  className={`btn w-100 ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={toggleFavorite}
                >
                  {isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;

