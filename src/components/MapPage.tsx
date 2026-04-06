import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Loader2, Crosshair, HelpCircle, Shield } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { useTheme } from '../utils/theme';
import { getValidAuthToken } from '../utils/auth';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import '../styles/map-page.css';
import { API_BASE_URL } from '../config';
import { Dialog } from "@capacitor/dialog";

const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

// [Snazzy Maps Style: Becomeadinosaur] - 다크 모드 스타일 정의
const googleMapDarkMode = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// API 응답 데이터 타입 정의
interface MapPost {
  id: number;
  title: string;
  content: string;
  type: 'LOST' | 'FOUND';
  lat: number;
  lon: number;
  itemCategory: string;
  images: string[];
  setPoint: number;
}

interface ApiResponse {
  posts: MapPost[];
}

export default function MapPage() {
  const navigate = useNavigate();
  const { theme } = useTheme(); // 테마 훅 사용
  const mapRef = useRef<HTMLDivElement>(null);

  // 상태 관리
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [posts, setPosts] = useState<MapPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<MapPost | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [_myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [myLocationMarker, setMyLocationMarker] = useState<google.maps.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const safeMarkersRef = useRef<google.maps.Marker[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // 안심 거래 존 토글
  const toggleSafeZones = () => {
    const nextState = !showSafeZones;
    setShowSafeZones(nextState);

    if (nextState) {
      searchSafePlaces();
    } else {
      clearSafeMarkers();
    }
  };

  const clearSafeMarkers = () => {
    safeMarkersRef.current.forEach(marker => marker.setMap(null));
    safeMarkersRef.current = [];
  };

  const searchSafePlaces = () => {
    if (!map || !window.google?.maps?.places) return;

    const service = new google.maps.places.PlacesService(map);
    const center = map.getCenter();
    if (!center) return;

    const requestCommon = {
      location: center,
      radius: 1500,
    };

    service.nearbySearch({ ...requestCommon, type: 'police' }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => createSafeMarker(place, 'POLICE'));
      }
    });

    service.nearbySearch({ ...requestCommon, type: 'convenience_store' }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => createSafeMarker(place, 'STORE'));
      }
    });
  };

  const createSafeMarker = (place: google.maps.places.PlaceResult, type: 'POLICE' | 'STORE') => {
    if (!map || !place.geometry?.location) return;

    const iconColor = type === 'POLICE' ? '#1E88E5' : '#FBC02D';
    const shieldPath = "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z";
    const marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location,
      title: place.name,
      icon: {
        path: shieldPath,
        fillColor: iconColor,
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#ffffff',
        scale: 1,
        anchor: new google.maps.Point(12, 12),
      },
      zIndex: 1,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="padding:5px; color:black;"><strong>${place.name}</strong><br/>안심 거래 장소</div>`,
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    safeMarkersRef.current.push(marker);
  };

  // 게시글 데이터 불러오기
  const fetchPosts = async () => {
    try {
      const token = await getValidAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/posts`, {
        headers: headers,
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts for map:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
      const checkGoogleMapsInterval = setInterval(() => {
        if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
          clearInterval(checkGoogleMapsInterval);
          initMap();
        }
      }, 500);
      return () => clearInterval(checkGoogleMapsInterval);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current) return;

      const initialCenter = { lat: 37.5665, lng: 126.9780 };
      const googleMap = new google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        // 초기 스타일 설정 (현재 테마 반영)
        styles: theme === 'dark' ? googleMapDarkMode : [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ],
      });

      setMap(googleMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // theme을 의존성 배열에서 제외하여 지도 재초기화 방지

  // [추가] 테마 변경 감지하여 지도 스타일 업데이트
  useEffect(() => {
    if (map) {
      const newStyles = theme === 'dark'
        ? googleMapDarkMode
        : [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }];

      map.setOptions({ styles: newStyles });
    }
  }, [theme, map]);


  // 마커 렌더링
  useEffect(() => {
    if (!map || posts.length === 0) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const pinPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

    posts.forEach((post) => {
      if (!post.lat || !post.lon) return;

      const markerColor = post.type === 'LOST' ? '#E53935' : '#43A047';

      const marker = new google.maps.Marker({
        position: { lat: post.lat, lng: post.lon },
        map: map,
        title: post.title,
        icon: {
          path: pinPath,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeWeight: .5,
          strokeColor: '#ffffff',
          scale: 1,
          anchor: new google.maps.Point(12, 22),
        },
        zIndex: 999,
      });

      marker.addListener("click", () => {
        setSelectedPost(post);
        map.panTo(marker.getPosition() as google.maps.LatLng);
      });

      markersRef.current.push(marker);
    });
  }, [map, posts]);

  // 내 위치 가져오기
  const handleMyLocationClick = async () => {
    if (!map) return;

    setIsLocating(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') throw new Error('Location permission denied');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setMyLocation(pos);
      map.setCenter(pos);
      map.setZoom(15);

      if (myLocationMarker) {
        myLocationMarker.setMap(null);
      }

      const newMarker = new google.maps.Marker({
        position: pos,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
        title: "내 위치",
        zIndex: 999,
      });

      setMyLocationMarker(newMarker);

    } catch (error: any) {
      console.error("Error getting location:", error);
      let errorMessage = '위치 정보를 가져올 수 없습니다.';
      if (error.message === 'Location permission denied') {
        errorMessage = '위치 권한이 거부되었습니다.';
      }
      await Dialog.alert({ title: '알림', message: errorMessage });
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className={`map-page ${theme}`}>
      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="map-container" />

      {/* 맵 컨트롤 영역 */}
      <div className="map-controls">
        <button
          className="map-control-btn"
          onClick={() => setShowLegend(!showLegend)}
          aria-label="범례 보기"
        >
          <HelpCircle size={24} />
        </button>
        <button
          className={`map-control-btn ${showSafeZones ? 'active-safe' : ''}`}
          onClick={toggleSafeZones}
          aria-label="안심 거래 존"
          style={{ marginTop: '0.5rem', backgroundColor: showSafeZones ? '#e0f2f1' : 'white', color: showSafeZones ? '#00796b' : 'inherit' }}
        >
          <Shield size={24} fill={showSafeZones ? "currentColor" : "none"} />
        </button>
      </div>

      {/* 범례 (Legend) */}
      {showLegend && (
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-marker found" />
            <span>습득물</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker lost" />
            <span>분실물</span>
          </div>
          <div className="legend-item">
            <Shield size={16} fill="#1E88E5" stroke="none" style={{ marginRight: 8 }} />
            <span>경찰서</span>
          </div>
          <div className="legend-item">
            <Shield size={16} fill="#FBC02D" stroke="none" style={{ marginRight: 8 }} />
            <span>편의점</span>
          </div>
        </div>
      )}

      {/* 내 위치 버튼 */}
      <button
        className="my-location-btn"
        onClick={handleMyLocationClick}
        title="내 위치로 이동"
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <Crosshair size={24} />
        )}
      </button>

      {/* 마커 정보 카드 */}
      {selectedPost && (
        <div className="marker-info-card" onClick={() => navigate(`/items/${selectedPost.id}`)}>
          <button
            className="close-info"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPost(null);
            }}
          >
            <ChevronDown size={24} />
          </button>

          <div className="info-content">
            <img
              src={selectedPost.images && selectedPost.images.length > 0
                ? selectedPost.images[0]
                : DEFAULT_IMAGE}
              alt={selectedPost.title}
            />

            <div className="info-details">
              <span className={`info-type ${selectedPost.type.toLowerCase()}`}>
                {selectedPost.type === 'LOST' ? '분실물' : '습득물'}
              </span>
              <h3>{selectedPost.title}</h3>
              <p className="info-desc">{selectedPost.content}</p>

              {/* {selectedPost.setPoint > 0 && (
                <div className="reward-info">
                  💰 {selectedPost.setPoint.toLocaleString()} 포인트
                </div>
              )} */}
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}