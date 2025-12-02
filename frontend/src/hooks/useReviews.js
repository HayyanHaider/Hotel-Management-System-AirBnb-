import { useState, useEffect, useCallback } from 'react';
import ReviewApiService from '../services/api/ReviewApiService';

/**
 * useReviews - Custom hook for review data fetching
 * Follows Single Responsibility Principle - only handles review data state and fetching
 * Follows Dependency Inversion Principle - depends on ReviewApiService abstraction
 */
export const useReviews = (hotelId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await ReviewApiService.getHotelReviews(hotelId);
      
      if (response.success) {
        setReviews(response.reviews || []);
      } else {
        setError(response.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError(err.message || 'Error fetching reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    refetch: fetchReviews
  };
};

