import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  Plus,
  User,
  LogOut,
  Trash2,
  AlertCircle,
  Loader2,
  MapPin,
  Heart
} from 'lucide-react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getUserInfo, clearTokens, deleteUser, type UserInfo, getValidAuthToken } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/home-page.css';
import BottomNavigation from './BottomNavigation';
import { useInView } from 'react-intersection-observer';
import { API_BASE_URL } from '../config';
import type { Post } from '../types/post';
import { Dialog } from "@capacitor/dialog";

interface ApiResponse {
  clientLat: number;
  clientLon: number;
  hasNext: boolean;
  posts: Post[];
}

interface LostItem {
  id: string;
  title: string;
  content: string;
  points: number;
  distance: number | null;
  image: string;
  hasImage: boolean;
  status: 'lost' | 'found';
  location: string | null;
  isCompleted: boolean;
  createdAt: string;
  isLiked: boolean;
}

const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  let safeTimestamp = dateString;
  if (!safeTimestamp.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safeTimestamp)) {
    safeTimestamp += 'Z';
  }
  const date = new Date(safeTimestamp);
  if (isNaN(date.getTime())) return '';
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



const getTodayLabel = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `TODAY · ${mm}/${dd}`;
};

// ── Radar decoration for hero card ──
const RadarDecoration = () => (
  <svg className="hero-radar" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
    <circle cx="80" cy="80" r="50" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
    <circle cx="80" cy="80" r="30" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
    <circle cx="80" cy="80" r="4" fill="rgba(255,255,255,0.4)" />
    <line x1="80" y1="10" x2="80" y2="150" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    <line x1="10" y1="80" x2="150" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
  </svg>
);

type ActiveTab = 'all' | 'lost' | 'found' | 'recent' | 'distance';

