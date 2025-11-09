const RoomModel = require('../models/roomModel');
const HotelModel = require('../models/hotelModel');
const Room = require('../classes/Room');

// Create Room Controller
const createRoom = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { hotelId, name, type, description, pricePerNight, capacity, amenities, images } = req.body;

    if (!hotelId || !name || !type || !pricePerNight || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'hotelId, name, type, pricePerNight, and capacity are required'
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or you do not have permission'
      });
    }

    // Create room instance using OOP
    const roomData = {
      hotelId,
      name,
      type,
      description: description || '',
      pricePerNight,
      capacity,
      amenities: amenities || [],
      images: images || [],
      isAvailable: true,
      isActive: true
    };

    const roomInstance = new Room(roomData);

    // Validate using OOP method
    const validationErrors = roomInstance.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Save to database
    const newRoom = new RoomModel({
      hotelId: roomInstance.hotelId,
      name: roomInstance.name,
      type: roomInstance.type,
      description: roomInstance.description,
      pricePerNight: roomInstance.pricePerNight,
      capacity: roomInstance.capacity,
      amenities: roomInstance.amenities,
      images: roomInstance.images,
      isAvailable: roomInstance.isAvailable,
      isActive: roomInstance.isActive
    });

    await newRoom.save();
    roomInstance.id = newRoom._id;

    // Add room to hotel
    await HotelModel.findByIdAndUpdate(hotelId, {
      $push: { rooms: newRoom._id }
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: roomInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating room'
    });
  }
};

// Get Rooms for Hotel Controller
const getHotelRooms = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { hotelId } = req.params;

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or you do not have permission'
      });
    }

    const dbRooms = await RoomModel.find({ hotelId }).sort({ createdAt: -1 });

    const roomsData = dbRooms.map(dbRoom => {
      const roomData = {
        id: dbRoom._id,
        hotelId: dbRoom.hotelId,
        name: dbRoom.name,
        type: dbRoom.type,
        description: dbRoom.description,
        pricePerNight: dbRoom.pricePerNight,
        capacity: dbRoom.capacity,
        amenities: dbRoom.amenities,
        images: dbRoom.images,
        isAvailable: dbRoom.isAvailable,
        isActive: dbRoom.isActive
      };
      const roomInstance = new Room(roomData);
      return roomInstance.getPublicInfo();
    });

    res.json({
      success: true,
      count: roomsData.length,
      rooms: roomsData
    });

  } catch (error) {
    console.error('Get hotel rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rooms'
    });
  }
};

// Get Room Details Controller
const getRoomDetails = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { roomId } = req.params;

    const dbRoom = await RoomModel.findById(roomId);
    if (!dbRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: dbRoom.hotelId, ownerId });
    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this room'
      });
    }

    const roomData = {
      id: dbRoom._id,
      hotelId: dbRoom.hotelId,
      name: dbRoom.name,
      type: dbRoom.type,
      description: dbRoom.description,
      pricePerNight: dbRoom.pricePerNight,
      capacity: dbRoom.capacity,
      amenities: dbRoom.amenities,
      images: dbRoom.images,
      isAvailable: dbRoom.isAvailable,
      isActive: dbRoom.isActive
    };

    const roomInstance = new Room(roomData);

    res.json({
      success: true,
      room: roomInstance.getDetailedInfo()
    });

  } catch (error) {
    console.error('Get room details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching room details'
    });
  }
};

// Update Room Controller
const updateRoom = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { roomId } = req.params;
    const updates = req.body;

    const dbRoom = await RoomModel.findById(roomId);
    if (!dbRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: dbRoom.hotelId, ownerId });
    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this room'
      });
    }

    // Create room instance and apply updates
    const roomData = {
      id: dbRoom._id,
      hotelId: dbRoom.hotelId,
      name: dbRoom.name,
      type: dbRoom.type,
      description: dbRoom.description,
      pricePerNight: dbRoom.pricePerNight,
      capacity: dbRoom.capacity,
      amenities: dbRoom.amenities,
      images: dbRoom.images,
      isAvailable: dbRoom.isAvailable,
      isActive: dbRoom.isActive
    };

    const roomInstance = new Room(roomData);
    roomInstance.updateInfo(updates);

    // Validate updates
    const validationErrors = roomInstance.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Update in database
    await RoomModel.findByIdAndUpdate(roomId, {
      name: roomInstance.name,
      type: roomInstance.type,
      description: roomInstance.description,
      pricePerNight: roomInstance.pricePerNight,
      capacity: roomInstance.capacity,
      amenities: roomInstance.amenities,
      images: roomInstance.images,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Room updated successfully',
      room: roomInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating room'
    });
  }
};

