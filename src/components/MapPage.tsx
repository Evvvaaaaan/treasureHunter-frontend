import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Loader2, Crosshair, HelpCircle, Shield } from 'lucide-react'; // Loader2 추가
import BottomNavigation from './BottomNavigation';
import { useTheme } from '../utils/theme';
import { getValidAuthToken } from '../utils/auth';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import '../styles/map-page.css';
import { API_BASE_URL } from '../config';

const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

// [Snazzy Maps Style: Becomeadinosaur]
const mapStyles = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ffffff"
      },
      {
        "weight": "0.20"
      },
      {
        "lightness": "28"
      },
      {
        "saturation": "23"
      },
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#494949"
      },
      {
        "lightness": 13
      },
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#144b53"
      },
      {
        "lightness": 14
      },
      {
        "weight": 1.4
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "all",
    "stylers": [
      {
        "color": "#08304b"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0c4152"
      },
      {
        "lightness": 5
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#0b434f"
      },
      {
        "lightness": 25
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#0b3d51"
      },
      {
        "lightness": 16
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [
      {
        "color": "#146474"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "all",
    "stylers": [
      {
        "color": "#021019"
      }
    ]
  }
];

// [수정] API 응답 데이터 타입 정의 (HomePage와 일치)
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
  // 필요한 경우 matchProbability 등 추가
}

interface ApiResponse {
  posts: MapPost[];
}

export default function MapPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);

  // 상태 관리
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [posts, setPosts] = useState<MapPost[]>([]); // 게시글 데이터 (마커용)
  const [selectedPost, setSelectedPost] = useState<MapPost | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [_myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [myLocationMarker, setMyLocationMarker] = useState<google.maps.Marker | null>(null); // 내 위치 마커 상태 추가
  const [isLocating, setIsLocating] = useState(false); // 위치 찾는 중 상태 추가
  const [showLegend, setShowLegend] = useState(false); // 마커 범례 표시 상태
  const [showSafeZones, setShowSafeZones] = useState(false);
  const safeMarkersRef = useRef<google.maps.Marker[]>([]); // 안심 마커 관리
  // 마커 인스턴스 관리를 위한 Ref (지도에서 제거할 때 필요)
  const markersRef = useRef<google.maps.Marker[]>([]);

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

    // 검색 요청 옵션 (반경 1.5km)
    const requestCommon = {
      location: center,
      radius: 1500,
    };

    // 1. 경찰서/지구대 검색
    service.nearbySearch({ ...requestCommon, type: 'police' }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => createSafeMarker(place, 'POLICE'));
      }
    });

    // 2. 편의점 검색 (Google Maps 데이터상 편의점)
    service.nearbySearch({ ...requestCommon, type: 'convenience_store' }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => createSafeMarker(place, 'STORE'));
      }
    });
  };

  const createSafeMarker = (place: google.maps.places.PlaceResult, type: 'POLICE' | 'STORE') => {
    if (!map || !place.geometry?.location) return;

    // 아이콘 설정 (파출소: 파란 방패, 편의점: 노란 방패 느낌)
    // 구글 기본 심볼 경로를 사용하여 커스텀 아이콘 생성
    const iconColor = type === 'POLICE' ? '#1E88E5' : '#FBC02D';
    const shieldPath = "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z";
    const marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location,
      title: place.name,
      icon: {
        path: shieldPath, // 여기에 SVG 경로 문자열을 직접 넣습니다.
        fillColor: iconColor,
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#ffffff',
        scale: 1, // SVG 경로 크기에 맞춰 스케일 조정 (기존 10 -> 1.5 정도가 적당)
        anchor: new google.maps.Point(12, 12), // 아이콘 중심점 설정 (24x24 기준 중앙)
      },
      zIndex: 1,
    });

    // 클릭 시 정보창 (선택 사항)
    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="padding:5px; color:black;"><strong>${place.name}</strong><br/>안심 거래 장소</div>`,
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    safeMarkersRef.current.push(marker);
  };
  // 1. 게시글 데이터 불러오기 (API 연결)
  const fetchPosts = async () => {
    try {
      const token = await getValidAuthToken();
      // 토큰이 없어도 지도는 볼 수 있도록 처리 (필요 시 로그인 페이지 리다이렉트)

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/posts`, {
        headers: headers,
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        // API에서 받아온 리스트를 상태에 저장
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

  // 2. 지도 초기화
  useEffect(() => {
    // Google Maps API가 로드될 때까지 대기하는 로직 추가 (CreateLostItemPage 참고)
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

      const initialCenter = { lat: 37.5665, lng: 126.9780 }; // 서울 시청
      const googleMap = new google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        styles: mapStyles, // [NEW] 커스텀 스타일 적용
      });

      setMap(googleMap);

      // 초기 로딩 시 한 번 내 위치 가져오기 시도 (선택 사항)
      // getCurrentLocation(googleMap); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. 마커 렌더링 (posts 데이터가 변경될 때 실행)
  useEffect(() => {
    if (!map || posts.length === 0) return;

    // 기존 마커들 지도에서 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const pinPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";
    // 새로운 마커 생성
    posts.forEach((post) => {
      // 좌표 데이터가 유효한지 확인
      if (!post.lat || !post.lon) return;

      const markerColor = post.type === 'LOST' ? '#E53935' : '#43A047';

      const marker = new google.maps.Marker({
        position: { lat: post.lat, lng: post.lon },
        map: map,
        title: post.title,
        // 게시글 타입에 따라 마커 색상 구분 (빨강: 분실, 초록: 습득)
        icon: {
          path: pinPath, // 핀 모양 경로 적용
          fillColor: markerColor, // 빨강 or 초록
          fillOpacity: 1,
          strokeWeight: .5,
          strokeColor: '#ffffff', // 흰색 테두리
          scale: 1, // 핀 크기 (조절 가능)
          anchor: new google.maps.Point(12, 22), // [중요] 핀의 뾰족한 끝(바닥)을 좌표 중심으로 설정
        },
        zIndex: 2,
      });

      // 마커 클릭 시 해당 게시글 정보 표시
      marker.addListener("click", () => {
        setSelectedPost(post);
        map.panTo(marker.getPosition() as google.maps.LatLng);
      });

      markersRef.current.push(marker);
    });
  }, [map, posts]);

  // [수정] 내 위치 가져오기 함수 (CreateLostItemPage 참고)
  const handleMyLocationClick = async () => {
    if (!map) return;

    setIsLocating(true); // 로딩 시작

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

      // 기존 내 위치 마커가 있으면 제거
      if (myLocationMarker) {
        myLocationMarker.setMap(null);
      }

      // 내 위치 표시 마커 생성
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
        zIndex: 999, // 다른 마커보다 위에 표시
      });

      setMyLocationMarker(newMarker);

    } catch (error: any) {
      console.error("Error getting location:", error);
      let errorMessage = '위치 정보를 가져올 수 없습니다.';
      if (error.message === 'Location permission denied') {
        errorMessage = '위치 권한이 거부되었습니다.';
      }
      alert(errorMessage);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className={`map-page ${theme}`}>
      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="map-container" />
      {/* [추가] 맵 컨트롤 영역 (물음표 버튼) */}
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

      {/* [추가] 범례 (Legend) 표시 */}
      {showLegend && (
        <div className="map-legend">
          <div className="legend-item">
            {/* found 클래스는 초록색 (습득물) */}
            <div className="legend-marker found" />
            <span>습득물</span>
          </div>
          <div className="legend-item">
            {/* lost 클래스는 빨간색 (분실물) */}
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
      {/* 내 위치로 이동 버튼 */}
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

      {/* 마커 정보 카드 (선택된 게시글이 있을 때 표시) */}
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
            {/* 이미지 */}
            <img
              src={selectedPost.images && selectedPost.images.length > 0
                ? selectedPost.images[0]
                : DEFAULT_IMAGE}
              alt={selectedPost.title}
            />

            {/* 상세 정보 */}
            <div className="info-details">
              <span className={`info-type ${selectedPost.type.toLowerCase()}`}>
                {selectedPost.type === 'LOST' ? '분실물' : '습득물'}
              </span>
              <h3>{selectedPost.title}</h3>
              <p className="info-desc">{selectedPost.content}</p>

              {/* 포인트 정보 (있을 경우만 표시) */}
              {selectedPost.setPoint > 0 && (
                <div className="reward-info">
                  💰 {selectedPost.setPoint.toLocaleString()} 포인트
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      <BottomNavigation />
    </div>
  );
}