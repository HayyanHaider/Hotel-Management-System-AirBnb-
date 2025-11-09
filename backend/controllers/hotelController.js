const HotelModel = require('../models/hotelModel');
const Hotel = require('../classes/Hotel');
const Room = require('../classes/Room');

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
      images: images || [],
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
        country: hotelInstance.country || location?.country || ''
      },
      amenities: hotelInstance.amenities,
      images: hotelInstance.images,
      contactInfo: hotelInstance.contactInfo,
      pricing: {
        basePrice: pricing?.basePrice || 0,
        cleaningFee: pricing?.cleaningFee || 0,
        serviceFee: pricing?.serviceFee || 0
      },
      capacity: {
        guests: capacity?.guests || 1,
        bedrooms: capacity?.bedrooms || 1,
        bathrooms: capacity?.bathrooms || 1
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
      sort.ratingCount = order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const dbHotels = await HotelModel.find(searchCriteria)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

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

    if (checkIn && checkOut && guests) {
      filteredHotels = filteredHotels.filter(hotel => 
        hotel.hasAvailableRooms(new Date(checkIn), new Date(checkOut), parseInt(guests))
      );
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

    res.json({
      success: true,
      count: hotelsData.length,
      hotels: hotelsData
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

// Update Hotel Controller (Hotel Owner only)
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
    if (images !== undefined) updateData.images = images;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    
    if (location) {
      updateData.location = {
        address: location.address || dbHotel.location?.address || '',
        city: location.city || dbHotel.location?.city || '',
        state: location.state || dbHotel.location?.state || '',
        zipCode: location.zipCode || dbHotel.location?.zipCode || '',
        country: location.country || dbHotel.location?.country || ''
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

// Get Hotel Owner's Hotels Controller
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

// Delete Hotel Controller (Hotel Owner only)
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