// Delete Room Controller
const deleteRoom = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { roomId } = req.params;

    const dbRoom = await RoomModel.findById(roomId);
    if (!dbRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: dbRoom.hotelId, ownerId });
    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this room'
      });
    }

    // Remove room from hotel
    await HotelModel.findByIdAndUpdate(dbRoom.hotelId, {
      $pull: { rooms: roomId }
    });

    // Delete room
    await RoomModel.findByIdAndDelete(roomId);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting room'
    });
  }
};

// Toggle Room Availability Controller
const toggleRoomAvailability = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { roomId } = req.params;

    const dbRoom = await RoomModel.findById(roomId);
    if (!dbRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: dbRoom.hotelId, ownerId });
    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this room'
      });
    }

    const roomInstance = new Room({
      id: dbRoom._id,
      hotelId: dbRoom.hotelId,
      name: dbRoom.name,
      type: dbRoom.type,
      pricePerNight: dbRoom.pricePerNight,
      capacity: dbRoom.capacity,
      amenities: dbRoom.amenities,
      isAvailable: dbRoom.isAvailable,
      isActive: dbRoom.isActive
    });

    roomInstance.setAvailability(!dbRoom.isAvailable);

    await RoomModel.findByIdAndUpdate(roomId, {
      isAvailable: roomInstance.isAvailable
    });

    res.json({
      success: true,
      message: `Room ${roomInstance.isAvailable ? 'activated' : 'deactivated'} successfully`,
      room: roomInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Toggle room availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating room availability'
    });
  }
};

// Get Available Rooms for Hotel (Public - for customers)
const getAvailableRooms = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut, guests } = req.query;

    // Get all rooms for the hotel
    const dbRooms = await RoomModel.find({ hotelId, isActive: true }).sort({ pricePerNight: 1 });

    // If dates are provided, check availability
    let availableRooms = [];
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      // Get all bookings that overlap with the requested dates
      const BookingModel = require('../models/bookingModel');
      const BookingRoomModel = require('../models/bookingRoomModel');
      
      const overlappingBookings = await BookingModel.find({
        hotelId,
        status: { $in: ['pending', 'confirmed', 'active'] },
        $or: [
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        ]
      }).select('_id').lean();

      // Get all booking rooms for these bookings
      const bookingIds = overlappingBookings.map(b => b._id);
      const bookedRooms = await BookingRoomModel.find({
        booking: { $in: bookingIds }
      }).populate('room').lean();

      // Create a map of room IDs to booked quantities
      const roomBookings = {};
      bookedRooms.forEach(bookingRoom => {
        if (bookingRoom.room && bookingRoom.room._id) {
          const roomId = bookingRoom.room._id.toString();
          roomBookings[roomId] = (roomBookings[roomId] || 0) + (bookingRoom.quantity || 1);
        }
      });

      // Filter rooms by availability and capacity
      availableRooms = dbRooms
        .filter(room => {
          // Check if room is available
          if (!room.isAvailable) return false;
          
          // Check capacity
          if (guests && room.capacity < parseInt(guests)) return false;
          
          // For now, we assume each room can only be booked once
          // In a real system, you'd check if there are enough available rooms
          const roomId = room._id.toString();
          const bookedQuantity = roomBookings[roomId] || 0;
          
          // Assume each room can only be booked once (simplified)
          return bookedQuantity === 0;
        })
        .map(room => {
          const roomData = {
            id: room._id,
            hotelId: room.hotelId,
            name: room.name,
            type: room.type,
            description: room.description,
            pricePerNight: room.pricePerNight,
            capacity: room.capacity,
            amenities: room.amenities || [],
            images: room.images || [],
            isAvailable: true,
            isActive: room.isActive
          };
          const roomInstance = new Room(roomData);
          return roomInstance.getPublicInfo();
        });
    } else {
      // If no dates provided, return all active rooms
      availableRooms = dbRooms
        .filter(room => {
          if (!room.isAvailable) return false;
          if (guests && room.capacity < parseInt(guests)) return false;
          return true;
        })
        .map(room => {
          const roomData = {
            id: room._id,
            hotelId: room.hotelId,
            name: room.name,
            type: room.type,
            description: room.description,
            pricePerNight: room.pricePerNight,
            capacity: room.capacity,
            amenities: room.amenities || [],
            images: room.images || [],
            isAvailable: room.isAvailable,
            isActive: room.isActive
          };
          const roomInstance = new Room(roomData);
          return roomInstance.getPublicInfo();
        });
    }

    res.json({
      success: true,
      count: availableRooms.length,
      rooms: availableRooms
    });

  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rooms'
    });
  }
};

module.exports = {
  createRoom,
  getHotelRooms,
  getRoomDetails,
  updateRoom,
  deleteRoom,
  toggleRoomAvailability,
  getAvailableRooms
};

