const HotelModel = require('../models/hotelModel');
const Hotel = require('../classes/Hotel');
const Room = require('../classes/Room');

// Create Hotel Controller
const createHotel = async (req, res) => {
  try {
    const { name, description, address, amenities, images, contactInfo } = req.body;
    const ownerId = req.user.userId;

    // Create hotel instance using OOP
    const hotelData = {
      name,
      description,
      address,
      amenities: amenities || [],
      images: images || [],
      contactInfo,
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
      address: hotelInstance.address,
      amenities: hotelInstance.amenities,
      images: hotelInstance.images,
      contactInfo: hotelInstance.contactInfo,
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
      isApproved: true
    };

    if (location) {
      searchCriteria.$or = [
        { 'address.city': { $regex: location, $options: 'i' } },
        { 'address.state': { $regex: location, $options: 'i' } },
        { 'address.country': { $regex: location, $options: 'i' } }
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
        address: dbHotel.address,
        amenities: dbHotel.amenities,
        images: dbHotel.images,
        contactInfo: dbHotel.contactInfo,
        ownerId: dbHotel.ownerId,
        rooms: dbHotel.rooms || [],
        rating: dbHotel.rating,
        totalReviews: dbHotel.totalReviews,
        isApproved: dbHotel.isApproved,
        createdAt: dbHotel.createdAt
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

    const dbHotel = await HotelModel.findById(hotelId).populate('rooms');
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
      address: dbHotel.address,
      amenities: dbHotel.amenities,
      images: dbHotel.images,
      contactInfo: dbHotel.contactInfo,
      ownerId: dbHotel.ownerId,
      rooms: dbHotel.rooms || [],
      rating: dbHotel.rating,
      totalReviews: dbHotel.totalReviews,
      isApproved: dbHotel.isApproved,
      createdAt: dbHotel.createdAt
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
    const updates = req.body;

    const dbHotel = await HotelModel.findOne({ _id: hotelId, ownerId });
    if (!dbHotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or you do not have permission to update it'
      });
    }

    // Create hotel instance and apply updates
    const hotelData = {
      id: dbHotel._id,
      name: dbHotel.name,
      description: dbHotel.description,
      address: dbHotel.address,
      amenities: dbHotel.amenities,
      images: dbHotel.images,
      contactInfo: dbHotel.contactInfo,
      ownerId: dbHotel.ownerId,
      rooms: dbHotel.rooms || [],
      rating: dbHotel.rating,
      totalReviews: dbHotel.totalReviews,
      isApproved: dbHotel.isApproved,
      createdAt: dbHotel.createdAt
    };

    const hotelInstance = new Hotel(hotelData);
    hotelInstance.updateInfo(updates);

    // Validate updates
    const validationErrors = hotelInstance.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Update in database
    await HotelModel.findByIdAndUpdate(hotelId, {
      name: hotelInstance.name,
      description: hotelInstance.description,
      address: hotelInstance.address,
      amenities: hotelInstance.amenities,
      images: hotelInstance.images,
      contactInfo: hotelInstance.contactInfo,
      updatedAt: new Date()
    });

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

module.exports = {
  createHotel,
  getHotels,
  getHotelDetails,
  updateHotel
};
