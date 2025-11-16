import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: ''
  });
  const [paypalDetails, setPaypalDetails] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setBooking(response.data.booking);
      } else {
        console.error('Failed to fetch booking details:', response.data.message);
        toast.error('Failed to load booking details. Please try again.');
        navigate('/booking-history');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Error loading booking details. Please try again.');
      navigate('/booking-history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'card' && (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv)) {
      toast.warning('Please fill in all card details');
      return;
    }

    if (paymentMethod === 'paypal' && (!paypalDetails.email || !paypalDetails.password)) {
      toast.warning('Please fill in your PayPal email and password');
      return;
    }

    try {
      setProcessing(true);
      const token = sessionStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:5000/api/payments/process',
        {
          bookingId,
          paymentMethod,
          cardDetails: paymentMethod === 'card' ? cardDetails : null,
          paypalDetails: paymentMethod === 'paypal' ? paypalDetails : null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Payment processed successfully!');
        navigate('/booking-history');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.message || 'Error processing payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  if (!booking) {
    return <div className="dashboard-container text-center">Booking not found</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <h1>Payment</h1>
            <div className="card mb-4">
              <div className="card-body">
                <h5>Booking Summary</h5>
                <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
                <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
                <p>Nights: {booking.nights}</p>
                
                {booking.priceSnapshot && (
                  <>
                    <hr />
                    <div className="mb-3">
                      <h6 className="mb-2">Price Breakdown</h6>
                      
                      {booking.priceSnapshot.basePricePerDay && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>
                            ${(booking.priceSnapshot.basePricePerDay || 0).toFixed(2)} × {booking.priceSnapshot.nights || booking.nights} {booking.priceSnapshot.nights === 1 || booking.nights === 1 ? 'night' : 'nights'}
                          </span>
                          <span>${(booking.priceSnapshot.basePriceTotal || (booking.priceSnapshot.basePricePerDay || 0) * (booking.priceSnapshot.nights || booking.nights || 1)).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {booking.priceSnapshot.cleaningFee > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Cleaning fee</span>
                          <span>${(booking.priceSnapshot.cleaningFee || 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {booking.priceSnapshot.serviceFee > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Service fee</span>
                          <span>${(booking.priceSnapshot.serviceFee || 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between mb-2 mt-3">
                        <strong>Subtotal:</strong>
                        <strong>${(booking.priceSnapshot.subtotal || 0).toFixed(2)}</strong>
                      </div>
                      
                      {booking.priceSnapshot.couponCode && booking.priceSnapshot.couponDiscountPercentage && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>
                            <strong className="text-success">
                              Coupon Applied: {booking.priceSnapshot.couponCode} ({booking.priceSnapshot.couponDiscountPercentage}% off)
                            </strong>
                          </span>
                          <span className="text-success">
                            -${(booking.priceSnapshot.discounts || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      <hr />
                      <div className="d-flex justify-content-between">
                        <h5 className="mb-0">Total:</h5>
                        <h4 className="mb-0">${(booking.priceSnapshot.totalPrice || 0).toFixed(2)}</h4>
                      </div>
                    </div>
                  </>
                )}
                
                {!booking.priceSnapshot && (
                  <h4>Total: ${booking.totalPrice || 0}</h4>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              {paymentMethod === 'card' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Card Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Expiry Date</label>
                      <input
                        type="text"
                        className="form-control"
                        value={cardDetails.expiryDate}
                        onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">CVV</label>
                      <input
                        type="text"
                        className="form-control"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        placeholder="123"
                        maxLength="3"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Card Holder Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cardDetails.cardHolderName}
                      onChange={(e) => setCardDetails({...cardDetails, cardHolderName: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'paypal' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">PayPal Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={paypalDetails.email}
                      onChange={(e) => setPaypalDetails({...paypalDetails, email: e.target.value})}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">PayPal Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={paypalDetails.password}
                      onChange={(e) => setPaypalDetails({...paypalDetails, password: e.target.value})}
                      placeholder="Enter your PayPal password"
                      required
                    />
                  </div>

                  <div className="alert alert-info">
                    <small>
                      <strong>Note:</strong> You will be redirected to PayPal to complete the payment securely.
                    </small>
                  </div>
                </>
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
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;

