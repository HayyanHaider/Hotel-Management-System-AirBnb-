const HotelModel = require('../models/hotelModel');
const UserModel = require('../models/userModel');

// Approve hotel
const approveHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const updated = await HotelModel.findByIdAndUpdate(hotelId, { isApproved: true }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Hotel not found' });
    return res.json({ success: true, hotel: updated });
  } catch (error) {
    console.error('approveHotel error:', error);
    return res.status(500).json({ success: false, message: 'Server error while approving hotel' });
  }
};

// Reject/Suspend hotel
const suspendHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { reason = '' } = req.body;
    const updated = await HotelModel.findByIdAndUpdate(hotelId, { isSuspended: true, suspensionReason: reason }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Hotel not found' });
    return res.json({ success: true, hotel: updated });
  } catch (error) {
    console.error('suspendHotel error:', error);
    return res.status(500).json({ success: false, message: 'Server error while suspending hotel' });
  }
};

// Manage customers (suspend)
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = '' } = req.body;
    const updated = await UserModel.findByIdAndUpdate(userId, { isSuspended: true, suspendedReason: reason }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error('suspendUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error while suspending user' });
  }
};

module.exports = { approveHotel, suspendHotel, suspendUser };


