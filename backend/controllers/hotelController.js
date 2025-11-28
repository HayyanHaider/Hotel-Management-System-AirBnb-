const HotelModel = require('../models/hotelModel');
const BookingModel = require('../models/bookingModel');
const Hotel = require('../classes/Hotel');
const Room = require('../classes/Room');

const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const isHotelAvailableForRange = (bookings, totalRooms, checkInDate, checkOutDate) => {
  if (!bookings || bookings.length === 0) {
    return true;
  }

  const start = normalizeDate(checkInDate);
  const end = normalizeDate(checkOutDate);

  for (let day = new Date(start); day < end; day.setDate(day.getDate() + 1)) {
    const currentDay = normalizeDate(day);
    const roomsBooked = bookings.reduce((count, booking) => {
      const bookingCheckIn = normalizeDate(booking.checkIn);
      const bookingCheckOut = normalizeDate(booking.checkOut);
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
};

// Create Hotel Controller
const createHotel = async (req, res) => {
  try {
    const { name, description, location, amenities, images, contactInfo, pricing, capacity, totalRooms } = req.body;
    const ownerId = req.user.userId;

    // Create hotel instance using OOP
    const hotelData = {
      name,
      description,
      location: location || {},
      address: location?.address || '',
      city: location?.city || '',
      state: location?.state || '',
      country: location?.country || '',
      amenities: amenities || [],
      images: Array.isArray(images) 
        ? images.map(img => typeof img === 'string' ? img : (img?.url || String(img)))
        : [],
      contactInfo: contactInfo || {},
      pricing: pricing || {},
      capacity: capacity || {},
      ownerId
    };

    const hotelInstance = new Hotel(hotelData);

    // Validate using OOP method
    const validationErrors = hotelInstance.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Save to database
    const newHotel = new HotelModel({
      name: hotelInstance.name,
      description: hotelInstance.description,
      location: {
        address: hotelInstance.address || location?.address || '',
        city: hotelInstance.city || location?.city || '',
        state: hotelInstance.state || location?.state || '',
        zipCode: location?.zipCode || '',
        country: hotelInstance.country || location?.country || '',
        coordinates: {
          lat: location?.coordinates?.lat || null,
          lng: location?.coordinates?.lng || null
        }
      },
      amenities: hotelInstance.amenities,
      images: hotelInstance.images,
      contactInfo: hotelInstance.contactInfo || {},
      pricing: pricing && typeof pricing === 'object' ? {
        basePrice: pricing.basePrice || 0,
        cleaningFee: pricing.cleaningFee || 0,
        serviceFee: pricing.serviceFee || 0
      } : {
        basePrice: 0,
        cleaningFee: 0,
        serviceFee: 0
      },
      capacity: capacity && typeof capacity === 'object' ? {
        guests: capacity.guests || 1,
        bedrooms: capacity.bedrooms || 1,
        bathrooms: capacity.bathrooms || 1
      } : {
        guests: 1,
        bedrooms: 1,
        bathrooms: 1
      },
      totalRooms: totalRooms || 1,
      ownerId: hotelInstance.ownerId,
      isApproved: false, // Requires admin approval
      rating: 0,
      totalReviews: 0
    });

    await newHotel.save();
    hotelInstance.id = newHotel._id;

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully and pending approval',
      hotel: hotelInstance.getBasicInfo()
    });

  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating hotel'
    });
  }
};

