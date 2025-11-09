class Hotel {
  constructor(hotelData) {
    this.id = hotelData.id;
    this.name = hotelData.name;
    this.description = hotelData.description || '';
    this.amenities = hotelData.amenities || [];
    this.policies = hotelData.policies || {};
    this.isApproved = hotelData.isApproved || false;
    this.isSuspended = hotelData.isSuspended || false;
    this.suspensionReason = hotelData.suspensionReason || '';
    this.rejectionReason = hotelData.rejectionReason || '';
    this.rating = hotelData.rating || 0;
    this.totalReviews = hotelData.totalReviews || 0;
    this.ownerId = hotelData.ownerId;
    this.location = hotelData.location || hotelData.address || {};
    this.address = hotelData.address || hotelData.location?.address || '';
    this.city = hotelData.city || hotelData.location?.city || '';
    this.state = hotelData.state || hotelData.location?.state || '';
    this.country = hotelData.country || hotelData.location?.country || '';
    this.pricing = hotelData.pricing || {};
    this.images = hotelData.images || [];
    this.capacity = hotelData.capacity || {};
    this.contactInfo = hotelData.contactInfo || {};
    this.createdAt = hotelData.createdAt;
    this.updatedAt = hotelData.updatedAt;
  }

  // Encapsulation: Private method to validate hotel data
  #validateHotelData() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Hotel name is required');
    }
    
    if (!this.address || this.address.trim().length === 0) {
      errors.push('Hotel address is required');
    }
    
    if (!this.city || this.city.trim().length === 0) {
      errors.push('City is required');
    }
    
    if (!this.ownerId) {
      errors.push('Owner ID is required');
    }
    
    return errors;
  }

  // Method to validate hotel information
  validate() {
    return this.#validateHotelData();
  }

  // Method to add amenity
  addAmenity(amenity) {
    if (!this.amenities.includes(amenity)) {
      this.amenities.push(amenity);
      this.updatedAt = new Date();
    }
  }

  // Method to remove amenity
  removeAmenity(amenity) {
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
    const index = this.images.indexOf(imageUrl);
    if (index > -1) {
      this.images.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Method to update rating
  updateRating(newRating) {
    const totalRatingPoints = this.rating * this.totalReviews;
    this.totalReviews += 1;
    this.rating = (totalRatingPoints + newRating) / this.totalReviews;
    this.updatedAt = new Date();
  }

  // Method to update price range
  updatePriceRange(minPrice, maxPrice) {
    this.priceRange = { min: minPrice, max: maxPrice };
    this.updatedAt = new Date();
  }

  // Method to update hotel information
  updateInfo(updates) {
    const allowedFields = [
      'name', 'description', 'address', 'city', 'country',
      'coordinates', 'amenities', 'policies', 'contactInfo'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });
    
    this.updatedAt = new Date();
  }

  // Method to activate hotel
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Method to deactivate hotel
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Method to approve hotel
  approve() {
    this.isApproved = true;
    this.updatedAt = new Date();
  }

  // Method to reject hotel approval
  reject() {
    this.isApproved = false;
    this.updatedAt = new Date();
  }

  // Method to check if hotel is bookable
  isBookable() {
    return (this.isActive !== false) && this.isApproved && !this.isSuspended;
  }

  // Method to get hotel statistics
  getStats() {
    return {
      rating: this.rating || 0,
      totalReviews: this.totalReviews || 0,
      priceRange: this.getPriceRange(),
      isActive: this.isActive !== false,
      isApproved: this.isApproved || false,
      capacity: this.capacity || {}
    };
  }

  // Method to search hotels by criteria
  static searchByCriteria(hotels, criteria) {
    return hotels.filter(hotel => {
      let matches = true;
      
      if (criteria.city && hotel.city.toLowerCase() !== criteria.city.toLowerCase()) {
        matches = false;
      }
      
      if (criteria.minRating && hotel.rating < criteria.minRating) {
        matches = false;
      }
      
      if (criteria.maxPrice && hotel.priceRange.min > criteria.maxPrice) {
        matches = false;
      }
      
      if (criteria.amenities && criteria.amenities.length > 0) {
        const hasAllAmenities = criteria.amenities.every(amenity => 
          hotel.amenities.includes(amenity)
        );
        if (!hasAllAmenities) {
          matches = false;
        }
      }
      
      return matches && hotel.isBookable();
    });
  }

  // Method to calculate distance from coordinates
  calculateDistance(lat, lng) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.#toRadians(lat - this.coordinates.lat);
    const dLng = this.#toRadians(lng - this.coordinates.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.#toRadians(this.coordinates.lat)) * 
              Math.cos(this.#toRadians(lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Private helper method to convert degrees to radians
  #toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Method to get public hotel information
  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      address: this.address || this.location?.address || '',
      city: this.city || this.location?.city || '',
      state: this.state || this.location?.state || '',
      country: this.country || this.location?.country || '',
      location: this.location || {},
      images: this.images || [],
      amenities: this.amenities || [],
      rating: this.rating || 0,
      totalReviews: this.totalReviews || 0,
      priceRange: this.getPriceRange(),
      pricing: this.pricing || {},
      capacity: this.capacity || {},
      isApproved: this.isApproved,
      isSuspended: this.isSuspended
    };
  }

  // Method to get detailed information (for owner/admin)
  getDetailedInfo() {
    return {
      ...this.getPublicInfo(),
      ownerId: this.ownerId,
      isApproved: this.isApproved,
      policies: this.policies,
      contactInfo: this.contactInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Method to get basic hotel information
  getBasicInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      location: this.location,
      address: this.address || this.location?.address,
      city: this.city || this.location?.city,
      state: this.state || this.location?.state,
      country: this.country || this.location?.country,
      images: this.images,
      amenities: this.amenities,
      rating: this.rating,
      totalReviews: this.totalReviews,
      pricing: this.pricing,
      isApproved: this.isApproved,
      isSuspended: this.isSuspended
    };
  }

  // Method to get search result information (for search listings)
  getSearchResult() {
    const priceRange = this.getPriceRange();
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      location: {
        address: this.address || this.location?.address || '',
        city: this.city || this.location?.city || '',
        state: this.state || this.location?.state || '',
        country: this.country || this.location?.country || ''
      },
      images: this.images || [],
      amenities: this.amenities || [],
      rating: this.rating || 0,
      totalReviews: this.totalReviews || 0,
      priceRange: priceRange,
      capacity: this.capacity || {},
      isApproved: this.isApproved,
      isSuspended: this.isSuspended,
      suspensionReason: this.suspensionReason || '',
      rejectionReason: this.rejectionReason || ''
    };
  }

  // Method to get price range from hotel pricing
  getPriceRange() {
    // Use pricing from hotel model
    if (this.pricing && this.pricing.basePrice) {
      return {
        min: this.pricing.basePrice,
        max: this.pricing.basePrice
      };
    }
    return { min: 0, max: 0 };
  }

  // Method to check if hotel has available capacity for given dates and guests
  hasAvailableRooms(checkIn, checkOut, guests) {
    // Check if hotel is bookable
    if (!this.isBookable()) {
      return false;
    }

    // Check capacity
    if (this.capacity && this.capacity.guests) {
      return this.capacity.guests >= guests;
    }

    // If no capacity info, assume available if hotel is approved
    return this.isApproved && !this.isSuspended;
  }
}

module.exports = Hotel;
