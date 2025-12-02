const BaseService = require('./BaseService');
const RoomRepository = require('../repositories/RoomRepository');
const HotelRepository = require('../repositories/HotelRepository');
const Room = require('../classes/Room');

/**
 * RoomService - Handles room business logic
 * Follows Single Responsibility Principle - only handles room operations
 * Follows Dependency Inversion Principle - depends on repository abstractions
 */
class RoomService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.roomRepository = dependencies.roomRepository || RoomRepository;
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
  }

  /**
   * Create a new room
   */
  async createRoom(roomData, ownerId) {
    try {
      this.validateRequired(roomData, ['hotelId', 'name', 'type', 'pricePerNight', 'capacity']);
      this.validateRequired({ ownerId }, ['ownerId']);

      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: roomData.hotelId, ownerId });
      if (!hotel) {
        throw new Error('Hotel not found or you do not have permission');
      }

      // Create room instance
      const roomInstance = new Room({
        hotelId: roomData.hotelId,
        name: roomData.name,
        type: roomData.type,
        description: roomData.description || '',
        pricePerNight: roomData.pricePerNight,
        capacity: roomData.capacity,
        amenities: roomData.amenities || [],
        images: roomData.images || [],
        isAvailable: true,
        isActive: true
      });

      // Validate room
      const validationErrors = roomInstance.validate();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Save room
      const savedRoom = await this.roomRepository.create({
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

      roomInstance.id = savedRoom._id || savedRoom.id;

      return roomInstance.getPublicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to create room');
    }
  }

  /**
   * Get rooms for a hotel
   */
  async getHotelRooms(hotelId, ownerId = null) {
    try {
      if (!hotelId) {
        throw new Error('Hotel ID is required');
      }

      // If ownerId provided, verify ownership
      if (ownerId) {
        const hotel = await this.hotelRepository.findOne({ _id: hotelId, ownerId });
        if (!hotel) {
          throw new Error('Hotel not found or you do not have permission');
        }
      }

      const rooms = await this.roomRepository.findByHotel(hotelId, {
        sort: { createdAt: -1 }
      });

      return rooms.map(room => {
        const roomInstance = new Room(room);
        return roomInstance.getPublicInfo();
      });
    } catch (error) {
      this.handleError(error, 'Failed to fetch rooms');
    }
  }

  /**
   * Update room
   */
  async updateRoom(roomId, updates, ownerId) {
    try {
      if (!roomId || !ownerId) {
        throw new Error('Room ID and Owner ID are required');
      }

      const room = await this.roomRepository.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: room.hotelId, ownerId });
      if (!hotel) {
        throw new Error('Not authorized to update this room');
      }

      const allowedFields = ['name', 'type', 'description', 'pricePerNight', 'capacity', 'amenities', 'images', 'isAvailable', 'isActive'];
      const updateData = {};

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      const updatedRoom = await this.roomRepository.updateById(roomId, updateData);
      const roomInstance = new Room(updatedRoom);

      return roomInstance.getPublicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to update room');
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(roomId, ownerId) {
    try {
      if (!roomId || !ownerId) {
        throw new Error('Room ID and Owner ID are required');
      }

      const room = await this.roomRepository.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: room.hotelId, ownerId });
      if (!hotel) {
        throw new Error('Not authorized to delete this room');
      }

      await this.roomRepository.deleteById(roomId);
      return true;
    } catch (error) {
      this.handleError(error, 'Failed to delete room');
    }
  }

  /**
   * Toggle room availability
   */
  async toggleRoomAvailability(roomId, ownerId) {
    try {
      if (!roomId || !ownerId) {
        throw new Error('Room ID and Owner ID are required');
      }

      const room = await this.roomRepository.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: room.hotelId, ownerId });
      if (!hotel) {
        throw new Error('Not authorized to update this room');
      }

      const updatedRoom = await this.roomRepository.updateById(roomId, {
        isAvailable: !room.isAvailable
      });

      const roomInstance = new Room(updatedRoom);
      return roomInstance.getPublicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to toggle room availability');
    }
  }

  /**
   * Get available rooms for a hotel (public endpoint)
   */
  async getAvailableRooms(hotelId, filters = {}) {
    try {
      if (!hotelId) {
        throw new Error('Hotel ID is required');
      }

      const rooms = await this.roomRepository.findAvailable(hotelId, {
        sort: { pricePerNight: 1 }
      });

      // Filter by capacity if guests specified
      let filteredRooms = rooms;
      if (filters.guests) {
        filteredRooms = filteredRooms.filter(room => room.capacity >= parseInt(filters.guests));
      }

      // TODO: Add date-based availability checking if checkIn/checkOut provided
      // This would require checking bookings

      return filteredRooms.map(room => {
        const roomInstance = new Room(room);
        return roomInstance.getPublicInfo();
      });
    } catch (error) {
      this.handleError(error, 'Failed to fetch available rooms');
    }
  }
}

module.exports = new RoomService();