// Get Hotels Controller
const getHotels = async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests, minPrice, maxPrice, amenities, minRating, sortBy, order = 'asc', page = 1, limit = 10 } = req.query;

    // Build search criteria
    const searchCriteria = {
      isApproved: true,
      isSuspended: false
    };

    if (location) {
      searchCriteria.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }

    // Amenities filter
    if (amenities) {
      const list = Array.isArray(amenities) ? amenities : String(amenities).split(',');
      searchCriteria.amenities = { $all: list };
    }

    // Rating filter
    if (minRating) {
      searchCriteria.ratingAvg = { $gte: Number(minRating) };
    }

    const sort = {};
    if (sortBy === 'price') {
      // sort by min room price via post-processing below
    } else if (sortBy === 'rating') {
      sort.ratingAvg = order === 'desc' ? -1 : 1;
    } else if (sortBy === 'popularity') {
      sort.totalReviews = order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    // Default limit to 50 if not specified to show more hotels
    const queryLimit = limit ? Number(limit) : 50;
    const queryPage = page ? Number(page) : 1;
    
    const dbHotels = await HotelModel.find(searchCriteria)
      .sort(sort)
      .limit(queryLimit)
      .skip((queryPage - 1) * queryLimit);

    // Convert to OOP instances and apply filters
    const hotelInstances = dbHotels.map(dbHotel => {
      const hotelData = {
        id: dbHotel._id,
        name: dbHotel.name,
        description: dbHotel.description,
        location: dbHotel.location,
        address: dbHotel.location?.address || '',
        city: dbHotel.location?.city || '',
        state: dbHotel.location?.state || '',
        country: dbHotel.location?.country || '',
        amenities: dbHotel.amenities || [],
        images: dbHotel.images || [],
        contactInfo: dbHotel.contactInfo || {},
        pricing: dbHotel.pricing || {},
        capacity: dbHotel.capacity || {},
        totalRooms: dbHotel.totalRooms || 1,
        ownerId: dbHotel.ownerId,
        rating: dbHotel.rating || 0,
        totalReviews: dbHotel.totalReviews || 0,
        isApproved: dbHotel.isApproved,
        isSuspended: dbHotel.isSuspended,
        createdAt: dbHotel.createdAt,
        updatedAt: dbHotel.updatedAt
      };
      return new Hotel(hotelData);
    });

    // Apply search filters using OOP methods
    let filteredHotels = hotelInstances;

    const requestedGuests = guests ? parseInt(guests, 10) : null;
    const parsedCheckIn = checkIn ? new Date(checkIn) : null;
    const parsedCheckOut = checkOut ? new Date(checkOut) : null;

    if (requestedGuests) {
      filteredHotels = filteredHotels.filter(hotel =>
        hotel.hasAvailableCapacity(requestedGuests)
      );
    }

    if (parsedCheckIn && parsedCheckOut) {
      const hotelIds = filteredHotels.map(hotel => hotel.id).filter(Boolean);
      let bookingsByHotel = {};

      if (hotelIds.length > 0) {
        const overlappingBookings = await BookingModel.find({
          hotelId: { $in: hotelIds },
          status: { $in: ['confirmed', 'active', 'checked-in'] },
          checkIn: { $lt: parsedCheckOut },
          checkOut: { $gt: parsedCheckIn }
        });

        bookingsByHotel = overlappingBookings.reduce((acc, booking) => {
          const id = booking.hotelId?.toString();
          if (!id) return acc;
          if (!acc[id]) {
            acc[id] = [];
          }
          acc[id].push(booking);
          return acc;
        }, {});
      }

      filteredHotels = filteredHotels.filter(hotel => {
        if (!hotel.hasAvailableRooms(parsedCheckIn, parsedCheckOut, requestedGuests || 1)) {
          return false;
        }

        const hotelId = hotel.id?.toString();
        const bookings = hotelId ? bookingsByHotel[hotelId] : [];
        const totalRooms = hotel.totalRooms || 1;
        return isHotelAvailableForRange(bookings, totalRooms, parsedCheckIn, parsedCheckOut);
      });
    }

    if (minPrice || maxPrice) {
      filteredHotels = filteredHotels.filter(hotel => {
        const priceRange = hotel.getPriceRange();
        if (minPrice && priceRange.min < parseFloat(minPrice)) return false;
        if (maxPrice && priceRange.max > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Optional price sort (requires computing price range)
    if (sortBy === 'price') {
      filteredHotels.sort((a, b) => {
        const pa = a.getPriceRange();
        const pb = b.getPriceRange();
        const va = pa.min ?? 0;
        const vb = pb.min ?? 0;
        return (order === 'desc' ? vb - va : va - vb);
      });
    }

    const hotelsData = filteredHotels.map(hotel => hotel.getSearchResult());
    
    // Get total count for pagination (before filtering by date/price)
    const totalCount = await HotelModel.countDocuments(searchCriteria);

    res.json({
      success: true,
      count: hotelsData.length,
      total: totalCount,
      hotels: hotelsData,
      pagination: {
        page: queryPage,
        limit: queryLimit,
        total: totalCount,
        pages: Math.ceil(totalCount / queryLimit)
      }
    });

  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hotels'
    });
  }
};

// Get Hotel Details Controller
const getHotelDetails = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const dbHotel = await HotelModel.findById(hotelId);
    if (!dbHotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Create hotel instance using OOP
    const hotelData = {
      id: dbHotel._id,
      name: dbHotel.name,
      description: dbHotel.description,
      location: dbHotel.location,
      address: dbHotel.location?.address || '',
      city: dbHotel.location?.city || '',
      state: dbHotel.location?.state || '',
      country: dbHotel.location?.country || '',
      amenities: dbHotel.amenities || [],
      images: Array.isArray(dbHotel.images) 
        ? dbHotel.images.map(img => {
            // Ensure images are strings
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object' && img.url) return img.url;
            return String(img || '');
          }).filter(img => img && img !== '')
        : [],
      contactInfo: dbHotel.contactInfo || {},
      pricing: dbHotel.pricing || {},
      capacity: dbHotel.capacity || {},
      totalRooms: dbHotel.totalRooms || 1,
      ownerId: dbHotel.ownerId,
      rating: dbHotel.rating || 0,
      totalReviews: dbHotel.totalReviews || 0,
      isApproved: dbHotel.isApproved,
      isSuspended: dbHotel.isSuspended,
      suspensionReason: dbHotel.suspensionReason || '',
      rejectionReason: dbHotel.rejectionReason || '',
      createdAt: dbHotel.createdAt,
      updatedAt: dbHotel.updatedAt
    };

    const hotelInstance = new Hotel(hotelData);

    res.json({
      success: true,
      hotel: hotelInstance.getDetailedInfo()
    });

  } catch (error) {
    console.error('Get hotel details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hotel details'
    });
  }
};

