import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom red marker icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
    },
  });
  return null;
}

const LocationPickerMap = ({ onLocationSelect, initialLat = null, initialLng = null, height = '400px' }) => {
  const [markerPosition, setMarkerPosition] = useState(null);
  const markerRef = useRef(null);

  // Initialize marker position from props
  useEffect(() => {
    if (initialLat !== null && initialLng !== null && !isNaN(initialLat) && !isNaN(initialLng)) {
      setMarkerPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  // Handle location selection
  const handleLocationSelect = (lat, lng) => {
    const position = [lat, lng];
    setMarkerPosition(position);
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  // Map center - use marker position if set, otherwise default to world view
  const mapCenter = markerPosition || [20, 0];
  
  // Map zoom - zoom in if marker exists, otherwise world view
  const mapZoom = markerPosition ? 15 : 2;

  // Handle marker drag end
  const eventHandlers = {
    dragend: () => {
      const marker = markerRef.current;
      if (marker != null) {
        const position = marker.getLatLng();
        handleLocationSelect(position.lat, position.lng);
      }
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ 
        height: height, 
        width: '100%', 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px',
        overflow: 'hidden',
        zIndex: 0
      }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              icon={redIcon}
              ref={markerRef}
              eventHandlers={eventHandlers}
            >
              <Popup>
                Hotel Location<br />
                Latitude: {markerPosition[0].toFixed(6)}<br />
                Longitude: {markerPosition[1].toFixed(6)}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      <div className="mt-2 p-2 bg-light rounded" style={{ fontSize: '0.875rem' }}>
        <strong>📍 Instructions:</strong>
        <ul className="mb-0 mt-2" style={{ paddingLeft: '20px' }}>
          <li>Click anywhere on the map to place the red marker</li>
          <li>You can also drag the marker to adjust its position</li>
          <li>The coordinates will be automatically saved</li>
        </ul>
        {markerPosition && (
          <div className="mt-2">
            <strong>Selected Location:</strong>
            <div className="text-muted">
              Latitude: {markerPosition[0].toFixed(6)}, Longitude: {markerPosition[1].toFixed(6)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPickerMap;
