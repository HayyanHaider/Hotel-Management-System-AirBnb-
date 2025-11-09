import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const CreateBooking = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [hotel, setHotel] = useState(null);
  const [checkIn, setCheckIn] = useState(location.state?.checkIn || '');
  const [checkOut, setCheckOut] = useState(location.state?.checkOut || '');
  const [guests, setGuests] = useState(location.state?.guests || 1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    fetchHotelDetails();
  }, [hotelId]);

  useEffect(() => {
    if (hotel && checkIn && checkOut && guests) {
      checkAvailability();
    } else {
      setAvailabilityChecked(false);
      setIsAvailable(false);
    }
  }, [hotel, checkIn, checkOut, guests]);

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

  const checkAvailability = async () => {
    try {
      setAvailabilityChecked(false);
      // Simple check: if hotel capacity >= guests, it's available
      // The actual availability check will be done on the backend when creating the booking
      const maxGuests = hotel?.capacity?.guests || 0;
      if (parseInt(guests) <= maxGuests && checkIn && checkOut) {
        setIsAvailable(true);
      } else {
        setIsAvailable(false);
      }
      setAvailabilityChecked(true);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(false);
      setAvailabilityChecked(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hotelId) {
      alert('Hotel ID is missing. Please try again.');
      return;
    }

    if (!checkIn || !checkOut || !guests) {
      alert('Please fill in all required fields');
      return;
    }

    if (!isAvailable) {
      alert('Hotel is not available for the selected dates and number of guests. Please select different dates or reduce the number of guests.');
      return;
    }

    try {
      setSubmitting(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('Please login to create a booking');
        navigate('/login');
        return;
      }

      const bookingData = {
        hotelId: hotelId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests: parseInt(guests) || 1
      };

      console.log('Sending booking data:', bookingData); // Debug log

      const response = await axios.post(
        'http://localhost:5000/api/bookings',
        bookingData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const bookingId = response.data.booking._id || response.data.booking.id;
        const appliedCoupon = response.data.appliedCoupon;
        
        if (appliedCoupon) {
          alert(`Great! Coupon "${appliedCoupon.code}" (${appliedCoupon.discountPercentage}% off) has been automatically applied. You saved $${appliedCoupon.discountAmount.toFixed(2)}!`);
        }
        
        console.log('Booking created successfully, navigating to payment:', bookingId);
        if (bookingId) {
          navigate(`/payment/${bookingId}`);
        } else {
          alert('Booking created but booking ID is missing. Please check your bookings.');
          navigate('/booking-history');
        }
      } else {
        alert('Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error response:', error.response?.data); // Debug log
      alert(error.response?.data?.message || 'Error creating booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <h1>Create Booking</h1>
            {hotel && <h3>{hotel.name}</h3>}

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-3">
                <label className="form-label">Check-in Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Check-out Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
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
                  max={hotel?.capacity?.guests || 10}
                  required
                />
                {hotel?.capacity?.guests && (
                  <small className="text-muted">Maximum {hotel.capacity.guests} guests</small>
                )}
              </div>

              {checkIn && checkOut && guests && availabilityChecked && (
                <div className="mb-4">
                  {isAvailable ? (
                    <div className="alert alert-success">
                      ✓ Hotel is available for the selected dates and number of guests.
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      Hotel is not available for the selected dates and number of guests. Please select different dates or reduce the number of guests.
                    </div>
                  )}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;