// Update Hotel Controller (Hotel only)
const updateHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const ownerId = req.user.userId;
    const { name, description, location, amenities, images, contactInfo, pricing, capacity, totalRooms } = req.body;

    const dbHotel = await HotelModel.findOne({ _id: hotelId, ownerId });
    if (!dbHotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or you do not have permission to update it'
      });
    }

    // Prepare update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (images !== undefined) {
      // Ensure images are stored as strings, not objects
      updateData.images = Array.isArray(images) 
        ? images.map(img => typeof img === 'string' ? img : (img?.url || String(img)))
        : [];
    }
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    
    if (location) {
      updateData.location = {
        address: location.address || dbHotel.location?.address || '',
        city: location.city || dbHotel.location?.city || '',
        state: location.state || dbHotel.location?.state || '',
        zipCode: location.zipCode || dbHotel.location?.zipCode || '',
        country: location.country || dbHotel.location?.country || '',
        coordinates: {
          lat: location.coordinates?.lat !== undefined ? location.coordinates.lat : (dbHotel.location?.coordinates?.lat || null),
          lng: location.coordinates?.lng !== undefined ? location.coordinates.lng : (dbHotel.location?.coordinates?.lng || null)
        }
      };
    }
    
    if (pricing) {
      updateData.pricing = {
        basePrice: pricing.basePrice !== undefined ? pricing.basePrice : (dbHotel.pricing?.basePrice || 0),
        cleaningFee: pricing.cleaningFee !== undefined ? pricing.cleaningFee : (dbHotel.pricing?.cleaningFee || 0),
        serviceFee: pricing.serviceFee !== undefined ? pricing.serviceFee : (dbHotel.pricing?.serviceFee || 0)
      };
    }
    
    if (capacity) {
      updateData.capacity = {
        guests: capacity.guests !== undefined ? capacity.guests : (dbHotel.capacity?.guests || 1),
        bedrooms: capacity.bedrooms !== undefined ? capacity.bedrooms : (dbHotel.capacity?.bedrooms || 1),
        bathrooms: capacity.bathrooms !== undefined ? capacity.bathrooms : (dbHotel.capacity?.bathrooms || 1)
      };
    }
    if (totalRooms !== undefined) {
      updateData.totalRooms = totalRooms;
    }

    updateData.updatedAt = new Date();

    // Update in database
    await HotelModel.findByIdAndUpdate(hotelId, updateData);

    // Fetch updated hotel
    const updatedHotel = await HotelModel.findById(hotelId);
    const hotelData = {
      id: updatedHotel._id,
      name: updatedHotel.name,
      description: updatedHotel.description,
      location: updatedHotel.location,
      amenities: updatedHotel.amenities,
      images: updatedHotel.images,
      contactInfo: updatedHotel.contactInfo,
      pricing: updatedHotel.pricing,
      capacity: updatedHotel.capacity,
      ownerId: updatedHotel.ownerId,
      rooms: updatedHotel.rooms || [],
      rating: updatedHotel.rating,
      totalReviews: updatedHotel.totalReviews,
      isApproved: updatedHotel.isApproved,
      createdAt: updatedHotel.createdAt
    };

    const hotelInstance = new Hotel(hotelData);

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      hotel: hotelInstance.getBasicInfo()
    });

  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating hotel'
    });
  }
};

