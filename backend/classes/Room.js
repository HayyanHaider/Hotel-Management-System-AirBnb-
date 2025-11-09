class Room {
  constructor(roomData) {
    this.id = roomData.id;
    this.name = roomData.name;
    this.type = roomData.type;
    this.pricePerNight = roomData.pricePerNight;
    this.amenities = roomData.amenities || [];
    this.isAvailable = roomData.isAvailable !== undefined ? roomData.isAvailable : true;
  }

  // Encapsulation: Private method to validate room data
  #validateRoomData() {
    const errors = [];
    
    if (!this.hotelId) {
      errors.push('Hotel ID is required');
    }
    
    if (!this.roomNumber || this.roomNumber.trim().length === 0) {
      errors.push('Room number is required');
    }
    
    if (!this.type || this.type.trim().length === 0) {
      errors.push('Room type is required');
    }
    
    if (!this.pricePerNight || this.pricePerNight <= 0) {
      errors.push('Valid price per night is required');
    }
    
    if (!this.capacity || this.capacity <= 0) {
      errors.push('Valid capacity is required');
    }
    
    return errors;
  }

  // Method to validate room information
  validate() {
    return this.#validateRoomData();
  }

  // Method to check availability for specific dates
  isAvailableForDates(checkIn, checkOut) {
    if (!this.isAvailable || !this.isActive) {
      return false;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check if dates are in unavailable dates
    for (let unavailableDate of this.unavailableDates) {
      const unavailable = new Date(unavailableDate);
      if (unavailable >= checkInDate && unavailable < checkOutDate) {
        return false;
      }
    }

    // Check existing bookings
    for (let bookingId of this.bookings) {
      // In real implementation, you would fetch booking details
      // For now, we assume booking has checkIn and checkOut dates
      // This is a simplified check
    }

    return true;
  }

  // Method to calculate total price for stay
  calculateTotalPrice(checkIn, checkOut, guestCount = 1) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      throw new Error('Invalid date range');
    }

    if (guestCount > this.capacity) {
      throw new Error('Guest count exceeds room capacity');
    }

    let totalPrice = this.pricePerNight * nights;

    // Apply discounts
    totalPrice = this.applyDiscounts(totalPrice, nights);

    // Extra guest charges (if applicable)
    if (guestCount > 2) {
      const extraGuests = guestCount - 2;
      totalPrice += extraGuests * 20 * nights; // $20 per extra guest per night
    }

    return {
      basePrice: this.pricePerNight * nights,
      totalPrice: totalPrice,
      nights: nights,
      pricePerNight: this.pricePerNight,
      currency: this.currency
    };
  }

  // Method to apply discounts
  applyDiscounts(basePrice, nights) {
    let discountedPrice = basePrice;

    for (let discount of this.discounts) {
      if (this.isDiscountApplicable(discount, nights)) {
        if (discount.type === 'percentage') {
          discountedPrice -= (basePrice * discount.value / 100);
        } else if (discount.type === 'fixed') {
          discountedPrice -= discount.value;
        }
      }
    }

    return Math.max(discountedPrice, 0);
  }

  // Method to check if discount is applicable
  isDiscountApplicable(discount, nights) {
    const now = new Date();
    
    // Check if discount is active
    if (discount.startDate && new Date(discount.startDate) > now) {
      return false;
    }
    
    if (discount.endDate && new Date(discount.endDate) < now) {
      return false;
    }

    // Check minimum nights requirement
    if (discount.minNights && nights < discount.minNights) {
      return false;
    }

    return true;
  }

  // Method to add booking
  addBooking(bookingId) {
    if (!this.bookings.includes(bookingId)) {
      this.bookings.push(bookingId);
      this.updatedAt = new Date();
    }
  }

  // Method to remove booking
  removeBooking(bookingId) {
    const index = this.bookings.indexOf(bookingId);
    if (index > -1) {
      this.bookings.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Method to add unavailable date
  addUnavailableDate(date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    if (!this.unavailableDates.includes(dateStr)) {
      this.unavailableDates.push(dateStr);
      this.updatedAt = new Date();
    }
  }

  // Method to remove unavailable date
  removeUnavailableDate(date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    const index = this.unavailableDates.indexOf(dateStr);
    if (index > -1) {
      this.unavailableDates.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Method to add discount
  addDiscount(discount) {
    this.discounts.push({
      id: discount.id || `discount_${Date.now()}`,
      type: discount.type, // 'percentage' or 'fixed'
      value: discount.value,
      minNights: discount.minNights || 1,
      startDate: discount.startDate,
      endDate: discount.endDate,
      description: discount.description || ''
    });
    this.updatedAt = new Date();
  }

  // Method to remove discount
  removeDiscount(discountId) {
    this.discounts = this.discounts.filter(discount => discount.id !== discountId);
    this.updatedAt = new Date();
  }

  // Method to update room information
  updateInfo(updates) {
    const allowedFields = [
      'roomNumber', 'type', 'description', 'capacity', 'pricePerNight',
      'images', 'amenities', 'size', 'bedType'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });
    
    this.updatedAt = new Date();
  }

  // Method to activate room
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Method to deactivate room
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Method to set availability
  setAvailability(available) {
    this.isAvailable = available;
    this.updatedAt = new Date();
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

  // Static method to search rooms by criteria
  static searchByCriteria(rooms, criteria) {
    return rooms.filter(room => {
      let matches = true;
      
      if (criteria.type && room.type !== criteria.type) {
        matches = false;
      }
      
      if (criteria.maxPrice && room.pricePerNight > criteria.maxPrice) {
        matches = false;
      }
      
      if (criteria.minCapacity && room.capacity < criteria.minCapacity) {
        matches = false;
      }
      
      if (criteria.amenities && criteria.amenities.length > 0) {
        const hasAllAmenities = criteria.amenities.every(amenity => 
          room.amenities.includes(amenity)
        );
        if (!hasAllAmenities) {
          matches = false;
        }
      }
      
      if (criteria.checkIn && criteria.checkOut) {
        if (!room.isAvailableForDates(criteria.checkIn, criteria.checkOut)) {
          matches = false;
        }
      }
      
      return matches && room.isActive && room.isAvailable;
    });
  }

  // Method to get room statistics
  getStats() {
    return {
      totalBookings: this.bookings.length,
      unavailableDays: this.unavailableDates.length,
      activeDiscounts: this.discounts.length,
      pricePerNight: this.pricePerNight,
      capacity: this.capacity,
      isActive: this.isActive,
      isAvailable: this.isAvailable
    };
  }

  // Method to get public room information
  getPublicInfo() {
    return {
      id: this.id,
      roomNumber: this.roomNumber,
      type: this.type,
      description: this.description,
      capacity: this.capacity,
      pricePerNight: this.pricePerNight,
      currency: this.currency,
      images: this.images,
      amenities: this.amenities,
      size: this.size,
      bedType: this.bedType,
      isAvailable: this.isAvailable
    };
  }

  // Method to get detailed information (for owner/admin)
  getDetailedInfo() {
    return {
      ...this.getPublicInfo(),
      hotelId: this.hotelId,
      bookings: this.bookings,
      unavailableDates: this.unavailableDates,
      discounts: this.discounts,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Room;
