import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import LocationPickerMap from './LocationPickerMap';
import { countries, pakistanData, getSocietiesForCity } from '../data/locationData';
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
    streetAddress: '',
    society: '',
    city: '',
    province: '',
    country: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    amenities: [],
    images: [],
    totalRooms: '',
    basePrice: '',
    capacityGuests: '',
    capacityBedrooms: '',
    capacityBathrooms: ''
  });
  const [amenityInput, setAmenityInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableSocieties, setAvailableSocieties] = useState([]);

  useEffect(() => {
    fetchHotels();
  }, []);

  // Handle country selection
  useEffect(() => {
    if (selectedCountry === 'PK') {
      setAvailableProvinces(pakistanData.provinces);
    } else {
      setAvailableProvinces([]);
      setSelectedProvince('');
      setAvailableCities([]);
      setSelectedCity('');
      setAvailableSocieties([]);
      setFormData(prev => ({ ...prev, society: '' }));
    }
  }, [selectedCountry]);

  // Handle province selection
  useEffect(() => {
    if (selectedProvince && selectedCountry === 'PK') {
      const cities = pakistanData.cities[selectedProvince] || [];
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
      setSelectedCity('');
      setAvailableSocieties([]);
      setFormData(prev => ({ ...prev, society: '' }));
    }
  }, [selectedProvince, selectedCountry]);

  // Handle city selection
  useEffect(() => {
    if (selectedCity && selectedCountry === 'PK') {
      const societies = getSocietiesForCity(selectedCity);
      setAvailableSocieties(societies);
    } else {
      setAvailableSocieties([]);
      setFormData(prev => ({ ...prev, society: '' }));
    }
  }, [selectedCity, selectedCountry]);

  // Build address string for geocoding (memoized to track changes)
  // Street address first for better geocoding accuracy
  const addressString = useMemo(() => {
    const parts = [];
    
    // Start with street address (most specific)
    if (formData.streetAddress && formData.streetAddress.trim()) {
      parts.push(formData.streetAddress.trim());
    }
    
    // Then society/area
    if (formData.society && formData.society.trim()) {
      parts.push(formData.society.trim());
    }
    
    // Then city
    if (selectedCountry === 'PK') {
      if (selectedCity && selectedCity.trim()) {
        parts.push(selectedCity.trim());
      }
    } else {
      if (formData.city && formData.city.trim()) {
        parts.push(formData.city.trim());
      }
    }
    
    // Then province/state
    if (selectedCountry === 'PK') {
      if (selectedProvince) {
        const provinceName = pakistanData.provinces.find(p => p.code === selectedProvince)?.name;
        if (provinceName) parts.push(provinceName);
      }
    } else {
      if (formData.province && formData.province.trim()) {
        parts.push(formData.province.trim());
      }
    }
    
    // Then country
    if (selectedCountry) {
      const countryName = countries.find(c => c.code === selectedCountry)?.name;
      if (countryName) parts.push(countryName);
    }
    
    // Zip code last
    if (formData.zipCode && formData.zipCode.trim()) {
      parts.push(formData.zipCode.trim());
    }
    
    const result = parts.join(', ');
    // Only return if we have at least city or country (minimum for geocoding)
    if (parts.length >= 2 || (selectedCountry && (selectedCity || formData.city))) {
      return result;
    }
    return '';
  }, [formData.streetAddress, formData.society, formData.city, formData.province, formData.zipCode, selectedCountry, selectedCity, selectedProvince]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        setHotels([]);
        return;
      }

      // Use the owner-specific endpoint to get only the hotel's hotels
      const response = await axios.get('http://localhost:5000/api/hotels/owner/my-hotels', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Hotels API response:', response.data);

      if (response.data.success) {
        const hotelsList = response.data.hotels || [];
        console.log('Hotels fetched:', hotelsList.length, hotelsList);
        setHotels(hotelsList);
      } else {
        console.error('API returned success: false', response.data);
        setHotels([]);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Error loading hotels: ${error.response?.data?.message || error.message}`);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    const country = hotel.location?.country || '';
    const state = hotel.location?.state || '';
    const city = hotel.location?.city || '';
    
    // Try to determine country code
    let countryCode = '';
    if (country.toLowerCase().includes('pakistan')) {
      countryCode = 'PK';
    } else {
      const found = countries.find(c => c.name.toLowerCase() === country.toLowerCase());
      countryCode = found?.code || '';
    }
    
    setSelectedCountry(countryCode);
    
    // If Pakistan, try to find province
    if (countryCode === 'PK' && state) {
      const province = pakistanData.provinces.find(p => 
        p.name.toLowerCase() === state.toLowerCase() || 
        p.code.toLowerCase() === state.toLowerCase()
      );
      if (province) {
        setSelectedProvince(province.code);
      }
    }
    
    setFormData({
      name: hotel.name || '',
      description: hotel.description || '',
      streetAddress: hotel.location?.address || '',
      society: '',
      city: city,
      province: state,
      country: country,
      zipCode: hotel.location?.zipCode || '',
      latitude: hotel.location?.coordinates?.lat || '',
      longitude: hotel.location?.coordinates?.lng || '',
      amenities: hotel.amenities || [],
      images: hotel.images || [],
      totalRooms: hotel.totalRooms || '',
      basePrice: hotel.pricing?.basePrice || '',
      capacityGuests: hotel.capacity?.guests || '',
      capacityBedrooms: hotel.capacity?.bedrooms || '',
      capacityBathrooms: hotel.capacity?.bathrooms || ''
    });
    setShowCreateForm(false);
  };

  const handleCreateNew = () => {
    setEditingHotel(null);
    setShowCreateForm(true);
    setSelectedCountry('');
    setSelectedProvince('');
    setSelectedCity('');
    setAvailableProvinces([]);
    setAvailableCities([]);
    setAvailableSocieties([]);
    setFormData({
      name: '',
      description: '',
      streetAddress: '',
      society: '',
      city: '',
      province: '',
      country: '',
      zipCode: '',
      latitude: '',
      longitude: '',
      amenities: [],
      images: [],
      totalRooms: '',
      basePrice: '',
      capacityGuests: '',
      capacityBedrooms: '',
      capacityBathrooms: ''
    });
  };

  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      // Validate that coordinates are provided
      if (!formData.latitude || !formData.longitude) {
        toast.warning('Please select a location on the map by clicking on it');
        return;
      }

      // Build full address string (use memoized addressString or build from form data)
      let fullAddress = addressString;
      if (!fullAddress || fullAddress.trim() === '') {
        // Fallback: build address from form data if addressString is empty
        const parts = [];
        if (formData.streetAddress) parts.push(formData.streetAddress);
        if (formData.society) parts.push(formData.society);
        if (selectedCity || formData.city) parts.push(selectedCity || formData.city);
        if (selectedProvince && selectedCountry === 'PK') {
          const provinceName = pakistanData.provinces.find(p => p.code === selectedProvince)?.name;
          if (provinceName) parts.push(provinceName);
        } else if (formData.province) {
          parts.push(formData.province);
        }
        if (selectedCountry) {
          const countryName = countries.find(c => c.code === selectedCountry)?.name;
          if (countryName) parts.push(countryName);
        }
        fullAddress = parts.join(', ');
      }
      
      const countryName = countries.find(c => c.code === selectedCountry)?.name || formData.country;
      const provinceName = selectedCountry === 'PK' && selectedProvince 
        ? pakistanData.provinces.find(p => p.code === selectedProvince)?.name 
        : formData.province;

      const hotelData = {
        name: formData.name,
        description: formData.description,
        location: {
          address: fullAddress,
          city: selectedCity || formData.city,
          state: provinceName || formData.province,
          zipCode: formData.zipCode,
          country: countryName,
          coordinates: {
            lat: formData.latitude ? parseFloat(formData.latitude) : null,
            lng: formData.longitude ? parseFloat(formData.longitude) : null
          }
        },
        amenities: formData.amenities,
        images: formData.images,
        totalRooms: parseInt(formData.totalRooms) || 1,
        pricing: {
          basePrice: formData.basePrice ? parseFloat(formData.basePrice) : 0
        },
        capacity: {
          guests: parseInt(formData.capacityGuests) || 1,
          bedrooms: parseInt(formData.capacityBedrooms) || 1,
          bathrooms: parseInt(formData.capacityBathrooms) || 1
        }
      };

      if (editingHotel) {
        await axios.put(
          `http://localhost:5000/api/hotels/${editingHotel._id || editingHotel.id}`,
          hotelData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Hotel updated successfully!');
      } else {
        await axios.post(
          'http://localhost:5000/api/hotels',
          hotelData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Hotel created successfully! Your hotel is now pending admin approval. It will be visible to customers once approved by an administrator.');
        setShowCreateForm(false);
        setSelectedCountry('');
        setSelectedProvince('');
        setSelectedCity('');
        setAvailableProvinces([]);
        setAvailableCities([]);
        setAvailableSocieties([]);
        setFormData({
          name: '',
          description: '',
          streetAddress: '',
          society: '',
          city: '',
          province: '',
          country: '',
          zipCode: '',
          latitude: '',
          longitude: '',
          amenities: [],
          images: [],
          totalRooms: '',
          basePrice: '',
          capacityGuests: '',
          capacityBedrooms: '',
          capacityBathrooms: ''
        });
      }
      
      setEditingHotel(null);
      fetchHotels();
    } catch (error) {
      console.error('Error saving hotel:', error);
      toast.error(error.response?.data?.message || 'Error saving hotel');
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
      toast.success('Hotel deleted successfully!');
      fetchHotels();
      if (editingHotel && (editingHotel._id === hotelId || editingHotel.id === hotelId)) {
        setEditingHotel(null);
      }
    } catch (error) {
      console.error('Error deleting hotel:', error);
      toast.error(error.response?.data?.message || 'Error deleting hotel');
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


  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = files.filter(file => file.size > maxSize);
    if (invalidFiles.length > 0) {
      toast.warning(`Some files exceed the 10MB limit. Please select smaller images.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const token = sessionStorage.getItem('token');
      const uploadFormData = new FormData();
      
      // Upload multiple images (up to 10 per request, but can upload multiple times)
      const filesToUpload = files.slice(0, 10);
      filesToUpload.forEach((file) => {
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
        // Reset file input to allow uploading more images
        e.target.value = '';
        console.log(`${uploadedUrls.length} image(s) uploaded successfully to Cloudinary!`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error uploading images';
      toast.error(errorMessage);
      // Reset file input on error too
      e.target.value = '';
    } finally {
      setUploading(false);
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
            onClick={() => navigate('/hotel-dashboard')}
            style={{ height: 'fit-content' }}
          >
            ← Go Back
          </button>
        </div>
      </div>

      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Your Hotels</h3>
          {hotels.length > 0 && !showCreateForm && !editingHotel && (
            <button className="btn btn-primary" onClick={handleCreateNew}>
              + Create New Hotel
            </button>
          )}
        </div>

        {hotels.length > 0 && hotels.some(h => !h.isApproved && !h.isSuspended) && (
          <div className="alert alert-info mb-4">
            <strong>ℹ️ Note:</strong> Some of your hotels are pending approval. 
            Hotels must be approved by an administrator before they are visible to customers.
          </div>
        )}

        {hotels.length === 0 && !showCreateForm && !editingHotel && (
          <div className="text-center py-5">
            <div className="alert alert-info">
              <h5>No hotels found</h5>
              <p className="mb-3">You haven't created any hotels yet. Click "Create New Hotel" to add your first property.</p>
              <button className="btn btn-primary" onClick={handleCreateNew}>
                + Create Your First Hotel
              </button>
            </div>
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
                        {!hotel.isSuspended && !hotel.isApproved && !hotel.rejectionReason && (
                          <div className="alert alert-info mt-3 mb-0">
                            <strong>ℹ️ Pending Approval:</strong>
                            <p className="mb-0 mt-1">
                              Your hotel is currently pending admin approval. It will be visible to customers once approved. 
                              Please wait for an administrator to review and approve your hotel listing.
                            </p>
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
                  <div className="mb-3">
                    <label className="form-label">Country *</label>
                    <select
                      className="form-select"
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value);
                        setFormData({...formData, country: e.target.value});
                      }}
                      required
                    >
                      <option value="">-- Select Country --</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCountry === 'PK' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Province *</label>
                        <select
                          className="form-select"
                          value={selectedProvince}
                          onChange={(e) => {
                            setSelectedProvince(e.target.value);
                            const provinceName = pakistanData.provinces.find(p => p.code === e.target.value)?.name;
                            setFormData({...formData, province: provinceName || ''});
                          }}
                          required
                        >
                          <option value="">-- Select Province --</option>
                          {availableProvinces.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedProvince && (
                        <div className="mb-3">
                          <label className="form-label">City *</label>
                          <select
                            className="form-select"
                            value={selectedCity}
                            onChange={(e) => {
                              setSelectedCity(e.target.value);
                              setFormData({...formData, city: e.target.value});
                            }}
                            required
                          >
                            <option value="">-- Select City --</option>
                            {availableCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedCity && availableSocieties.length > 0 && (
                        <div className="mb-3">
                          <label className="form-label">Society/Area</label>
                          <select
                            className="form-select"
                            value={formData.society}
                            onChange={(e) => setFormData({...formData, society: e.target.value})}
                          >
                            <option value="">-- Select Society/Area (Optional) --</option>
                            {availableSocieties.map((society) => (
                              <option key={society} value={society}>
                                {society}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {selectedCountry && selectedCountry !== 'PK' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">State/Province *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.province}
                          onChange={(e) => setFormData({...formData, province: e.target.value})}
                          placeholder="Enter state or province"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          placeholder="Enter city name"
                          required
                        />
                      </div>
                    </>
                  )}

                  {(selectedCountry === 'PK' && selectedCity) || (selectedCountry && selectedCountry !== 'PK') ? (
                    <div className="mb-3">
                      <label className="form-label">Street Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.streetAddress}
                        onChange={(e) => setFormData({...formData, streetAddress: e.target.value})}
                        placeholder="Enter street address, building number, etc."
                        required
                      />
                    </div>
                  ) : null}

                  <div className="mb-3">
                    <label className="form-label">Zip/Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                  
                  {/* Map Location Picker Section */}
                  <div className="mb-4">
                    <h5 className="mb-3">📍 Map Location <span className="text-danger">*</span></h5>
                    <p className="text-muted small mb-3">
                      The map will automatically update when you fill in the address fields above. 
                      You can also manually click on the map or drag the marker to adjust the location.
                    </p>
                    <LocationPickerMap
                      onLocationSelect={(lat, lng) => {
                        setFormData({
                          ...formData,
                          latitude: lat.toString(),
                          longitude: lng.toString()
                        });
                      }}
                      initialLat={formData.latitude ? parseFloat(formData.latitude) : null}
                      initialLng={formData.longitude ? parseFloat(formData.longitude) : null}
                      height="400px"
                      addressToGeocode={addressString}
                    />
                    {(!formData.latitude || !formData.longitude) && (
                      <div className="text-danger small mt-2">
                        ⚠️ Please fill in the address fields above or click on the map to select a location
                      </div>
                    )}
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
                    <label className="form-label">Maximum Guests *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.capacityGuests}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacityGuests: e.target.value
                        })
                      }
                      min="1"
                      required
                      placeholder="Maximum number of guests per room"
                    />
                    <small className="text-muted">Maximum number of guests that can stay in this hotel</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Bedrooms *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.capacityBedrooms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacityBedrooms: e.target.value
                        })
                      }
                      min="1"
                      required
                      placeholder="Number of bedrooms"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Bathrooms *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.capacityBathrooms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacityBathrooms: e.target.value
                        })
                      }
                      min="1"
                      required
                      placeholder="Number of bathrooms"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Price Per Night (PKR) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          basePrice: e.target.value
                        })
                      }
                      min="0"
                      step="0.01"
                      required
                      placeholder="Enter price per night in PKR"
                    />
                    <small className="text-muted">The base price per night for this hotel</small>
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
                  <div className="mb-4">
                    <label className="form-label">Hotel Images <span className="text-danger">*</span></label>
                    <p className="text-muted small mb-3">
                      Upload images of your hotel. You can upload up to 10 images at once (max 10MB each). 
                      You can upload images multiple times to add more images. Images will be stored in Cloudinary.
                    </p>
                    <div className="mb-3">
                      <input
                        type="file"
                        className="form-control"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploading}
                        id="hotel-image-upload"
                      />
                      {uploading && (
                        <div className="mt-2">
                          <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                            <span className="visually-hidden">Uploading...</span>
                          </div>
                          <span className="text-muted small">Uploading images to Cloudinary...</span>
                        </div>
                      )}
                    </div>
                    {formData.images.length === 0 && (
                      <div className="alert alert-warning">
                        <strong>⚠️ Required:</strong> Please upload at least one image of your hotel.
                      </div>
                    )}
                    {formData.images.length > 0 && (
                      <div className="mt-3">
                        <p className="small text-muted mb-2">
                          {formData.images.length} image(s) uploaded. Click X to remove an image. 
                          You can upload more images by selecting files again.
                        </p>
                        <div className="d-flex flex-wrap gap-3">
                          {formData.images.map((image, index) => (
                            <div key={index} className="position-relative">
                              <img
                                src={image}
                                alt={`Hotel ${index + 1}`}
                                style={{ 
                                  width: '150px', 
                                  height: '150px', 
                                  objectFit: 'cover', 
                                  borderRadius: '8px',
                                  border: '2px solid #e0e0e0'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  console.error('Error loading image:', image);
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                                style={{ 
                                  width: '28px', 
                                  height: '28px', 
                                  padding: '0',
                                  lineHeight: '1',
                                  fontSize: '16px'
                                }}
                                onClick={() => removeImage(index)}
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
