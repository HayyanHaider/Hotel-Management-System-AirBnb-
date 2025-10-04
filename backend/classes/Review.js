class Review {
  constructor(reviewData) {
    this.id = reviewData.id;
    this.rating = reviewData.rating;
    this.comment = reviewData.comment || '';
    this.replyText = reviewData.replyText || '';
    this.repliedAt = reviewData.repliedAt || null;
  }

  // Encapsulation: Private method to validate review data
  #validateReviewData() {
    const errors = [];
    
    if (!this.bookingId) {
      errors.push('Booking ID is required');
    }
    
    if (!this.customerId) {
      errors.push('Customer ID is required');
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

  // Method to check if review content is appropriate
  #isContentAppropriate() {
    const inappropriateWords = ['spam', 'fake', 'scam']; // Simplified list
    const text = (this.title + ' ' + this.comment).toLowerCase();
    
    return !inappropriateWords.some(word => text.includes(word));
  }

  // Method to publish review
  publish() {
    if (!this.#isContentAppropriate()) {
      throw new Error('Review content is inappropriate and cannot be published');
    }
    
    this.isPublished = true;
    this.publishedAt = new Date();
    this.updatedAt = new Date();
  }

  // Method to unpublish review
  unpublish() {
    this.isPublished = false;
    this.publishedAt = null;
    this.updatedAt = new Date();
  }

  // Method to verify review (admin action)
  verify() {
    this.isVerified = true;
    this.updatedAt = new Date();
  }

  // Method to add helpful vote
  addHelpfulVote() {
    this.helpfulVotes += 1;
    this.updatedAt = new Date();
  }

  // Method to remove helpful vote
  removeHelpfulVote() {
    if (this.helpfulVotes > 0) {
      this.helpfulVotes -= 1;
      this.updatedAt = new Date();
    }
  }

  // Method to report review
  reportReview() {
    this.reportCount += 1;
    this.updatedAt = new Date();
    
    // Auto-unpublish if too many reports
    if (this.reportCount >= 5) {
      this.unpublish();
    }
  }

  // Method to add owner response
  addOwnerResponse(response) {
    this.ownerResponse = {
      text: response,
      respondedAt: new Date()
    };
    this.updatedAt = new Date();
  }

  // Method to remove owner response
  removeOwnerResponse() {
    this.ownerResponse = null;
    this.updatedAt = new Date();
  }

  // Method to update review content
  updateContent(updates) {
    const allowedFields = ['title', 'comment', 'pros', 'cons', 'categories'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });
    
    this.updatedAt = new Date();
  }

  // Method to add category rating
  addCategoryRating(category, rating) {
    if (rating >= 1 && rating <= 5) {
      this.categories[category] = rating;
      this.updatedAt = new Date();
    }
  }

  // Method to calculate overall category average
  getCategoryAverage() {
    const ratings = Object.values(this.categories);
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return sum / ratings.length;
  }

  // Method to add image
  addImage(imageUrl) {
    if (!this.images.includes(imageUrl)) {
      this.images.push(imageUrl);
      this.updatedAt = new Date();
    }
  }

  // Method to remove image
  removeImage(imageUrl) {
    const index = this.images.indexOf(imageUrl);
    if (index > -1) {
      this.images.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Method to check if review is recent
  isRecent(days = 30) {
    const daysDiff = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
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

  // Static method to calculate average rating from reviews
  static calculateAverageRating(reviews) {
    if (reviews.length === 0) return 0;
    
    const publishedReviews = reviews.filter(review => review.isPublished);
    if (publishedReviews.length === 0) return 0;
    
    const sum = publishedReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / publishedReviews.length;
  }

  // Static method to get rating distribution
  static getRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews
      .filter(review => review.isPublished)
      .forEach(review => {
        distribution[review.rating] += 1;
      });
    
    return distribution;
  }

  // Static method to search reviews by criteria
  static searchByCriteria(reviews, criteria) {
    return reviews.filter(review => {
      let matches = true;
      
      if (criteria.customerId && review.customerId !== criteria.customerId) {
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
      
      if (criteria.isVerified !== undefined && review.isVerified !== criteria.isVerified) {
        matches = false;
      }
      
      if (criteria.isPublished !== undefined && review.isPublished !== criteria.isPublished) {
        matches = false;
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
      categoryAverage: this.getCategoryAverage(),
      helpfulVotes: this.helpfulVotes,
      reportCount: this.reportCount,
      isVerified: this.isVerified,
      isPublished: this.isPublished,
      hasOwnerResponse: !!this.ownerResponse,
      imageCount: this.images.length,
      isRecent: this.isRecent(),
      isHighlyRated: this.isHighlyRated()
    };
  }

  // Method to get public review information
  getPublicInfo() {
    return {
      id: this.id,
      rating: this.rating,
      title: this.title,
      comment: this.comment,
      pros: this.pros,
      cons: this.cons,
      categories: this.categories,
      isVerified: this.isVerified,
      helpfulVotes: this.helpfulVotes,
      ownerResponse: this.ownerResponse,
      images: this.images,
      createdAt: this.createdAt,
      publishedAt: this.publishedAt
    };
  }

  // Method to get detailed information (for admin/owner)
  getDetailedInfo() {
    return {
      ...this.getPublicInfo(),
      bookingId: this.bookingId,
      customerId: this.customerId,
      hotelId: this.hotelId,
      roomId: this.roomId,
      isPublished: this.isPublished,
      reportCount: this.reportCount,
      updatedAt: this.updatedAt
    };
  }

  // Method to generate review summary
  getSummary() {
    return {
      reviewId: this.id,
      rating: this.rating,
      title: this.title,
      customerVerified: this.isVerified,
      helpful: this.helpfulVotes,
      hasResponse: !!this.ownerResponse,
      reviewDate: this.createdAt.toDateString()
    };
  }
}

module.exports = Review;
