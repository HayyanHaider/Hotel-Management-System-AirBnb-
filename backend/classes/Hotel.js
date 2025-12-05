const BaseEntity = require('./BaseEntity');

class Hotel extends BaseEntity {
  constructor(hotelData = {}) {
    super(hotelData);
    this.name = hotelData.name;
    this.description = hotelData.description || '';
    this.amenities = hotelData.amenities || [];
    this.policies = hotelData.policies || {};
    this.isApproved = hotelData.isApproved || false;
    this.isSuspended = hotelData.isSuspended || false;
    this.suspensionReason = hotelData.suspensionReason || '';
    this.rejectionReason = hotelData.rejectionReason || '';
    this.rating = hotelData.rating || 0;
    this.ratingAvg = hotelData.ratingAvg || 0;
    this.totalReviews = hotelData.totalReviews || 0;
    this.isFlagged = hotelData.isFlagged || false;
    this.flaggedReason = hotelData.flaggedReason || '';
    this.flaggedForLowRating = hotelData.flaggedForLowRating || false;
    this.flaggedAt = hotelData.flaggedAt || null;
    this.ownerId = hotelData.ownerId;
    this.location = hotelData.location || {};
    this.pricing = hotelData.pricing || {};
    this.images = hotelData.images || [];
    this.capacity = hotelData.capacity || {};
    this.totalRooms = hotelData.totalRooms || 1;
    this.commissionRate = hotelData.commissionRate || 0.10;
  }