export default function HomePage() {
  const navigate = useNavigate();

  const [userInfo] = useState<UserInfo | null>(getUserInfo());
  const [searchQuery, setSearchQuery] = useState('');
  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');

  // Search refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Pagination
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(0);
  const [sortOption, setSortOption] = useState<'latest' | 'distance'>('latest');

  const { ref: bottomRef, inView } = useInView({ threshold: 0, rootMargin: '100px' });

  // Keyboard listeners
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const showListener = Keyboard.addListener('keyboardWillShow', () => {
        setIsSearchFocused(true);
      });
      const hideListener = Keyboard.addListener('keyboardWillHide', () => {
        setIsSearchFocused(false);
        // Note: do NOT call document.activeElement.blur() here — it causes search to close immediately
      });
      return () => {
        showListener.then(h => h.remove());
        hideListener.then(h => h.remove());
      };
    }
  }, []);

  // Delayed focus when search expands
  useEffect(() => {
    if (isSearchExpanded) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isSearchExpanded]);

  // Click-outside to close search
  useEffect(() => {
    if (!isSearchExpanded) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsSearchExpanded(false);
        setSearchQuery('');
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsSearchExpanded(false); setSearchQuery(''); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchExpanded]);

  // Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.error('Location error:', err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch posts
  const resolveAddresses = async (postsToResolve: Post[]) => {
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      for (const post of postsToResolve) {
        if (post.location && !post.location.match(/^-?\d+\.\d+/)) continue;
        
        try {
          const response = await geocoder.geocode({ location: { lat: post.lat, lng: post.lon } });
          if (response.results && response.results[0]) {
            const address = response.results[0].formatted_address.replace(/^대한민국\s*/, '');
            const parts = address.split(' ');
            const shortAddress = parts.length >= 3 ? `${parts[1]} ${parts[2]}` : address;
            
            setRawPosts(prev => 
              prev.map(p => p.id === post.id ? { ...p, location: shortAddress } : p)
            );
          }
        } catch (e) {
          console.error("Geocoding failed for post", post.id, e);
        }
      }
    }
  };

  const fetchPosts = useCallback(async (
    pageNum: number,
    isReset: boolean = false,
    overrideLat?: number,
    overrideLon?: number
  ) => {
    if (!isReset && !hasNextPage) return;
    setIsLoading(true);
    try {
      const token = await getValidAuthToken();
      if (!token) { navigate('/login'); return; }

      const lat = overrideLat ?? userLocation?.lat ?? 37.5665;
      const lon = overrideLon ?? userLocation?.lon ?? 126.9780;

      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('size', '10');
      params.append('lat', lat.toString());
      params.append('lon', lon.toString());

      if (sortOption === 'distance') {
        params.append('searchType', 'distance');
        params.append('maxDistance', '50');
      }

      const response = await CapacitorHttp.get({
        url: `${API_BASE_URL}/posts?${params.toString()}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': 'https://treasurehunter.seohamin.com',
        },
      });

      if (response.status !== 200) throw new Error(`HTTP 오류: ${response.status}`);

      const data = response.data as ApiResponse;
      const newPosts = (data.posts || []).map(p => ({
        ...p,
        location: p.location || `${p.lat.toFixed(3)}, ${p.lon.toFixed(3)}`
      }));
      setRawPosts((prev) => {
        if (isReset) return newPosts;
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...newPosts.filter(p => !existingIds.has(p.id))];
      });
      setHasNextPage(data.hasNext);

      resolveAddresses(newPosts);
    } catch (err) {
      console.error('게시글 로딩 실패:', err);
    } finally {
      setIsLoading(false);
      if (pageNum === 0) setHasLoadedOnce(true);
    }
  }, [userLocation, sortOption, hasNextPage, navigate]);

  useEffect(() => {
    setPage(0);
    setHasNextPage(true);
    fetchPosts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, userLocation]);

  useEffect(() => {
    if (inView && hasNextPage && !isLoading) setPage(p => p + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasNextPage, isLoading]);

  useEffect(() => {
    if (page > 0) fetchPosts(page, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Tab change handler
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'distance') {
      setSortOption('distance');
    } else {
      setSortOption('latest');
    }
  };

  const handleLogout = () => { clearTokens(); navigate('/login'); };

  const handleDeleteUser = () => { setShowProfileMenu(false); setIsDeleteDialogOpen(true); };

  const confirmDeleteUser = async () => {
    if (userInfo) {
      const success = await deleteUser(userInfo.id.toString());
      setIsDeleteDialogOpen(false);
      if (success) {
        await Dialog.alert({ title: '알림', message: '회원 탈퇴 완료' });
        clearTokens();
        window.location.href = '/login';
      } else {
        await Dialog.alert({ title: '알림', message: '회원 탈퇴 실패' });
      }
    }
  };

  // Data processing
  const lostItems: LostItem[] = useMemo(() => {
    let blockedUsers: string[] = [];
    try {
      blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
    } catch {
      localStorage.removeItem('blockedUsers');
    }
    const items = rawPosts
      .filter((post: Post) => !blockedUsers.includes(String(post.author?.id || '')))
      .map((post: Post) => ({
        id: post.id.toString(),
        title: post.title,
        content: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
        points: post.setPoint,
        distance: post.distance !== undefined ? post.distance : null,
        image: post.images?.length > 0 ? post.images[0] : DEFAULT_IMAGE,
        hasImage: (post.images?.length ?? 0) > 0,
        status: (post.type || 'LOST').toLowerCase() as 'lost' | 'found',
        location: post.location ?? null,
        isCompleted: post.isCompleted,
        createdAt: post.createdAt,
        isLiked: post.isLiked || false,
      }));
    if (sortOption === 'latest') {
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return items;
  }, [rawPosts, sortOption]);

  // Hero stats
  const lostCount = useMemo(() => rawPosts.filter(p => p.type === 'LOST' && !p.isCompleted).length, [rawPosts]);
  const foundCount = useMemo(() => rawPosts.filter(p => p.type === 'FOUND' && !p.isCompleted).length, [rawPosts]);
  const totalCount = lostCount + foundCount;

  // Filter by active tab
  const filteredItems = useMemo(() => {
    let items = lostItems;
    // Search filter
    if (searchQuery) {
      items = items.filter(i =>
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Type filter
    if (activeTab === 'lost') items = items.filter(i => i.status === 'lost');
    else if (activeTab === 'found') items = items.filter(i => i.status === 'found');
    return items;
  }, [lostItems, searchQuery, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const showInitialLoader = !hasLoadedOnce;

  return (
    <div className="home-page">
      {/* ── HEADER ── */}
      <header className="home-header" ref={headerRef}>
        <div className="header-container">
          <div className="header-content">
            {/* Logo + location */}
            <div className="header-logo" onClick={() => setShowProfileMenu(false)}>
              <img
                src="https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=2d/77/2d771d4f0ddfaf94eb77702eb0d1efeba014e9f387b3fa677d216b086b606518.png"
                alt="FindX Logo"
                className="header-logo-img"
              />
              <div>
                <h1 className="header-title">FindX</h1>
                <p className="header-location">
                  <MapPin style={{ width: '0.625rem', height: '0.625rem', display: 'inline', marginRight: '0.2rem' }} />
                  내 주변
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="header-actions">
              <button
                className="header-icon-btn"
                onClick={() => { setIsSearchExpanded(v => !v); setSearchQuery(''); }}
                aria-label="검색"
              >
                <Search style={{ width: '1.125rem', height: '1.125rem' }} />
              </button>

              <div className="profile-menu-wrapper">
                <button
                  className="header-icon-btn"
                  onClick={() => setShowProfileMenu(v => !v)}
                  aria-label="메뉴"
                >
                  <Avatar style={{ width: '1.5rem', height: '1.5rem' }}>
                    <AvatarImage src={userInfo?.profileImage} />
                    <AvatarFallback style={{ backgroundColor: '#0F3D2E', color: '#F5F2E8', fontSize: '0.75rem' }}>
                      {userInfo?.nickname?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="profile-dropdown"
                  >
                    <div className="profile-info">
                      <p style={{ fontSize: '0.875rem', color: '#1A2E1A', fontWeight: 600 }}>{userInfo?.nickname}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6FA886' }}>{userInfo?.name}</p>
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

          {/* Search bar */}
          {isSearchExpanded && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSearch}
              className="search-form"
            >
              <div className="search-wrapper">
                <Search className="search-icon" style={{ width: '1rem', height: '1rem' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input-field"
                  placeholder="분실물 검색 (예: 지갑, 휴대폰...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => { if (!Capacitor.isNativePlatform()) setIsSearchFocused(false); }}
                />
              </div>
            </motion.form>
          )}
        </div>
      </header>

      <main className="main-content">
        {/* ── Banners ── */}
        {(userInfo?.role === 'NOT_VERIFIED' || userInfo?.role === 'NOT_REGISTERED') && (
          <div className="verification-banner">
            <AlertCircle className="banner-icon" />
            <div className="banner-text">
              <strong>휴대폰 인증이 필요합니다.</strong>
              <span>모든 기능을 사용하려면 인증을 완료해주세요.</span>
            </div>
            <button onClick={() => navigate('/verify-phone')} className="banner-button">인증하기</button>
          </div>
        )}
        {userInfo?.name === 'temp' && (
          <div className="verification-banner profile-banner">
            <AlertCircle className="banner-icon" />
            <div className="banner-text">
              <strong>프로필 설정을 완료해주세요.</strong>
              <span>닉네임과 프로필 사진을 설정해보세요.</span>
            </div>
            <button onClick={() => navigate('/setup-profile')} className="banner-button">설정하기</button>
          </div>
        )}

        {/* ── Hero Card ── */}
        <div className="hero-card">
          <RadarDecoration />
          <div className="hero-body">
            <p className="hero-date">{getTodayLabel()}</p>
            <h2 className="hero-headline">
              근처에서<br />
              <span className="hero-count">{totalCount}건</span>의 보물이 기다려요
            </h2>
            <div className="hero-stats">
              <div className="hero-stat-box">
                <span className="hero-stat-label">LOST</span>
                <span className="hero-stat-value">{lostCount}건</span>
              </div>
              <div className="hero-stat-box">
                <span className="hero-stat-label">FOUND</span>
                <span className="hero-stat-value">{foundCount}건</span>
              </div>
              <button className="hero-map-btn" onClick={() => navigate('/map')}>
                지도로 →
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter Chips ── */}
        <div className="filter-chips-wrap">
          <div className="filter-chips">
            {([
              { key: 'all', label: '전체' },
              { key: 'lost', label: `분실물 ${lostCount}` },
              { key: 'found', label: `습득물 ${foundCount}` },
              { key: 'recent', label: '최근' },
              { key: 'distance', label: '근처순' },
            ] as { key: ActiveTab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                className={`filter-chip${activeTab === key ? ' active' : ''}`}
                onClick={() => handleTabChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Item List ── */}
        {showInitialLoader || (isLoading && page === 0) ? (
          <div className="loader-center">
            <Loader2 className="animate-spin" style={{ width: '1.75rem', height: '1.75rem', color: '#0F3D2E' }} />
            <p style={{ color: '#6FA886', fontSize: '0.875rem' }}>불러오는 중...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">
              <Search style={{ width: '1.75rem', height: '1.75rem', color: '#6FA886' }} />
            </div>
            <p style={{ color: '#1A2E1A' }}>
              {searchQuery ? '검색 결과가 없습니다' : '등록된 게시물이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="items-list">
            {filteredItems.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
                className={`item-row row-${item.status}`}
                onClick={() => navigate(`/items/${item.id}`)}
              >
                {/* Left accent bar */}
                <div className={`item-accent-bar accent-${item.status}`} />

                {/* Thumbnail */}
                <div className={`item-thumb ${item.status === 'lost' ? 'thumb-lost' : 'thumb-found'}`}>
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {!item.hasImage && (
                    <span className={`thumb-label label-${item.status}`}>
                      {item.status === 'lost' ? 'LOST' : 'FOUND'}
                    </span>
                  )}
                  <div className="item-thumb-overlay" />
                  {item.isLiked && (
                    <div className="item-heart" onClick={(e) => { e.stopPropagation(); /* TODO: Heart logic */ }}>
                      <Heart fill="currentColor" size={12} />
                    </div>
                  )}
                  {item.isCompleted && (
                    <div className="thumb-completed">완료됨</div>
                  )}
                </div>

                {/* Content */}
                <div className="item-content">
                  {/* 배지 */}
                  <div className="item-meta-row">
                    <span className={`item-pill ${item.status}`}>
                      · {item.status.toUpperCase()} ·
                    </span>
                    {item.points > 0 && (
                      <span className="item-points">◆ {item.points >= 10000 ? `${item.points / 10000}만P` : `${item.points}P`}</span>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 className="item-title">{item.title}</h3>

                  {/* 시간 + 위치 */}
                  <div className="item-desc">
                    {item.location || '위치 정보 없음'} · {formatDate(item.createdAt)}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Infinite scroll trigger */}
            {hasNextPage && (
              <div ref={bottomRef} style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
                {isLoading && (
                  <Loader2 className="animate-spin" style={{ width: '1.5rem', height: '1.5rem', color: '#0F3D2E' }} />
                )}
              </div>
            )}

            {/* Bottom spacer — ensures last item clears the nav bar + FAB when all pages loaded */}
            {!hasNextPage && <div style={{ height: '1.5rem' }} />}
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      <button
        onClick={() => navigate('/create')}
        className="fab"
        aria-label="게시물 등록"
      >
        <Plus style={{ width: '1.625rem', height: '1.625rem', color: '#F5F2E8', strokeWidth: 2.5 }} />
      </button>

      {/* ── Delete dialog ── */}
      {isDeleteDialogOpen && (
        <div className="delete-dialog-overlay">
          <motion.div
            className="delete-dialog-content"
            initial={{ opacity: 0, scale: 0.92 }}
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

      {!isSearchFocused && <BottomNavigation />}
    </div>
  );
}