// Get Hotel's Hotels Controller
const getOwnerHotels = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    // Find all hotels owned by this user (including pending approval)
    const dbHotels = await HotelModel.find({ ownerId })
      .sort({ createdAt: -1 });

    // Convert to OOP instances
    const hotelInstances = dbHotels.map(dbHotel => {
      const hotelData = {
        id: dbHotel._id,
        name: dbHotel.name,
        description: dbHotel.description,
        location: dbHotel.location,
        address: dbHotel.location?.address || '',
        city: dbHotel.location?.city || '',
        state: dbHotel.location?.state || '',
        country: dbHotel.location?.country || '',
        amenities: dbHotel.amenities || [],
        images: dbHotel.images || [],
        contactInfo: dbHotel.contactInfo || {},
        pricing: dbHotel.pricing || {},
        capacity: dbHotel.capacity || {},
        ownerId: dbHotel.ownerId,
        rating: dbHotel.rating || 0,
        totalReviews: dbHotel.totalReviews || 0,
        isApproved: dbHotel.isApproved,
        isSuspended: dbHotel.isSuspended,
        suspensionReason: dbHotel.suspensionReason || '',
        rejectionReason: dbHotel.rejectionReason || '',
        createdAt: dbHotel.createdAt,
        updatedAt: dbHotel.updatedAt
      };
      return new Hotel(hotelData);
    });

    const hotelsData = hotelInstances.map(hotel => hotel.getSearchResult());

    res.json({
      success: true,
      count: hotelsData.length,
      hotels: hotelsData
    });

  } catch (error) {
    console.error('Get owner hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your hotels'
    });
  }
};

// Delete Hotel Controller (Hotel only)
const deleteHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const ownerId = req.user.userId;

    const dbHotel = await HotelModel.findOne({ _id: hotelId, ownerId });
    if (!dbHotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or you do not have permission to delete it'
      });
    }

    // Delete hotel
    await HotelModel.findByIdAndDelete(hotelId);

    res.json({
      success: true,
      message: 'Hotel deleted successfully'
    });

  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting hotel'
    });
  }
};

module.exports = {
  createHotel,
  getHotels,
  getHotelDetails,
  getOwnerHotels,
  updateHotel,
  deleteHotel
};
