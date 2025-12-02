const BaseService = require('./BaseService');
const IHotelService = require('./interfaces/IHotelService');
const HotelRepository = require('../repositories/HotelRepository');
const BookingRepository = require('../repositories/BookingRepository');
const Hotel = require('../classes/Hotel');

/**
 * HotelService - Handles hotel business logic
 * Follows Single Responsibility Principle - only handles hotel operations
 * Follows Dependency Inversion Principle - depends on repository abstractions
 * Implements IHotelService interface
 */
class HotelService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
    this.bookingRepository = dependencies.bookingRepository || BookingRepository;
  }

  /**
   * Normalize date to start of day
   * @private
   */
  #normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Check if hotel is available for date range
   * @private
   */
  async #isHotelAvailableForRange(hotelId, totalRooms, checkInDate, checkOutDate) {
    const bookings = await this.bookingRepository.findOverlapping(
      hotelId,
      checkInDate,
      checkOutDate,
      ['cancelled']
    );

    if (bookings.length === 0) {
      return true;
    }

    const start = this.#normalizeDate(checkInDate);
    const end = this.#normalizeDate(checkOutDate);

    for (let day = new Date(start); day < end; day.setDate(day.getDate() + 1)) {
      const currentDay = this.#normalizeDate(day);
      const roomsBooked = bookings.reduce((count, booking) => {
        const bookingCheckIn = this.#normalizeDate(booking.checkIn);
        const bookingCheckOut = this.#normalizeDate(booking.checkOut);
        if (currentDay >= bookingCheckIn && currentDay < bookingCheckOut) {
          return count + 1;
        }
        return count;
      }, 0);

      if (roomsBooked >= totalRooms) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create a new hotel
   */
  async createHotel(hotelData, ownerId) {
    try {
      this.validateRequired({ ownerId }, ['ownerId']);

      const hotelInstance = new Hotel({
        ...hotelData,
        ownerId
      });

      const validationErrors = hotelInstance.validate();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const savedHotel = await this.hotelRepository.create({
        name: hotelInstance.name,
        description: hotelInstance.description,
        location: hotelData.location || {},
        amenities: hotelInstance.amenities,
        images: hotelInstance.images,
        pricing: hotelData.pricing || {},
        capacity: hotelData.capacity || {},
        totalRooms: hotelInstance.totalRooms,
        ownerId: hotelInstance.ownerId,
        isApproved: false,
        rating: 0,
        totalReviews: 0
      });

      hotelInstance.id = savedHotel._id || savedHotel.id;

      return hotelInstance.getBasicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to create hotel');
    }
  }

  /**
   * Get hotels with filters
   */
  async getHotels(filters = {}, options = {}) {
    try {
      const searchCriteria = {
        isApproved: true,
        isSuspended: false
      };

      // Apply location filter
      if (filters.location) {
        searchCriteria.$or = [
          { 'location.city': { $regex: filters.location, $options: 'i' } },
          { 'location.state': { $regex: filters.location, $options: 'i' } },
          { 'location.country': { $regex: filters.location, $options: 'i' } }
        ];
      }

      // Apply amenities filter
      if (filters.amenities && filters.amenities.length > 0) {
        const amenityList = Array.isArray(filters.amenities) 
          ? filters.amenities 
          : String(filters.amenities).split(',');
        searchCriteria.amenities = { $all: amenityList };
      }

      // Apply rating filter
      if (filters.minRating) {
        searchCriteria.ratingAvg = { $gte: Number(filters.minRating) };
      }

      // Build sort options
      const sortOptions = {};
      if (options.sortBy === 'rating') {
        sortOptions.ratingAvg = options.order === 'desc' ? -1 : 1;
      } else if (options.sortBy === 'popularity') {
        sortOptions.totalReviews = options.order === 'desc' ? -1 : 1;
      } else {
        sortOptions.createdAt = -1;
      }

      // Fetch hotels
      const dbHotels = await this.hotelRepository.find(searchCriteria, {
        sort: sortOptions,
        limit: options.limit || 50,
        skip: (options.page - 1) * (options.limit || 50)
      });

      // Convert to OOP instances
      const hotelInstances = dbHotels.map(dbHotel => new Hotel(dbHotel));

      // Apply additional filters
      let filteredHotels = hotelInstances;

      // Filter by guests capacity
      if (filters.guests) {
        filteredHotels = filteredHotels.filter(hotel =>
          hotel.hasAvailableCapacity(parseInt(filters.guests))
        );
      }

      // Filter by date availability
      if (filters.checkIn && filters.checkOut) {
        const checkInDate = new Date(filters.checkIn);
        const checkOutDate = new Date(filters.checkOut);
        const hotelIds = filteredHotels.map(h => h.id).filter(Boolean);

        const availabilityChecks = await Promise.all(
          hotelIds.map(async (hotelId) => {
            const hotel = filteredHotels.find(h => h.id === hotelId);
            if (!hotel) return false;

            const isAvailable = await this.#isHotelAvailableForRange(
              hotelId,
              hotel.totalRooms,
              checkInDate,
              checkOutDate
            );

            return isAvailable && hotel.hasAvailableRooms(checkInDate, checkOutDate, filters.guests || 1);
          })
        );

        filteredHotels = filteredHotels.filter((_, index) => 
          availabilityChecks[index]
        );
      }

      // Filter by price
      if (filters.minPrice || filters.maxPrice) {
        filteredHotels = filteredHotels.filter(hotel => {
          const priceRange = hotel.getPriceRange();
          if (filters.minPrice && priceRange.min < parseFloat(filters.minPrice)) return false;
          if (filters.maxPrice && priceRange.max > parseFloat(filters.maxPrice)) return false;
          return true;
        });
      }

      // Sort by price if needed
      if (options.sortBy === 'price') {
        filteredHotels = this.sort(
          filteredHotels,
          (h) => h.getPriceRange().min,
          options.order || 'asc'
        );
      }

      const hotelsData = filteredHotels.map(hotel => hotel.getSearchResult());

      // Get total count for pagination
      const totalCount = await this.hotelRepository.count(searchCriteria);

      return {
        hotels: hotelsData,
        count: hotelsData.length,
        total: totalCount,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 50,
          total: totalCount,
          pages: Math.ceil(totalCount / (options.limit || 50))
        }
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch hotels');
    }
  }

  /**
   * Get hotel by ID
   */
  async getHotelById(hotelId) {
    try {
      if (!hotelId) {
        throw new Error('Hotel ID is required');
      }

      const dbHotel = await this.hotelRepository.findById(hotelId);
      if (!dbHotel) {
        throw new Error('Hotel not found');
      }

      const hotelInstance = new Hotel(dbHotel);
      return hotelInstance.getDetailedInfo();
    } catch (error) {
      this.handleError(error, 'Failed to fetch hotel');
    }
  }

  /**
   * Update hotel
   */
  async updateHotel(hotelId, updates, ownerId) {
    try {
      if (!hotelId || !ownerId) {
        throw new Error('Hotel ID and Owner ID are required');
      }

      // Verify ownership
      const existingHotel = await this.hotelRepository.findOne({
        _id: hotelId,
        ownerId
      });

      if (!existingHotel) {
        throw new Error('Hotel not found or you do not have permission to update it');
      }

      // Prepare update data
      const updateData = {};
      const allowedFields = ['name', 'description', 'amenities', 'images', 'location', 'pricing', 'capacity', 'totalRooms'];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      if (updates.location) {
        updateData.location = {
          ...existingHotel.location,
          ...updates.location
        };
      }

      if (updates.pricing) {
        updateData.pricing = {
          ...existingHotel.pricing,
          ...updates.pricing
        };
      }

      if (updates.capacity) {
        updateData.capacity = {
          ...existingHotel.capacity,
          ...updates.capacity
        };
      }

      // Update in database
      const updatedHotel = await this.hotelRepository.updateById(hotelId, updateData);
      const hotelInstance = new Hotel(updatedHotel);

      return hotelInstance.getBasicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to update hotel');
    }
  }

  /**
   * Delete hotel
   */
  async deleteHotel(hotelId, ownerId) {
    try {
      if (!hotelId || !ownerId) {
        throw new Error('Hotel ID and Owner ID are required');
      }

      // Verify ownership
      const existingHotel = await this.hotelRepository.findOne({
        _id: hotelId,
        ownerId
      });

      if (!existingHotel) {
        throw new Error('Hotel not found or you do not have permission to delete it');
      }

      await this.hotelRepository.deleteById(hotelId);
      return true;
    } catch (error) {
      this.handleError(error, 'Failed to delete hotel');
    }
  }

  /**
   * Get owner's hotels
   */
  async getOwnerHotels(ownerId) {
    try {
      if (!ownerId) {
        throw new Error('Owner ID is required');
      }

      const dbHotels = await this.hotelRepository.findByOwner(ownerId, {
        sort: { createdAt: -1 }
      });

      const hotelInstances = dbHotels.map(dbHotel => new Hotel(dbHotel));
      return hotelInstances.map(hotel => hotel.getSearchResult());
    } catch (error) {
      this.handleError(error, 'Failed to fetch owner hotels');
    }
  }
}

module.exports = new HotelService();

