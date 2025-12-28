import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  Plus,
  Bell,
  User,
  LogOut,
  Trash2,
  AlertCircle,
  Loader2,
  Coins,
  Navigation,
  Calendar,
} from 'lucide-react';
import { CapacitorHttp } from '@capacitor/core';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { getUserInfo, clearTokens, deleteUser, type UserInfo, getValidAuthToken } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/home-page.css';
import { Button } from './ui/button';
import BottomNavigation from './BottomNavigation';
import { useInView } from 'react-intersection-observer';

import { API_BASE_URL } from '../config';

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
  hasNext: boolean;
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
  createdAt: string;
}

const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

// Haversine 거리 계산 함수 (km 단위) - 표시용
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

const formatDate = (dateString: string) => {
  if (!dateString) return '';

  let safeTimestamp = dateString;
  if (!safeTimestamp.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safeTimestamp)) {
    safeTimestamp += 'Z';
  }

  const date = new Date(safeTimestamp);
  const now = new Date();

  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) return '방금 전';
  if (diffInSeconds < 60) return '방금 전';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date);
};

export default function HomePage() {
  const navigate = useNavigate();

  const [userInfo] = useState<UserInfo | null>(getUserInfo());
  const [searchQuery, setSearchQuery] = useState('');
  const [rawPosts, setRawPosts] = useState<ApiPost[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [unreadNotifications] = useState(0);

  // Pagination State
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(0);
  const [sortOption, setSortOption] = useState<'latest' | 'distance'>('latest');

  // 무한 스크롤 감지 Ref
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px', // 바닥보다 100px 위에서 미리 로딩
  });

  // 1. 초기 로그인 체크
  // useEffect(() => {
  //   if (!userInfo) navigate('/login');
  // }, [userInfo, navigate]);

  // 2. 위치 정보 가져오기 (마운트 시 1회)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setUserLocation(newLoc);

          // 만약 현재 거리순 탭에 있다면, 위치 정보를 얻자마자 새로고침
          if (sortOption === 'distance') {
            setTimeout(() => {
              setPage(0);
              setHasNextPage(true);
              fetchPosts(0, true, newLoc.lat, newLoc.lon);
            }, 100);
          }
        },
        (error) => console.error("Location error:", error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. API 호출 함수
  const fetchPosts = useCallback(async (
    pageNum: number,
    isReset: boolean = false,
    overrideLat?: number,
    overrideLon?: number
  ) => {
    // 더 이상 페이지가 없고 리셋도 아니면 중단
    if (!isReset && !hasNextPage) return;

    setIsLoading(true);

    const token = await getValidAuthToken();

    if (!token) {
      // setError('로그인이 필요합니다. 다시 로그인해주세요.');
      setIsLoading(false);
      navigate('/login');
      return;
    }

    // 인자로 받은 좌표가 있으면 최우선 사용, 없으면 userLocation 사용, 그것도 없으면 기본값
    const lat = overrideLat || userLocation?.lat || 37.5665;
    const lon = overrideLon || userLocation?.lon || 126.9780;

    try {
      // URL 파라미터 구성 (page, size 추가)
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('size', '10'); // 한 번에 가져올 개수

      // [핵심 수정] 거리순 API 호출 시 파라미터 명세 준수
      if (sortOption === 'distance') {
        params.append('searchType', 'distance'); // 기존 search_type -> searchType 으로 수정
        params.append('lat', lat.toString());
        params.append('lon', lon.toString());
        params.append('maxDistance', '50'); // 필수: 최대 반경 50km
      }

      // const url = `${API_BASE_URL}/posts?${params.toString()}`;

      // const response = await fetch(url, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'content-type': 'application/json',
      //     'origin': 'https://treasurehunter.seohamin.com', // 👈 핵심: 백엔드가 허용하는 오리진으로 위장
      //   },
      // });
      const fullUrl = `${API_BASE_URL}/posts?${params.toString()}`;
      const response = await CapacitorHttp.get({
        url: fullUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          // 필요하다면 Origin 헤더 추가 (대부분 CapacitorHttp에서는 없어도 됨)
          'Origin': 'https://treasurehunter.seohamin.com', 
        },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP 오류! 상태: ${response.status}`);
    
      }
      // CapacitorHttp의 response.data는 이미 파싱된 객체임
      // const data: ApiResponse = await response.json();
      //capacitorHttp 사용시
      const data = response.data as ApiResponse; 
      const newPosts = data.posts || [];
      // 데이터 상태 업데이트 (리셋이면 덮어쓰기, 아니면 이어붙이기)
      setRawPosts((prev) => {
        if (isReset) return newPosts;
        const existingIds = new Set(prev.map(p => p.id));
        const uniquePosts = newPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniquePosts];
      });
      // 다음 페이지 존재 여부 업데이트
      setHasNextPage(data.hasNext);

    } catch (err) {
      console.error('게시글 로딩 실패:', err);
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, sortOption, hasNextPage, navigate]);

  // 4. 초기 로드 및 정렬 변경 시
  useEffect(() => {
    if (userInfo) {
      setPage(0);
      setHasNextPage(true);
      fetchPosts(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, userInfo]);

  // 5. 무한 스크롤 트리거: 화면 바닥 감지 시 페이지 증가
  useEffect(() => {
    // 거리순, 최신순 상관없이 inView가 true가 되면 동작
    if (inView && hasNextPage && !isLoading) {
      setPage((prev) => prev + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasNextPage, isLoading]);

  // 6. 페이지 번호 변경 시 추가 데이터 로드
  useEffect(() => {
    if (page > 0) {
      fetchPosts(page, false); // false = append
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
        alert('회원 탈퇴 완료');
        navigate('/login', { replace: true });
      } else {
        alert('회원 탈퇴 실패');
      }
    }
  };

  // UI용 데이터 가공
  const lostItems: LostItem[] = useMemo(() => {
    const items = rawPosts.map((post: ApiPost) => {
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
        image: post.images && post.images.length > 0 ? post.images[0] : DEFAULT_IMAGE,
        status: (post.type || 'LOST').toLowerCase() as 'lost' | 'found',
        isCompleted: post.isCompleted,
        createdAt: post.createdAt,
      };
    });

    // 클라이언트 사이드 정렬 (API가 정렬해서 주더라도, 위치 거리 계산 후 재정렬 보정)
    if (sortOption === 'distance') {
      return items.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [rawPosts, userLocation, sortOption]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // 클라이언트 검색 필터
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
              {/* <button
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
              </button> */}
              <button
                className="search-toggle-btn"
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              >
                <Search
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    color: "#4b5563",
                  }}
                />
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
          {isSearchExpanded && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSearch}
              style={{ marginTop: "1rem", overflow: "hidden" }}
            >
              <div className="search-wrapper">
                <Search
                  className="search-icon"
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    color: "#9ca3af",
                  }}
                />
                <Input
                  type="text"
                  placeholder="분실물 검색 (예: 지갑, 휴대폰, 강남역...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) {
                      setTimeout(() => setIsSearchExpanded(false), 200);
                    }
                  }}
                  autoFocus
                  style={{
                    paddingLeft: "3rem",
                    height: "3rem",
                    backgroundColor: "#f9fafb",
                    borderColor: "#e5e7eb",
                    borderRadius: "1rem",
                  }}
                />
              </div>
            </motion.form>
          )}
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
          <div className="promo-banner">
            <div className="promo-content">
              <h3>광고 및 프로모션</h3>
              <p>여기에 배너 광고를 추가할 수 있습니다</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
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

          {filteredItems.length > 0 ? (
            <div className="items-grid">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`}
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
                      className={item.status === "lost" ? "badge-lost" : "badge-found"}
                      style={{
                        position: "absolute",
                        top: "0.75rem",
                        right: "0.75rem",
                        backgroundColor: item.status === "lost" ? "#ef4444" : "#22c55e",
                        color: "white",
                        zIndex: 1
                      }}
                    >
                      {item.status === "lost" ? "분실물" : "습득물"}
                    </Badge>
                    {item.isCompleted && (
                      <div style={{
                        position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '14px', zIndex: 5
                      }}>
                        완료됨
                      </div>
                    )}
                  </div>
                  <div className="item-info">
                    <h3 className="item-title" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{item.title}</h3>
                    <div className="item-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                      {item.points > 0 && (
                        <div className="meta-item" title={`리워드: ${item.points}P`}>
                          <Coins style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0, color: '#f59e0b' }} />
                          <span className="meta-text" style={{ color: '#b45309', fontWeight: 600 }}>
                            {item.points.toLocaleString()}P
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '0.25rem' }}>
                        <div className="meta-item" title="내 위치로부터의 거리">
                          <Navigation style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0, color: '#6b7280' }} />
                          <span className="meta-text" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {item.distance !== null ? `${item.distance.toFixed(1)} km` : '거리 미상'}
                          </span>
                        </div>
                        <div className="meta-item" title="게시일">
                          <Calendar style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0, color: '#6b7280' }} />
                          <span className="meta-text" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* [NEW] 무한 스크롤 트리거 및 로딩바 */}
              {hasNextPage && (
                <div
                  ref={ref}
                  style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '20px 0' }}
                >
                  {isLoading && (
                    <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="no-results">
              {isLoading && page === 0 ? (
                <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
              ) : (
                <>
                  <div className="no-results-icon">
                    <Search style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
                  </div>
                  <p style={{ color: '#4b5563' }}>
                    {searchQuery ? '검색 결과가 없습니다' : '등록된 게시물이 없습니다.'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => navigate('/create')} style={{ marginTop: '1rem' }}>
                      <Plus size={16} style={{ marginRight: '0.5rem' }} /> 첫 게시물 등록하기
                    </Button>
                  )}
                </>
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
        style={{ bottom: '7.5rem', right: '0.5rem' }}
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
            <p>정말로 회원 탈퇴를 진행하시겠습니까?<br />모든 정보가 영구적으로 삭제됩니다.</p>
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