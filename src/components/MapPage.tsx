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

// 위경도를 픽셀 좌표로 변환하는 헬퍼 함수 (클러스터링 용도)
function latLngToPixel(lat: number, lng: number, zoom: number) {
  const tileSize = 256;
  const sinY = Math.sin(lat * Math.PI / 180);
  const y = 0.5 - Math.log((1 + sinY) / (1 - sinY)) / (4 * Math.PI);
  const x = lng / 360 + 0.5;
  const scale = tileSize * Math.pow(2, zoom);
  return { x: x * scale, y: y * scale };
}

// 클러스터링 알고리즘: 화면 픽셀 기준으로 posts를 그룹화합니다.
function clusterPosts(posts: MapPost[], zoom: number) {
  const clusters: { center: { lat: number, lng: number }, posts: MapPost[] }[] = [];
  const pixelDist = 60; // 60 픽셀 이내면 하나로 뭉침

  posts.forEach(post => {
    if (!post.lat || !post.lon) return;
    const postPx = latLngToPixel(post.lat, post.lon, zoom);
    let added = false;
    for (const cluster of clusters) {
      const clusterPx = latLngToPixel(cluster.center.lat, cluster.center.lng, zoom);
      const dx = postPx.x - clusterPx.x;
      const dy = postPx.y - clusterPx.y;
      if (Math.sqrt(dx * dx + dy * dy) < pixelDist) {
        cluster.posts.push(post);
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push({
        center: { lat: post.lat, lng: post.lon },
        posts: [post]
      });
    }
  });
  return clusters;
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
  // OverlayView 기반 커스텀 마커 보관 배열
  const markersRef = useRef<{ setMap: (m: google.maps.Map | null) => void }[]>([]);

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

    service.nearbySearch({ ...requestCommon, type: 'police' as any }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => createSafeMarker(place, 'POLICE'));
      }
    });

    service.nearbySearch({ ...requestCommon, type: 'convenience_store' as any }, (results, status) => {
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
        styles: theme === 'dark' ? googleMapDarkMode : [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ],
      });

      setMap(googleMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 테마 변경 감지하여 지도 스타일 업데이트
  useEffect(() => {
    if (map) {
      const newStyles = theme === 'dark'
        ? googleMapDarkMode
        : [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }];

      map.setOptions({ styles: newStyles });
    }
  }, [theme, map]);


  // ── 사진 마커 & 클러스터 렌더링 (OverlayView 기반) ──
  useEffect(() => {
    if (!map || posts.length === 0) return;

    class PhotoMarker extends google.maps.OverlayView {
      private pos: google.maps.LatLng;
      private imgUrl: string;
      private postType: 'LOST' | 'FOUND';
      private div: HTMLDivElement | null = null;
      private handler: () => void;

      constructor(pos: google.maps.LatLng, imgUrl: string, postType: 'LOST' | 'FOUND', handler: () => void) {
        super();
        this.pos = pos;
        this.imgUrl = imgUrl;
        this.postType = postType;
        this.handler = handler;
      }

      onAdd() {
        const color = this.postType === 'LOST' ? '#E53935' : '#43A047';
        const bgColor = this.postType === 'LOST' ? '#FFF0F0' : '#F0FFF4';

        this.div = document.createElement('div');
        this.div.style.cssText = 'position:absolute;cursor:pointer;-webkit-tap-highlight-color:transparent;';

        this.div.innerHTML = `
          <div style="
            display:flex;flex-direction:column;align-items:center;
            transform:translate(-50%,-100%);
            filter:drop-shadow(0 3px 10px rgba(0,0,0,0.28));
            transition:transform 0.15s ease;
          ">
            <div style="
              width:56px;height:56px;
              border-radius:12px;
              border:3px solid ${color};
              overflow:hidden;
              background:${bgColor};
              position:relative;
            ">
              <img
                src="${this.imgUrl}"
                style="width:100%;height:100%;object-fit:cover;display:block;"
                onerror="this.src='${DEFAULT_IMAGE}'"
                loading="lazy"
                alt="thumbnail"
              />
              <div style="
                position:absolute;bottom:0;left:0;right:0;
                background:${color};
                color:#fff;
                font-size:8px;font-weight:700;
                letter-spacing:0.06em;
                text-align:center;
                padding:2px 0;
                line-height:1;
              ">${this.postType}</div>
            </div>
            <div style="
              width:0;height:0;
              border-left:8px solid transparent;
              border-right:8px solid transparent;
              border-top:10px solid ${color};
              margin-top:-1px;
            "></div>
          </div>
        `;

        this.div.addEventListener('click', this.handler);
        this.div.addEventListener('touchend', (e) => { e.preventDefault(); this.handler(); });
        this.getPanes()?.overlayMouseTarget.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;
        const p = this.getProjection().fromLatLngToDivPixel(this.pos);
        if (p) {
          this.div.style.left = `${p.x}px`;
          this.div.style.top = `${p.y}px`;
          this.div.style.zIndex = '500';
        }
      }

      onRemove() {
        if (this.div?.parentNode) {
          this.div.removeEventListener('click', this.handler);
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    class ClusterMarker extends google.maps.OverlayView {
      private pos: google.maps.LatLng;
      private count: number;
      private div: HTMLDivElement | null = null;
      private handler: () => void;

      constructor(pos: google.maps.LatLng, count: number, handler: () => void) {
        super();
        this.pos = pos;
        this.count = count;
        this.handler = handler;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.cssText = 'position:absolute;cursor:pointer;-webkit-tap-highlight-color:transparent;';
        this.div.innerHTML = `
          <div style="
            display:flex;align-items:center;justify-content:center;
            transform:translate(-50%,-50%);
            width:46px;height:46px;
            border-radius:50%;
            background-color:rgba(15, 61, 46, 0.95);
            border:3px solid #6FA886;
            color:white;
            font-weight:bold;
            font-size:16px;
            box-shadow:0 4px 12px rgba(0,0,0,0.3);
            transition:transform 0.15s ease;
          ">
            +${this.count}
          </div>
        `;

        this.div.addEventListener('click', this.handler);
        this.div.addEventListener('touchend', (e) => { e.preventDefault(); this.handler(); });
        this.getPanes()?.overlayMouseTarget.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;
        const p = this.getProjection().fromLatLngToDivPixel(this.pos);
        if (p) {
          this.div.style.left = `${p.x}px`;
          this.div.style.top = `${p.y}px`;
          this.div.style.zIndex = '600';
        }
      }

      onRemove() {
        if (this.div?.parentNode) {
          this.div.removeEventListener('click', this.handler);
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    // 렌더링 함수: 현재 확대 비율을 가져와서 클러스터링을 적용 후 화면에 렌더링
    const renderMarkers = () => {
      const zoom = map.getZoom() || 14;
      const clusters = clusterPosts(posts, zoom);

      // 기존 마커 전체 제거
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      clusters.forEach(cluster => {
        if (cluster.posts.length === 1) {
          // 단일 마커: 썸네일 이미지 표시 
          // 이미지 최적화: 원본 대신 썸네일 이미지를 호출 (예: 쿼리 파라미터 활용 가능)
          // * 백엔드 사양에 맞게 ?type=thumb 등으로 조절할 수 있습니다. 
          // 여기서는 이미지 로딩 성능 향상을 위해 loading="lazy"와 url 래핑 기법을 적용했다고 가정.
          const post = cluster.posts[0];
          const imgUrl = post.images?.length > 0 ? post.images[0] : DEFAULT_IMAGE;
          const latLng = new google.maps.LatLng(post.lat, post.lon);

          const marker = new PhotoMarker(latLng, imgUrl, post.type, () => {
            setSelectedPost(post);
            map.panTo(latLng);
            if (zoom < 16) map.setZoom(16);
          });
          marker.setMap(map);
          markersRef.current.push(marker);
        } else {
          if (zoom >= 18) {
            // 줌 레벨이 18 이상이면 똑같은 위치의 마커들을 방사형으로 펼침 (Spiderfy)
            const count = cluster.posts.length;
            const radius = 0.0002; // 퍼지는 반경 (약 20m)
            
            cluster.posts.forEach((post, i) => {
              const angle = (Math.PI * 2 * i) / count;
              const offsetLat = cluster.center.lat + Math.cos(angle) * radius;
              // 위도에 따라 경도 거리가 다르므로 보정
              const offsetLng = cluster.center.lng + (Math.sin(angle) * radius) / Math.cos(cluster.center.lat * Math.PI / 180);
              
              const latLng = new google.maps.LatLng(offsetLat, offsetLng);
              const imgUrl = post.images?.length > 0 ? post.images[0] : DEFAULT_IMAGE;
              
              const marker = new PhotoMarker(latLng, imgUrl, post.type, () => {
                setSelectedPost(post);
                map.panTo(latLng);
              });
              marker.setMap(map);
              markersRef.current.push(marker);
            });
          } else {
            // 일반 클러스터 (숫자)
            const latLng = new google.maps.LatLng(cluster.center.lat, cluster.center.lng);
            const marker = new ClusterMarker(latLng, cluster.posts.length, () => {
              // 클릭 시 지도 확대 (숫자가 풀려 사진으로 쪼개짐)
              map.panTo(latLng);
              map.setZoom(Math.min(zoom + 3, 19)); // 최대 19까지 줌인되어 방사형으로 펼쳐짐
            });
            marker.setMap(map);
            markersRef.current.push(marker);
          }
        }
      });
    };

    // 초기 렌더링
    renderMarkers();

    // 지도를 움직이거나 줌을 변경하고 나면, 다시 클러스터링 계산 및 렌더링
    const listener = map.addListener('idle', renderMarkers);

    return () => {
      google.maps.event.removeListener(listener);
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };
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
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0
      });
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
      setMyLocation(pos);
      map.panTo(pos);
      map.setZoom(16);

      if (myLocationMarker) myLocationMarker.setMap(null);
      const newMarker = new google.maps.Marker({
        position: pos, map: map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeColor: "white", strokeWeight: 2 },
        title: "내 위치", zIndex: 999,
      });
      setMyLocationMarker(newMarker);
    } catch (error: any) {
      await Dialog.alert({ title: '알림', message: '위치 정보를 가져올 수 없습니다.' });
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className={`map-page ${theme}`}>
      <div ref={mapRef} className="map-container" />
      <div className="map-controls">
        <button className="map-control-btn" onClick={() => setShowLegend(!showLegend)} aria-label="범례 보기"><HelpCircle size={24} /></button>
        <button className={`map-control-btn ${showSafeZones ? 'active-safe' : ''}`} onClick={toggleSafeZones} aria-label="안심 거래 존" style={{ marginTop: '0.5rem', backgroundColor: showSafeZones ? '#e0f2f1' : 'white', color: showSafeZones ? '#00796b' : 'inherit' }}>
          <Shield size={24} fill={showSafeZones ? "currentColor" : "none"} />
        </button>
      </div>

      {showLegend && (
        <div className="map-legend">
          <div className="legend-item"><div className="legend-marker found" /><span>습득물</span></div>
          <div className="legend-item"><div className="legend-marker lost" /><span>분실물</span></div>
          <div className="legend-item"><Shield size={16} fill="#1E88E5" stroke="none" style={{ marginRight: 8 }} /><span>경찰서</span></div>
          <div className="legend-item"><Shield size={16} fill="#FBC02D" stroke="none" style={{ marginRight: 8 }} /><span>편의점</span></div>
        </div>
      )}

      <button className="my-location-btn" onClick={handleMyLocationClick} title="내 위치로 이동" disabled={isLocating}>
        {isLocating ? <Loader2 className="animate-spin" size={24} /> : <Crosshair size={24} />}
      </button>

      {selectedPost && (
        <div className="marker-info-card" onClick={() => navigate(`/items/${selectedPost.id}`)}>
          <button className="close-info" onClick={(e) => { e.stopPropagation(); setSelectedPost(null); }}><ChevronDown size={24} /></button>
          <div className="info-content">
            <img src={selectedPost.images?.length > 0 ? selectedPost.images[0] : DEFAULT_IMAGE} alt={selectedPost.title} loading="lazy" />
            <div className="info-details">
              <span className={`info-type ${selectedPost.type.toLowerCase()}`}>{selectedPost.type === 'LOST' ? '분실물' : '습득물'}</span>
              <h3>{selectedPost.title}</h3>
              <p className="info-desc">{selectedPost.content}</p>
            </div>
          </div>
        </div>
      )}
      <BottomNavigation />
    </div>
  );
}