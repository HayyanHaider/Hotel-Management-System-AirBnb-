import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const ManageRooms = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    hotelId: '',
    name: '',
    type: '',
    description: '',
    pricePerNight: '',
    capacity: '',
    amenities: []
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      fetchRooms();
    }
  }, [selectedHotel]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const userId = JSON.parse(sessionStorage.getItem('user'))?.userId;

      const response = await axios.get('http://localhost:5000/api/hotels', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const userHotels = response.data.hotels.filter(h => String(h.ownerId) === String(userId));
        setHotels(userHotels);
        if (userHotels.length > 0) {
          setSelectedHotel(userHotels[0]._id || userHotels[0].id);
          setFormData({...formData, hotelId: userHotels[0]._id || userHotels[0].id});
        }
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/rooms/hotel/${selectedHotel}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRooms(response.data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      
      if (editingRoom) {
        await axios.put(
          `http://localhost:5000/api/rooms/${editingRoom._id || editingRoom.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        alert('Room updated successfully!');
      } else {
        await axios.post(
          'http://localhost:5000/api/rooms',
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        alert('Room created successfully!');
      }
      
      setShowForm(false);
      setEditingRoom(null);
      setFormData({
        hotelId: selectedHotel,
        name: '',
        type: '',
        description: '',
        pricePerNight: '',
        capacity: '',
        amenities: []
      });
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert(error.response?.data?.message || 'Error saving room');
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      hotelId: room.hotelId || selectedHotel,
      name: room.name || '',
      type: room.type || '',
      description: room.description || '',
      pricePerNight: room.pricePerNight || '',
      capacity: room.capacity || '',
      amenities: room.amenities || []
    });
    setShowForm(true);
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Room deleted successfully!');
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert(error.response?.data?.message || 'Error deleting room');
    }
  };

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Manage Rooms</h1>
        <p>Add, edit, and manage your hotel rooms</p>
      </div>

      <div className="container">
        <div className="mb-3">
          <label className="form-label">Select Hotel</label>
          <select
            className="form-select"
            value={selectedHotel}
            onChange={(e) => {
              setSelectedHotel(e.target.value);
              setFormData({...formData, hotelId: e.target.value});
            }}
          >
            {hotels.map((hotel) => (
              <option key={hotel._id || hotel.id} value={hotel._id || hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary mb-3"
          onClick={() => {
            setShowForm(true);
            setEditingRoom(null);
            setFormData({
              hotelId: selectedHotel,
              name: '',
              type: '',
              description: '',
              pricePerNight: '',
              capacity: '',
              amenities: []
            });
          }}
        >
          Add New Room
        </button>

        {showForm && (
          <div className="card mb-4">
            <div className="card-body">
              <h3>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Room Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Room Type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    placeholder="e.g., Deluxe, Suite, Standard"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Price Per Night ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({...formData, pricePerNight: e.target.value})}
                      required
                      min="0"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Capacity (Guests)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingRoom ? 'Update Room' : 'Create Room'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRoom(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="row g-4">
          {rooms.length === 0 ? (
            <div className="col-12 text-center">
              <p>No rooms found. Add a room to get started.</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room._id || room.id} className="col-md-4">
                <div className="card">
                  <div className="card-body">
                    <h5>{room.name}</h5>
                    <p className="text-muted">{room.type}</p>
                    <p><strong>Price:</strong> ${room.pricePerNight}/night</p>
                    <p><strong>Capacity:</strong> {room.capacity} guests</p>
                    <p>
                      <strong>Status:</strong> {room.isAvailable ? 'Available' : 'Unavailable'}
                    </p>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(room)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(room._id || room.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageRooms;

