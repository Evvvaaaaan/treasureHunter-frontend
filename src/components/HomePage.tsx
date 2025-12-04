import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  Plus,
  Bell,
  Tag,
  ChevronRight,
  Map,
  User,
  LogOut,
  Trash2,
  AlertCircle,
  Loader2,
  Coins,
  Navigation,
} from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { getUserInfo, clearTokens, deleteUser, type UserInfo, getValidAuthToken } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/home-page.css';
import { Button } from './ui/button';
import BottomNavigation from './BottomNavigation';

interface AuthorInfo {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
}

interface ApiPost {
  id: number;
  title: string;
  content: string;
  type: 'LOST' | 'FOUND';
  author?: AuthorInfo;
  images: string[];
  setPoint: number;
  itemCategory: string;
  lat: number;
  lon: number;
  lostAt: string;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  isCompleted: boolean;
}

interface ApiResponse {
    clientLat: number;
    clientLon: number;
    posts: ApiPost[];
}

interface LostItem {
  id: string;
  title: string;
  content: string;
  points: number;
  distance: number | null;
  image: string;
  status: 'lost' | 'found';
  isCompleted: boolean;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';
const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png'; 

// Haversine 거리 계산 함수 (km 단위)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return 0;
  }
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(getUserInfo());
  const [searchQuery, setSearchQuery] = useState('');
  const [rawPosts, setRawPosts] = useState<ApiPost[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // [NEW] 정렬 옵션 상태 추가 (기본값: 최신순)
  const [sortOption, setSortOption] = useState<'latest' | 'distance'>('latest');

  // 위치 정보를 인자로 받아 API를 호출
  const fetchPosts = async (currentLat?: number, currentLon?: number) => {
    setIsLoading(true);
    setError(null);
    const token = await getValidAuthToken();

    if (!token) {
      setError('로그인이 필요합니다. 다시 로그인해주세요.');
      setIsLoading(false);
      navigate('/login');
      return;
    }

    // 위치 정보가 없으면 서울 시청을 기본값으로 사용
    const lat = currentLat || userLocation?.lat || 37.5665;
    const lon = currentLon || userLocation?.lon || 126.9780;

    try {
      let url = `${API_BASE_URL}/posts`;
      
      // [MODIFIED] 정렬 옵션에 따라 URL 변경
      if (sortOption === 'distance') {
        url = `${API_BASE_URL}/posts?search_type=distance&lat=${lat}&lon=${lon}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP 오류! 상태: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
           try {
               const errorText = await response.text();
               console.error("API Error Response (Non-JSON):", errorText);
               if (response.status === 404) {
                   errorMessage = `API 엔드포인트를 찾을 수 없습니다: ${url}`;
               } else {
                   errorMessage = `서버 응답 오류 (상태: ${response.status}).`;
               }
           } catch {}
        }
        throw new Error(errorMessage);
      }

       const contentType = response.headers.get("content-type");
       if (!contentType || !contentType.includes("application/json")) {
           const responseText = await response.text();
           console.error("Expected JSON, but received:", contentType, responseText);
           throw new Error("서버로부터 예상치 못한 형식의 응답을 받았습니다.");
       }

      const data: ApiResponse = await response.json();
      
      console.log('API Response Data:', data); 

      const postList = data.posts || [];
      if (!Array.isArray(postList)) {
          console.error("API did not return an array in data.posts:", data);
          throw new Error("서버로부터 게시글 목록(배열)을 받지 못했습니다.");
      }
      
      console.log('Extracted postList:', postList);

      setRawPosts(postList); 

    } catch (err) {
      console.error('게시글 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // [NEW] 정렬 옵션이 변경될 때마다 데이터 다시 로드
  useEffect(() => {
    if (userInfo) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption]);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      // 초기 로딩 시 (sortOption이 변경되지 않아도) 데이터 로드
      // sortOption useEffect와 중복 호출을 막기 위해 location이나 mount 시점 제어 필요할 수 있으나
      // 현재 로직상 큰 문제 없음. (엄격하게 하려면 mount ref 사용)
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, navigate, location]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setUserLocation(newLoc);
          console.log("User location updated:", newLoc);
          
          // 위치 기반 정렬 중이라면 위치 업데이트 시 재호출
          if (sortOption === 'distance') {
             fetchPosts(newLoc.lat, newLoc.lon);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      console.warn("Geolocation not supported by this browser.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount 시 1회 실행

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };
  
  const handleDeleteUser = () => {
    setShowProfileMenu(false);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (userInfo) {
      const success = await deleteUser(userInfo.id.toString());
      setIsDeleteDialogOpen(false);
      if (success) {
        alert('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
        navigate('/login', { replace: true });
      } else {
        alert('회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  const lostItems: LostItem[] = useMemo(() => {
    return rawPosts.map((post: ApiPost) => {
      let distance: number | null = null;
      if (userLocation) {
        distance = getDistance(
          userLocation.lat,
          userLocation.lon,
          post.lat,
          post.lon
        );
      }
  
      return {
        id: post.id.toString(),
        title: post.title,
        content: post.content.substring(0, 10) + (post.content.length > 10 ? '...' : ''),
        points: post.setPoint,
        distance: distance,
        image: post.images && post.images.length > 0
          ? post.images[0]
          : DEFAULT_IMAGE,
        status: (post.type || 'LOST').toLowerCase() as 'lost' | 'found',
        isCompleted: post.isCompleted,
      };
    });
  }, [rawPosts, userLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
  };

  const filteredItems = lostItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-logo">
              <div className="logo-icon">
                <MapPin style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.125rem', color: '#111827' }}>Treasure Hunter</h1>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>분실물 찾기</p>
              </div>
            </div>

            <div className="header-actions">
               <button
                className="notification-btn"
                onClick={() => navigate('/notifications')}
              >
                <Bell
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    color: "#4b5563",
                  }}
                />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              <div className="profile-menu-wrapper">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="profile-btn"
                >
                  <Avatar style={{ width: '2rem', height: '2rem' }}>
                    <AvatarImage src={userInfo?.profileImage} />
                    <AvatarFallback style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                      {userInfo?.nickname?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="profile-dropdown"
                  >
                    <div className="profile-info">
                      <p style={{ fontSize: '0.875rem', color: '#111827' }}>{userInfo?.nickname}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{userInfo?.name}</p>
                    </div>
                    <button onClick={() => navigate('/profile')} className="menu-item">
                      <User style={{ width: '1rem', height: '1rem' }} />
                      <span>프로필</span>
                    </button>
                    <button onClick={handleLogout} className="menu-item">
                      <LogOut style={{ width: '1rem', height: '1rem' }} />
                      <span>로그아웃</span>
                    </button>
                    <button onClick={handleDeleteUser} className="menu-item delete-account">
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                        <span>회원 탈퇴</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} style={{ marginTop: '1rem' }}>
            <div className="search-wrapper">
              <Search className="search-icon" style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
              <Input
                type="text"
                placeholder="분실물 검색 (예: 지갑, 휴대폰, 강남역...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '3rem',
                  height: '3rem',
                  backgroundColor: '#f9fafb',
                  borderColor: '#e5e7eb',
                  borderRadius: '1rem',
                }}
              />
            </div>
          </form>
        </div>
      </header>

      <main className="main-content">
        {userInfo?.role === 'NOT_VERIFIED' && (
          <div className="verification-banner">
            <AlertCircle className="banner-icon" />
            <div className="banner-text">
              <strong>본인 인증이 필요합니다.</strong>
              <span>모든 기능을 사용하려면 휴대폰 인증을 완료해주세요.</span>
            </div>
            <button onClick={() => navigate('/verify-phone')} className="banner-button">
              인증하기
            </button>
          </div>
        )}

        <div className="quick-actions">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/map')}
            className="action-card"
          >
            <div className="action-content">
              <div className="action-icon" style={{ backgroundColor: '#dbeafe' }}>
                <Map style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
              </div>
              <div className="action-text">
                <p style={{ fontSize: '0.875rem', color: '#111827' }}>지도 보기</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>주변 분실물</p>
              </div>
            </div>
            <ChevronRight style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/my-items')}
            className="action-card"
          >
            <div className="action-content">
              <div className="action-icon" style={{ backgroundColor: '#f3e8ff' }}>
                <Tag style={{ width: '1.5rem', height: '1.5rem', color: '#9333ea' }} />
              </div>
              <div className="action-text">
                <p style={{ fontSize: '0.875rem', color: '#111827' }}>내 게시물</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>등록 내역</p>
              </div>
            </div>
            <ChevronRight style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
          </motion.button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
            {/* [NEW] Sort Buttons */}
            <div className="sort-buttons">
                <button 
                  className={`sort-btn ${sortOption === 'latest' ? 'active' : ''}`} 
                  onClick={() => setSortOption('latest')}
                >
                  최신순
                </button>
                <button 
                  className={`sort-btn ${sortOption === 'distance' ? 'active' : ''}`} 
                  onClick={() => setSortOption('distance')}
                >
                  거리순
                </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-indicator">
              <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
              <p>게시글을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>{error}</span>
              <button onClick={() => fetchPosts()} className="retry-button">재시도</button>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="items-grid">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="item-card"
                  onClick={() => navigate(`/items/${item.id}`)}
                >
                  <div className="item-image" style={{ position: 'relative' }}>
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    
                    <Badge
                      className={
                        item.status === "lost"
                          ? "badge-lost"
                          : "badge-found"
                      }
                      style={{
                        position: "absolute",
                        top: "0.75rem",
                        right: "0.75rem",
                        backgroundColor:
                          item.status === "lost"
                            ? "#ef4444"
                            : "#22c55e",
                        color: "white",
                        zIndex: 1
                      }}
                    >
                      {item.status === "lost" ? "분실물" : "습득물"}
                    </Badge>

                    {item.isCompleted && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        zIndex: 5
                      }}>
                        완료됨
                      </div>
                    )}
                  </div>
                  <div className="item-info">
                    <h3 className="item-title">{item.title}</h3>
                    <p className="item-content-snippet">{item.content}</p> 
                    <div className="item-meta">
                      <div className="meta-item" title={`리워드: ${item.points}P`}>
                        <Coins style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0, color: '#f59e0b' }} />
                        <span className="meta-text" style={{ color: item.points > 0 ? '#b45309' : 'inherit' }}>
                          {item.points.toLocaleString()}P
                        </span>
                      </div>
                      <div className="meta-item" title="내 위치로부터의 거리">
                        <Navigation style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0 }} />
                        <span className="meta-text">
                          {item.distance !== null ? `${item.distance.toFixed(1)} km` : '거리 계산 중...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <Search style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
              </div>
              <p style={{ color: '#4b5563' }}>
                {searchQuery ? '검색 결과가 없습니다' : '등록된 게시물이 없습니다.'}
              </p>
               {!searchQuery && lostItems.length === 0 && (
                   <Button onClick={() => navigate('/create')} style={{marginTop: '1rem'}}>
                       <Plus size={16} style={{marginRight: '0.5rem'}} /> 첫 게시물 등록하기
                   </Button>
               )}
            </div>
          )}
        </div>
      </main>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/create')}
        className="fab"
        style={{bottom: '5.5rem', right: '0.5rem'}}
        aria-label="게시물 등록"
      >
        <Plus style={{ width: '2rem', height: '2rem', color: 'white' }} />
      </motion.button>

      {isDeleteDialogOpen && (
        <div className="delete-dialog-overlay">
          <motion.div
            className="delete-dialog-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3>회원 탈퇴</h3>
            <p>정말로 회원 탈퇴를 진행하시겠습니까?<br/>모든 정보가 영구적으로 삭제됩니다.</p>
            <div className="delete-dialog-actions">
              <button onClick={() => setIsDeleteDialogOpen(false)} className="dialog-cancel-btn">취소</button>
              <button onClick={confirmDeleteUser} className="dialog-confirm-btn">탈퇴</button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}