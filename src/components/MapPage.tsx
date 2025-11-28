import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Crosshair, Search, List, ArrowRight, ChevronDown } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { useTheme } from '../utils/theme';
import { getValidAuthToken } from '../utils/auth';
import '../styles/map-page.css';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';
const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

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
  const [isLoading, setIsLoading] = useState(true);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // 마커 인스턴스 관리를 위한 Ref (지도에서 제거할 때 필요)
  const markersRef = useRef<google.maps.Marker[]>([]);

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
    if (!mapRef.current || typeof google === 'undefined') return;

    const initialCenter = { lat: 37.5665, lng: 126.9780 }; // 서울 시청
    const googleMap = new google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });

    setMap(googleMap);

    // 내 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMyLocation(pos);
          googleMap.setCenter(pos);
          
          // 내 위치 표시 마커
          new google.maps.Marker({
            position: pos,
            map: googleMap,
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
        },
        () => console.warn("Geolocation error")
      );
    }
  }, []);

  // 3. 마커 렌더링 (posts 데이터가 변경될 때 실행)
  useEffect(() => {
    if (!map || posts.length === 0) return;

    // 기존 마커들 지도에서 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새로운 마커 생성
    posts.forEach((post) => {
      // 좌표 데이터가 유효한지 확인
      if (!post.lat || !post.lon) return;

      const marker = new google.maps.Marker({
        position: { lat: post.lat, lng: post.lon },
        map: map,
        title: post.title,
        // 게시글 타입에 따라 마커 색상 구분 (빨강: 분실, 초록: 습득)
        icon: post.type === 'LOST' 
          ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });

      // 마커 클릭 시 해당 게시글 정보 표시
      marker.addListener("click", () => {
        setSelectedPost(post);
        map.panTo(marker.getPosition() as google.maps.LatLng);
      });

      markersRef.current.push(marker);
    });
  }, [map, posts]);

  const handleMyLocationClick = () => {
    if (map && myLocation) {
      map.panTo(myLocation);
      map.setZoom(15);
    } else {
      alert("현재 위치를 확인할 수 없습니다.");
    }
  };

  return (
    <div className={`map-page ${theme}`}>
      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="map-container" />

      

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