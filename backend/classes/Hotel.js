class Hotel {
  constructor(hotelData) {
    this.id = hotelData.id;
    this.name = hotelData.name;
    this.description = hotelData.description || '';
    this.amenities = hotelData.amenities || [];
    this.policies = hotelData.policies || {};
    this.isApproved = hotelData.isApproved || false;
    this.isSuspended = hotelData.isSuspended || false;
    this.rating = hotelData.rating || 0;
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

  // Method to add room to hotel
  addRoom(roomId) {
    if (!this.rooms.includes(roomId)) {
      this.rooms.push(roomId);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Method to remove room from hotel
  removeRoom(roomId) {
    const index = this.rooms.indexOf(roomId);
    if (index > -1) {
      this.rooms.splice(index, 1);
      this.updatedAt = new Date();
      return true;
    }
    return false;
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
    return this.isActive && this.isApproved && this.rooms.length > 0;
  }

  // Method to get hotel statistics
  getStats() {
    return {
      totalRooms: this.rooms.length,
      rating: this.rating,
      totalReviews: this.totalReviews,
      priceRange: this.priceRange,
      isActive: this.isActive,
      isApproved: this.isApproved
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
      address: this.address,
      city: this.city,
      country: this.country,
      images: this.images,
      amenities: this.amenities,
      rating: this.rating,
      totalReviews: this.totalReviews,
      priceRange: this.priceRange,
      category: this.category,
      isActive: this.isActive,
      totalRooms: this.rooms.length
    };
  }

  // Method to get detailed information (for owner/admin)
  getDetailedInfo() {
    return {
      ...this.getPublicInfo(),
      ownerId: this.ownerId,
      rooms: this.rooms,
      isApproved: this.isApproved,
      policies: this.policies,
      contactInfo: this.contactInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Hotel;
