import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const ManageHotelProfile = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    amenities: [],
    images: [],
    pricing: {
      basePrice: '',
      cleaningFee: '',
      serviceFee: ''
    },
    capacity: {
      guests: '',
      bedrooms: '',
      bathrooms: ''
    },
    totalRooms: ''
  });
  const [amenityInput, setAmenityInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      // Use the owner-specific endpoint to get only the hotel owner's hotels
      const response = await axios.get('http://localhost:5000/api/hotels/owner/my-hotels', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHotels(response.data.hotels || []);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name || '',
      description: hotel.description || '',
      address: hotel.location?.address || '',
      city: hotel.location?.city || '',
      state: hotel.location?.state || '',
      zipCode: hotel.location?.zipCode || '',
      country: hotel.location?.country || '',
      amenities: hotel.amenities || [],
      images: hotel.images || [],
      pricing: {
        basePrice: hotel.pricing?.basePrice || '',
        cleaningFee: hotel.pricing?.cleaningFee || '',
        serviceFee: hotel.pricing?.serviceFee || ''
      },
      capacity: {
        guests: hotel.capacity?.guests || '',
        bedrooms: hotel.capacity?.bedrooms || '',
        bathrooms: hotel.capacity?.bathrooms || ''
      },
      totalRooms: hotel.totalRooms || ''
    });
    setShowCreateForm(false);
  };

  const handleCreateNew = () => {
    setEditingHotel(null);
    setShowCreateForm(true);
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      amenities: [],
      images: [],
      pricing: {
        basePrice: '',
        cleaningFee: '',
        serviceFee: ''
      },
      capacity: {
        guests: '',
        bedrooms: '',
        bathrooms: ''
      },
      totalRooms: ''
    });
  };

  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const hotelData = {
        name: formData.name,
        description: formData.description,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        amenities: formData.amenities,
        images: formData.images,
        pricing: {
          basePrice: parseFloat(formData.pricing.basePrice) || 0,
          cleaningFee: parseFloat(formData.pricing.cleaningFee) || 0,
          serviceFee: parseFloat(formData.pricing.serviceFee) || 0
        },
        capacity: {
          guests: parseInt(formData.capacity.guests) || 1,
          bedrooms: parseInt(formData.capacity.bedrooms) || 1,
          bathrooms: parseInt(formData.capacity.bathrooms) || 1
        },
        totalRooms: parseInt(formData.totalRooms) || 1
      };

      if (editingHotel) {
        await axios.put(
          `http://localhost:5000/api/hotels/${editingHotel._id || editingHotel.id}`,
          hotelData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Hotel updated successfully!');
      } else {
        await axios.post(
          'http://localhost:5000/api/hotels',
          hotelData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Hotel created successfully! Pending admin approval.');
        setShowCreateForm(false);
      }
      
      setEditingHotel(null);
      fetchHotels();
    } catch (error) {
      console.error('Error saving hotel:', error);
      alert(error.response?.data?.message || 'Error saving hotel');
    }
  };

  const handleDelete = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/hotels/${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Hotel deleted successfully!');
      fetchHotels();
      if (editingHotel && (editingHotel._id === hotelId || editingHotel.id === hotelId)) {
        setEditingHotel(null);
      }
    } catch (error) {
      console.error('Error deleting hotel:', error);
      alert(error.response?.data?.message || 'Error deleting hotel');
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()]
      });
      setAmenityInput('');
    }
  };

  const removeAmenity = (index) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index)
    });
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()]
      });
      setImageInput('');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const token = sessionStorage.getItem('token');
      const uploadFormData = new FormData();
      
      // Upload multiple images
      files.forEach((file) => {
        uploadFormData.append('images', file);
      });

      const response = await axios.post(
        'http://localhost:5000/api/upload/images',
        uploadFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        const uploadedUrls = response.data.images.map(img => img.url);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }));
        alert(`${files.length} image(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(error.response?.data?.message || 'Error uploading images');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1>Manage Hotel Profile</h1>
            <p>Create, edit, and manage your hotels</p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/hotel_owner-dashboard')}
            style={{ height: 'fit-content' }}
          >
            ← Go Back
          </button>
        </div>
      </div>

      <div className="container">
        <div className="mb-3">
          <button className="btn btn-primary" onClick={handleCreateNew}>
            + Create New Hotel
          </button>
        </div>

        {hotels.length === 0 && !showCreateForm && !editingHotel && (
          <div className="text-center">
            <p>No hotels found. Create a hotel to get started.</p>
          </div>
        )}

        {!showCreateForm && !editingHotel && (
          <div className="row g-4">
            {hotels.map((hotel) => (
              <div key={hotel._id || hotel.id} className="col-12">
                <div className={`card ${hotel.isSuspended ? 'border-danger' : ''}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <h5 className="mb-0">{hotel.name}</h5>
                          {hotel.isSuspended && (
                            <span className="badge bg-danger">Suspended</span>
                          )}
                          {!hotel.isSuspended && hotel.isApproved && (
                            <span className="badge bg-success">Approved</span>
                          )}
                          {!hotel.isSuspended && !hotel.isApproved && (
                            <span className="badge bg-warning">Pending Approval</span>
                          )}
                        </div>
                        <p>{hotel.description}</p>
                        <p className="text-muted">
                          {hotel.location?.address}, {hotel.location?.city}, {hotel.location?.country}
                        </p>
                        {hotel.isSuspended && hotel.suspensionReason && (
                          <div className="alert alert-danger mt-3 mb-0">
                            <strong>⚠️ Suspension Reason:</strong>
                            <p className="mb-0 mt-1">{hotel.suspensionReason}</p>
                          </div>
                        )}
                        {!hotel.isSuspended && !hotel.isApproved && hotel.rejectionReason && (
                          <div className="alert alert-warning mt-3 mb-0">
                            <strong>⚠️ Rejection Reason:</strong>
                            <p className="mb-0 mt-1">{hotel.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        {!hotel.isSuspended && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleEdit(hotel)}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(hotel._id || hotel.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(showCreateForm || editingHotel) && (
          <div className="mt-4">
            <div className="card">
              <div className="card-body">
                <h3>{editingHotel ? 'Edit Hotel' : 'Create New Hotel'}</h3>
                <form onSubmit={handleHotelSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Hotel Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Zip Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Base Price ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.pricing.basePrice}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, basePrice: e.target.value }
                        })}
                        min="0"
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Cleaning Fee ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.pricing.cleaningFee}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, cleaningFee: e.target.value }
                        })}
                        min="0"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Service Fee ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.pricing.serviceFee}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, serviceFee: e.target.value }
                        })}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Max Guests</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.capacity.guests}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, guests: e.target.value }
                        })}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Bedrooms</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.capacity.bedrooms}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, bedrooms: e.target.value }
                        })}
                        min="1"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Bathrooms</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.capacity.bathrooms}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, bathrooms: e.target.value }
                        })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Total Rooms *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.totalRooms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalRooms: e.target.value
                        })
                      }
                      min="1"
                      required
                      placeholder="Number of rooms available in the hotel"
                    />
                    <small className="text-muted">This determines how many bookings can be made for the same dates</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Amenities</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={amenityInput}
                        onChange={(e) => setAmenityInput(e.target.value)}
                        placeholder="Add amenity (e.g., WiFi, Pool, Parking)"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                      />
                      <button type="button" className="btn btn-outline-primary" onClick={addAmenity}>
                        Add
                      </button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.amenities.map((amenity, index) => (
                        <span key={index} className="badge bg-primary d-flex align-items-center gap-1">
                          {amenity}
                          <button
                            type="button"
                            className="btn-close btn-close-white"
                            style={{ fontSize: '10px' }}
                            onClick={() => removeAmenity(index)}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Images</label>
                    <div className="mb-3">
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      {uploading && <p className="text-muted small mt-2">Uploading images...</p>}
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Or add image URL:</small>
                      <div className="d-flex gap-2 mt-1">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={imageInput}
                          onChange={(e) => setImageInput(e.target.value)}
                          placeholder="Add image URL"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                        />
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={addImage}>
                          Add URL
                        </button>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="position-relative">
                          <img
                            src={image}
                            alt={`Hotel ${index + 1}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <button
                            type="button"
                            className="btn-close position-absolute top-0 end-0"
                            style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.8)' }}
                            onClick={() => removeImage(index)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingHotel ? 'Update Hotel' : 'Create Hotel'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingHotel(null);
                        setShowCreateForm(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {editingHotel && (
              <div className="mt-4">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingHotel(null);
                  }}
                >
                  Cancel Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageHotelProfile;
