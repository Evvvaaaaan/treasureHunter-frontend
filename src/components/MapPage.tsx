import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Navigation, Layers, MapPin, ChevronDown } from 'lucide-react';
// import BottomNavigation from './BottomNavigation';
import '../styles/map-page.css';
import BottomNavigation from './BottomNavigation';

interface MapMarker {
  id: string;
  type: 'lost' | 'found';
  position: { lat: number; lng: number };
  title: string;
  description: string;
  thumbnail: string;
  rewardPoints: number;
  postedDate: string;
  matchProbability: number;
}

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [radius, setRadius] = useState(5); // km
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const categories = ['전자기기', '지갑/가방', '의류', '액세서리', '서류/카드', '기타'];

  const mockMarkers: MapMarker[] = [
    {
      id: '1',
      type: 'lost',
      position: { lat: 37.498, lng: 127.028 },
      title: 'iPhone 15 Pro 분실',
      description: '강남역 2번 출구 근처',
      thumbnail: 'https://images.unsplash.com/photo-1592286927505-838d8be747f2?w=200',
      rewardPoints: 50000,
      postedDate: '2025-10-20',
      matchProbability: 95
    },
    {
      id: '2',
      type: 'found',
      position: { lat: 37.5, lng: 127.03 },
      title: '지갑 습득',
      description: '신사역 근처 카페',
      thumbnail: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=200',
      rewardPoints: 30000,
      postedDate: '2025-10-21',
      matchProbability: 88
    },
    {
      id: '3',
      type: 'lost',
      position: { lat: 37.497, lng: 127.025 },
      title: '에어팟 프로 분실',
      description: '강남역 지하 상가',
      thumbnail: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=200',
      rewardPoints: 20000,
      postedDate: '2025-10-22',
      matchProbability: 72
    }
  ];

  useEffect(() => {
    initializeMap();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (googleMapRef.current) {
      updateMarkers();
    }
  }, [radius, selectedCategories]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Initialize Google Maps
    const defaultCenter = { lat: 37.5665, lng: 126.9780 }; // Seoul
    
    const map = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      mapTypeId: mapType,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    googleMapRef.current = map;

    // Add markers
    updateMarkers();
    
    setIsLoading(false);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          
          if (googleMapRef.current) {
            googleMapRef.current.setCenter(location);
            
            // Add user location marker
            new google.maps.Marker({
              position: location,
              map: googleMapRef.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#10b981',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 3
              }
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const updateMarkers = () => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    mockMarkers.forEach((item) => {
      const marker = new google.maps.Marker({
        position: item.position,
        map: googleMapRef.current,
        icon: {
          url: item.type === 'lost' 
            ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
                  <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#dc2626"/>
                  <circle cx="20" cy="20" r="8" fill="white"/>
                </svg>
              `)
            : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
                  <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#10b981"/>
                  <circle cx="20" cy="20" r="8" fill="white"/>
                </svg>
              `),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        },
        title: item.title
      });

      marker.addListener('click', () => {
        setSelectedMarker(item);
      });

      markersRef.current.push(marker);
    });
  };

  const handleCenterToUserLocation = () => {
    if (userLocation && googleMapRef.current) {
      googleMapRef.current.setCenter(userLocation);
      googleMapRef.current.setZoom(16);
    } else {
      getUserLocation();
    }
  };

  const toggleMapType = () => {
    const newType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapType(newType);
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(newType);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="map-page">
      {/* Header */}
      <div className="map-header">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="장소 또는 아이템 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={20} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-section">
            <label>검색 반경: {radius}km</label>
            <input
              type="range"
              min="1"
              max="20"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="radius-slider"
            />
          </div>

          <div className="filter-section">
            <label>카테고리</label>
            <div className="category-chips">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-chip ${selectedCategories.includes(category) ? 'active' : ''}`}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="map-container">
        <div ref={mapRef} className="google-map" />
        
        {isLoading && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>보물 지도를 펼치는 중...</p>
          </div>
        )}

        {/* Map Controls */}
        <div className="map-controls">
          <button className="map-control-btn" onClick={handleCenterToUserLocation}>
            <Navigation size={20} />
          </button>
          <button className="map-control-btn" onClick={toggleMapType}>
            <Layers size={20} />
          </button>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-marker lost"></span>
            <span>분실물</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker found"></span>
            <span>발견물</span>
          </div>
        </div>
      </div>

      {/* Selected Marker Info */}
      {selectedMarker && (
        <div className="marker-info-card" onClick={() => navigate(`/items/${selectedMarker.id}`)}>
          <button className="close-info" onClick={(e) => { e.stopPropagation(); setSelectedMarker(null); }}>
            <ChevronDown size={24} />
          </button>
          
          <div className="info-content">
            <img src={selectedMarker.thumbnail} alt={selectedMarker.title} />
            <div className="info-details">
              <span className={`info-type ${selectedMarker.type}`}>
                {selectedMarker.type === 'lost' ? '분실물' : '발견물'}
              </span>
              <h3>{selectedMarker.title}</h3>
              <p>{selectedMarker.description}</p>
              
              {selectedMarker.matchProbability >= 70 && (
                <div className="match-badge">
                  🎯 매칭 확률 {selectedMarker.matchProbability}%
                </div>
              )}
              
              {selectedMarker.rewardPoints > 0 && (
                <div className="reward-info">
                  💰 {selectedMarker.rewardPoints.toLocaleString()} 포인트
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default MapPage;
