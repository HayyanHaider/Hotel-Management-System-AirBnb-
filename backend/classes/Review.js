class Review {
  constructor(reviewData) {
    this.id = reviewData.id;
    this.bookingId = reviewData.bookingId;
    this.hotelId = reviewData.hotelId;
    this.userId = reviewData.userId;
    this.rating = reviewData.rating;
    this.comment = reviewData.comment || '';
    this.replyText = reviewData.replyText || '';
    this.repliedAt = reviewData.repliedAt || null;
    this.createdAt = reviewData.createdAt;
    this.updatedAt = reviewData.updatedAt;
  }

  // Encapsulation: Private method to validate review data
  #validateReviewData() {
    const errors = [];
    
    if (!this.bookingId) {
      errors.push('Booking ID is required');
    }
    
    if (!this.userId) {
      errors.push('User ID is required');
    }
    
    if (!this.hotelId) {
      errors.push('Hotel ID is required');
    }
    
    if (!this.rating || this.rating < 1 || this.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }
    
    if (this.comment && this.comment.length > 1000) {
      errors.push('Comment cannot exceed 1000 characters');
    }
    
    return errors;
  }

  // Method to validate review information
  validate() {
    return this.#validateReviewData();
  }

  // Method to add owner response
  addOwnerResponse(response) {
    this.replyText = response;
    this.repliedAt = new Date();
    this.updatedAt = new Date();
  }

  // Method to remove owner response
  removeOwnerResponse() {
    this.replyText = '';
    this.repliedAt = null;
    this.updatedAt = new Date();
  }

  // Method to update review content
  updateContent(updates) {
    const allowedFields = ['comment'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });
    
    this.updatedAt = new Date();
  }

  // Method to check if review is recent
  isRecent(days = 30) {
    if (!this.createdAt) return false;
    const daysDiff = (new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24);
    return daysDiff <= days;
  }

  // Method to check if review is highly rated
  isHighlyRated() {
    return this.rating >= 4;
  }

  // Method to check if review is poorly rated
  isPoorlyRated() {
    return this.rating <= 2;
  }

  // Method to check if review has owner response
  hasOwnerResponse() {
    return !!this.replyText && this.replyText.trim().length > 0;
  }

  // Static method to calculate average rating from reviews
  static calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  // Static method to get rating distribution
  static getRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    if (!reviews) return distribution;
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating] += 1;
      }
    });
    
    return distribution;
  }

  // Static method to search reviews by criteria
  static searchByCriteria(reviews, criteria) {
    if (!reviews) return [];
    
    return reviews.filter(review => {
      let matches = true;
      
      if (criteria.userId && review.userId !== criteria.userId) {
        matches = false;
      }
      
      if (criteria.hotelId && review.hotelId !== criteria.hotelId) {
        matches = false;
      }
      
      if (criteria.minRating && review.rating < criteria.minRating) {
        matches = false;
      }
      
      if (criteria.maxRating && review.rating > criteria.maxRating) {
        matches = false;
      }
      
      if (criteria.hasResponse !== undefined) {
        const hasResponse = !!(review.replyText && review.replyText.trim().length > 0);
        if (hasResponse !== criteria.hasResponse) {
          matches = false;
        }
      }
      
      if (criteria.dateFrom && review.createdAt < new Date(criteria.dateFrom)) {
        matches = false;
      }
      
      if (criteria.dateTo && review.createdAt > new Date(criteria.dateTo)) {
        matches = false;
      }
      
      return matches;
    });
  }

  // Method to get review statistics
  getStats() {
    return {
      rating: this.rating,
      hasOwnerResponse: this.hasOwnerResponse(),
      isRecent: this.isRecent(),
      isHighlyRated: this.isHighlyRated(),
      isPoorlyRated: this.isPoorlyRated()
    };
  }

  // Method to get public review information
  getPublicInfo() {
    return {
      id: this.id,
      rating: this.rating,
      comment: this.comment,
      replyText: this.replyText,
      repliedAt: this.repliedAt,
      hasOwnerResponse: this.hasOwnerResponse(),
      createdAt: this.createdAt
    };
  }

  // Method to get detailed information (for admin/owner)
  getDetailedInfo() {
    return {
      ...this.getPublicInfo(),
      bookingId: this.bookingId,
      userId: this.userId,
      hotelId: this.hotelId,
      updatedAt: this.updatedAt
    };
  }

  // Method to generate review summary
  getSummary() {
    return {
      reviewId: this.id,
      rating: this.rating,
      hasResponse: this.hasOwnerResponse(),
      reviewDate: this.createdAt ? new Date(this.createdAt).toDateString() : ''
    };
  }
}

module.exports = Review;
