import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const ReplyToReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const userId = JSON.parse(sessionStorage.getItem('user'))?.userId;

      // Get owner's hotels first
      const hotelsResponse = await axios.get('http://localhost:5000/api/hotels', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (hotelsResponse.data.success) {
        const userHotels = hotelsResponse.data.hotels.filter(h => String(h.ownerId) === String(userId));
        const hotelIds = userHotels.map(h => h._id || h.id);

        // Fetch reviews for all hotels
        const allReviews = [];
        for (const hotelId of hotelIds) {
          try {
            const reviewsResponse = await axios.get(`http://localhost:5000/api/reviews/hotel/${hotelId}`);
            if (reviewsResponse.data.success) {
              allReviews.push(...(reviewsResponse.data.reviews || []));
            }
          } catch (error) {
            console.error(`Error fetching reviews for hotel ${hotelId}:`, error);
          }
        }

        setReviews(allReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/reviews/${reviewId}/reply`,
        { text: replyText },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Reply submitted successfully!');
      setReplyingTo(null);
      setReplyText('');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert(error.response?.data?.message || 'Error submitting reply');
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
            <h1>Reply to Reviews</h1>
            <p>Respond to guest reviews</p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/hotel-dashboard')}
            style={{ height: 'fit-content' }}
          >
            ← Go Back
          </button>
        </div>
      </div>

      <div className="container">
        {reviews.length === 0 ? (
          <div className="text-center">
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="row g-4">
            {reviews.map((review) => (
              <div key={review._id || review.id} className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5>{review.userId?.name || review.customer?.name || 'Guest'}</h5>
                        <p className="text-warning">⭐ {review.rating}/5</p>
                        <p>{review.comment || 'No comment'}</p>
                        <p className="text-muted small">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {review.reply && review.reply.text && (
                      <div className="alert alert-info">
                        <strong>Your Reply:</strong> {review.reply.text}
                        <br />
                        <small className="text-muted">
                          {new Date(review.reply.repliedAt).toLocaleDateString()}
                        </small>
                      </div>
                    )}

                    {!review.reply && (
                      <div>
                        {replyingTo === (review._id || review.id) ? (
                          <div className="mt-3">
                            <textarea
                              className="form-control mb-2"
                              rows="3"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply..."
                            />
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleReply(review._id || review.id)}
                              >
                                Submit Reply
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setReplyingTo(review._id || review.id)}
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    )}
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

export default ReplyToReviews;

