import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.warning('Please login to view bookings');
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/bookings/my-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/cancel`,
        { reason: 'Customer cancellation' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Error cancelling booking');
    }
  };

  const handleReview = (bookingId) => {
    navigate(`/review/${bookingId}`);
  };

  const handleReschedule = (bookingId) => {
    navigate(`/reschedule/${bookingId}`);
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/payments/invoice/${bookingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(error.response?.data?.message || 'Error downloading invoice');
    }
  };

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1>My Bookings</h1>
            <p>View and manage your reservations</p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/browse-hotels')}
            style={{ height: 'fit-content' }}
          >
            ← Go Back
          </button>
        </div>
      </div>

      <div className="container">
        {bookings.length === 0 ? (
          <div className="text-center">
            <p>No bookings found</p>
            <button className="btn btn-primary" onClick={() => navigate('/browse-hotels')}>
              Browse Hotels
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {bookings.map((booking) => (
              <div key={booking._id || booking.id} className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="card-title">
                          {booking.hotelId?.name || booking.hotel?.name || 'Hotel'}
                        </h5>
                        <p className="text-muted">
                          {booking.hotelId?.address || booking.hotel?.address || 'Address not available'}
                        </p>
                        <p>
                          <strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Nights:</strong> {booking.nights}
                        </p>
                        <p>
                          <strong>Total:</strong> ${booking.priceSnapshot?.totalPrice || booking.totalPrice || 0}
                        </p>
                        <p>
                          <strong>Status:</strong> <span className={`badge bg-${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </p>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleReschedule(booking._id || booking.id)}
                            >
                              Reschedule
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCancel(booking._id || booking.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && booking.invoicePath && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleDownloadInvoice(booking._id || booking.id)}
                          >
                            Download Invoice
                          </button>
                        )}
                        {(booking.status === 'completed' || booking.status === 'checked-out') && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleReview(booking._id || booking.id)}
                            >
                              Leave Review
                            </button>
                            {booking.invoicePath && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleDownloadInvoice(booking._id || booking.id)}
                              >
                                Download Invoice
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'danger';
    case 'completed':
      return 'info';
    default:
      return 'secondary';
  }
};

export default BookingHistory;