  // Encapsulation: Private method to validate hotel data
  #validateHotelData() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Hotel name is required');
    }
    
    if (!this.location || !this.location.address || this.location.address.trim().length === 0) {
      errors.push('Hotel address is required');
    }
    
    if (!this.location || !this.location.city || this.location.city.trim().length === 0) {
      errors.push('City is required');
    }
    
    if (!this.ownerId) {
      errors.push('Owner ID is required');
    }
    
    // Pricing and capacity are now optional - removed validation
    // They can be set later by the hotel owner
    
    if (!this.totalRooms || this.totalRooms <= 0) {
      errors.push('Total rooms must be at least 1');
    }
    
    return errors;
  }

  // Method to validate hotel information
  validate() {
    return this.#validateHotelData();
  }

  // Method to add amenity
  addAmenity(amenity) {
    if (!this.amenities) {
      this.amenities = [];
    }
    if (!this.amenities.includes(amenity)) {
      this.amenities.push(amenity);
      this.updatedAt = new Date();
    }
  }

  // Method to remove amenity
  removeAmenity(amenity) {
    if (!this.amenities) {
      this.amenities = [];
      return;
    }
    const index = this.amenities.indexOf(amenity);
    if (index > -1) {
      this.amenities.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Method to add image
  addImage(imageUrl) {
    if (!this.images) {
      this.images = [];
    }
    if (!this.images.includes(imageUrl)) {
      this.images.push(imageUrl);
      this.updatedAt = new Date();
    }
  }

  // Method to remove image
  removeImage(imageUrl) {
    if (!this.images) {
      this.images = [];
      return;
    }
    const index = this.images.indexOf(imageUrl);
    if (index > -1) {
      this.images.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Method to update rating
  updateRating(newRating) {
    if (!this.totalReviews) {
      this.totalReviews = 0;
    }
    if (!this.ratingAvg) {
      this.ratingAvg = 0;
    }
    
    const totalRatingPoints = this.ratingAvg * this.totalReviews;
    this.totalReviews += 1;
    this.ratingAvg = (totalRatingPoints + newRating) / this.totalReviews;
    this.rating = this.ratingAvg; // Keep rating field for backward compatibility
    this.updatedAt = new Date();
  }

  // Method to update hotel information
  updateInfo(updates) {
    const allowedFields = [
      'name', 'description', 'location', 'amenities', 
      'policies', 'pricing', 'images', 'capacity', 'totalRooms'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });
    
    this.updatedAt = new Date();
  }

  // Method to approve hotel
  approve() {
    this.isApproved = true;
    this.rejectionReason = '';
    this.updatedAt = new Date();
  }

  // Method to reject hotel approval
  reject(reason = '') {
    this.isApproved = false;
    this.rejectionReason = reason;
    this.updatedAt = new Date();
  }

  // Method to suspend hotel
  suspend(reason = '') {
    this.isSuspended = true;
    this.suspensionReason = reason;
    this.updatedAt = new Date();
  }

  // Method to unsuspend hotel
  unsuspend() {
    this.isSuspended = false;
    this.suspensionReason = '';
    this.updatedAt = new Date();
  }

  // Method to flag hotel
  flag(reason = '', forLowRating = false) {
    this.isFlagged = true;
    this.flaggedReason = reason;
    this.flaggedForLowRating = forLowRating;
    this.flaggedAt = new Date();
    this.updatedAt = new Date();
  }

  // Method to unflag hotel
  unflag() {
    this.isFlagged = false;
    this.flaggedReason = '';
    this.flaggedForLowRating = false;
    this.flaggedAt = null;
    this.updatedAt = new Date();
  }

  // Method to check if hotel is bookable
  isBookable() {
    const bookable = this.isApproved && !this.isSuspended && !this.isFlagged;
    if (!bookable) {
      console.log(`[Hotel.isBookable] Hotel "${this.name}" not bookable - isApproved: ${this.isApproved}, isSuspended: ${this.isSuspended}, isFlagged: ${this.isFlagged}`);
    }
    return bookable;
  }

  // Method to get hotel statistics
  getStats() {
    return {
      rating: this.ratingAvg || this.rating || 0,
      totalReviews: this.totalReviews || 0,
      isApproved: this.isApproved,
      isSuspended: this.isSuspended,
      isFlagged: this.isFlagged,
      totalRooms: this.totalRooms || 1,
      capacity: this.capacity || {}
    };
  }

  // Method to calculate distance from coordinates
  calculateDistance(lat, lng) {
    if (!this.location || !this.location.coordinates || 
        !this.location.coordinates.lat || !this.location.coordinates.lng) {
      return null; // Cannot calculate distance without coordinates
    }
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.#toRadians(lat - this.location.coordinates.lat);
    const dLng = this.#toRadians(lng - this.location.coordinates.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.#toRadians(this.location.coordinates.lat)) * 
              Math.cos(this.#toRadians(lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Private helper method to convert degrees to radians
  #toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Static method to search hotels by criteria
  static searchByCriteria(hotels, criteria) {
    if (!hotels) return [];
    
    return hotels.filter(hotel => {
      let matches = true;
      
      if (criteria.city && hotel.location && 
          hotel.location.city.toLowerCase() !== criteria.city.toLowerCase()) {
        matches = false;
      }
      
      if (criteria.minRating && (hotel.ratingAvg || hotel.rating || 0) < criteria.minRating) {
        matches = false;
      }
      
      if (criteria.maxPrice && hotel.pricing && 
          hotel.pricing.basePrice > criteria.maxPrice) {
        matches = false;
      }
      
      if (criteria.minPrice && hotel.pricing && 
          hotel.pricing.basePrice < criteria.minPrice) {
        matches = false;
      }
      
      if (criteria.amenities && criteria.amenities.length > 0) {
        const hasAllAmenities = criteria.amenities.every(amenity => 
          hotel.amenities && hotel.amenities.includes(amenity)
        );
        if (!hasAllAmenities) {
          matches = false;
        }
      }
      
      return matches && hotel.isBookable();
    });
  }

  // Method to get public hotel information
  getPublicInfo() {
    // Convert ObjectId to string for proper JSON serialization
    const idString = this.id ? (this.id.toString ? this.id.toString() : String(this.id)) : null;
    return {
      id: idString,
      name: this.name,
      description: this.description,
      location: this.location || {},
      images: this.images || [],
      amenities: this.amenities || [],
      rating: this.ratingAvg || this.rating || 0,
      totalReviews: this.totalReviews || 0,
      pricing: this.pricing || {},
      capacity: this.capacity || {},
      totalRooms: this.totalRooms || 1,
      isApproved: this.isApproved,
      isSuspended: this.isSuspended
    };
  }

  // Method to get detailed information (for owner/admin)
  getDetailedInfo() {
    // Convert ownerId ObjectId to string if it exists
    const ownerIdString = this.ownerId ? (this.ownerId.toString ? this.ownerId.toString() : (this.ownerId._id ? this.ownerId._id.toString() : String(this.ownerId))) : null;
    return {
      ...this.getPublicInfo(),
      ownerId: ownerIdString,
      policies: this.policies,
      isFlagged: this.isFlagged,
      flaggedReason: this.flaggedReason,
      flaggedForLowRating: this.flaggedForLowRating,
      flaggedAt: this.flaggedAt,
      suspensionReason: this.suspensionReason,
      rejectionReason: this.rejectionReason,
      commissionRate: this.commissionRate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Method to check if hotel has available capacity for given dates and guests
  hasAvailableCapacity(guests) {
    // Check if hotel is bookable
    if (!this.isBookable()) {
      return false;
    }

    // Ensure guests is a valid number
    const requestedGuests = parseInt(guests) || 1;
    if (requestedGuests < 1) {
      return false;
    }

    // Check capacity - hotel must have capacity >= requested guests
    if (this.capacity && this.capacity.guests !== undefined && this.capacity.guests !== null) {
      // Handle both number and string types for capacity
      const hotelCapacity = parseInt(this.capacity.guests);
      // If capacity is 0 or negative, treat it as "not set" and fall through to default behavior
      if (isNaN(hotelCapacity) || hotelCapacity <= 0) {
        // Capacity not properly set, use default behavior
        return this.isApproved && !this.isSuspended;
      }
      const hasCapacity = hotelCapacity >= requestedGuests;
      // Only log when capacity is insufficient to reduce console noise
      if (!hasCapacity && requestedGuests > 1) {
        console.log(`[Hotel.hasAvailableCapacity] Hotel "${this.name}" capacity insufficient - capacity.guests: ${hotelCapacity}, requested: ${requestedGuests}`);
      }
      return hasCapacity;
    }

    // If no capacity info, assume available if hotel is approved (backward compatibility)
    // This allows hotels without capacity info to still be shown
    return this.isApproved && !this.isSuspended;
  }

  // Method to check if hotel has available rooms for given dates and guests
  // Note: This is a simplified check - actual availability should check bookings
  hasAvailableRooms(checkIn, checkOut, guests) {
    // Check if hotel is bookable
    if (!this.isBookable()) {
      return false;
    }

    // Check capacity
    if (this.capacity && this.capacity.guests) {
      if (this.capacity.guests < guests) {
        return false;
      }
    }

    // Check if hotel has rooms available
    if (this.totalRooms && this.totalRooms <= 0) {
      return false;
    }

    // Basic validation - dates should be valid
    if (!checkIn || !checkOut) {
      return false;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      return false;
    }

    // If all checks pass, assume available
    // Note: Actual availability checking should be done in the controller by querying bookings
    return true;
  }

  // Method to get price range
  getPriceRange() {
    const basePrice = this.pricing?.basePrice || 0;
    const cleaningFee = this.pricing?.cleaningFee || 0;
    const serviceFee = this.pricing?.serviceFee || 0;
    
    return {
      min: basePrice,
      max: basePrice + cleaningFee + serviceFee
    };
  }

  // Method to get search result format (for hotel listings)
  getSearchResult() {
    try {
      // Convert ObjectId to string for proper JSON serialization
      let idString = null;
      if (this.id) {
        if (typeof this.id === 'object' && this.id.toString) {
          idString = this.id.toString();
        } else if (this._id && typeof this._id === 'object' && this._id.toString) {
          idString = this._id.toString();
        } else {
          idString = String(this.id || this._id || '');
        }
      } else if (this._id) {
        if (typeof this._id === 'object' && this._id.toString) {
          idString = this._id.toString();
        } else {
          idString = String(this._id);
        }
      }

      return {
        id: idString,
        _id: idString, // For compatibility
        name: this.name || '',
        description: this.description || '',
        location: this.location || {},
        images: Array.isArray(this.images) ? this.images : [],
        amenities: Array.isArray(this.amenities) ? this.amenities : [],
        rating: this.ratingAvg || this.rating || 0,
        ratingAvg: this.ratingAvg || this.rating || 0,
        totalReviews: this.totalReviews || 0,
        pricing: this.pricing || {},
        capacity: this.capacity || {},
        totalRooms: this.totalRooms || 1,
        isApproved: this.isApproved || false,
        isSuspended: this.isSuspended || false,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    } catch (error) {
      console.error('[Hotel.getSearchResult] Error:', error);
      console.error('[Hotel.getSearchResult] Hotel data:', {
        id: this.id,
        _id: this._id,
        name: this.name
      });
      throw error;
    }
  }

  // Method to get basic info (alias for getPublicInfo for backward compatibility)
  getBasicInfo() {
    return this.getPublicInfo();
  }
}

module.exports = Hotel;
