import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Filter } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import BottomNavigation from './BottomNavigation';
import { getUserInfo, checkToken, getValidAuthToken } from '../utils/auth';
import { useTheme } from '../utils/theme';
import '../styles/favorites-page.css';
import { API_BASE_URL } from '../config';
import { Dialog } from "@capacitor/dialog";

const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

interface FavoriteItem {
  id: string;
  title: string;
  category: string;
  location: string;
  lat: number;
  lon: number;
  date: string;
  image: string;
  status: 'lost' | 'found';
  bookmarkedAt: string;
  rewardPoints?: number;
  isCompleted: boolean;
}

const CATEGORY_MAP: { [key: string]: string } = {
  'PHONE': '휴대폰',
  'WALLET': '지갑',
  'KEY': '열쇠',
  'BAG': '가방',
  'ELECTRONICS': '전자기기',
  'ACCESSORY': '액세서리',
  'DOCUMENT': '문서',
  'ETC': '기타',
};

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'date'>('recent');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [favorites, filterType, sortBy]);

  const formatLatLon = (lat: number, lon: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return '위치 정보 없음';
    }
    return `위도: ${lat.toFixed(4)}, 경도: ${lon.toFixed(4)}`;
  };

  const resolveAddresses = async (items: FavoriteItem[], retry: number = 0) => {
    if (!items.length) return;
    if (typeof google === 'undefined' || !google.maps?.Geocoder) {
      if (retry < 5 && isMountedRef.current) {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          resolveAddresses(items, retry + 1);
        }, 500);
      }
      return;
    }

    const geocoder = new google.maps.Geocoder();

    for (const item of items) {
      if (!Number.isFinite(item.lat) || !Number.isFinite(item.lon)) continue;
      const address = await new Promise<string>((resolve) => {
        geocoder.geocode({ location: { lat: item.lat, lng: item.lon } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            resolve(formatLatLon(item.lat, item.lon));
          }
        });
      });

      if (!isMountedRef.current) return;
      setFavorites((prev) =>
        prev.map((favorite) =>
          favorite.id === item.id ? { ...favorite, location: address } : favorite
        )
      );
    }
  };

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const token = await getValidAuthToken();
      if (!token) {
        await Dialog.alert({ title: '알림', message: '로그인이 필요합니다.' });
        navigate('/login');
        return;
      }

      const currentUser = getUserInfo();
      if (!currentUser) return;

      const freshUserInfo = await checkToken(currentUser.id.toString());

      if (freshUserInfo && freshUserInfo.likedPosts) {
        const mappedItems: FavoriteItem[] = freshUserInfo.likedPosts.map((post) => {
          const displayImage = post.images && post.images.length > 0 ? post.images[0] : DEFAULT_IMAGE;
          const category = CATEGORY_MAP[post.itemCategory] || post.itemCategory;
          const lat = Number(post.lat);
          const lon = Number(post.lon);
          const fallbackLocation = formatLatLon(lat, lon);

          return {
            id: post.id.toString(),
            title: post.title,
            category: category,
            location: fallbackLocation,
            lat,
            lon,
            date: post.lostAt,
            image: displayImage,
            status: (post.type || 'LOST').toLowerCase() as 'lost' | 'found',
            bookmarkedAt: new Date().toISOString(),
            rewardPoints: post.setPoint,
            isCompleted: post.isCompleted
          };
        });
        setFavorites(mappedItems);
        resolveAddresses(mappedItems);
      } else {
        setFavorites([]);
      }

    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...favorites];

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.status === filterType);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime();
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return 0;
      }
    });

    setFilteredFavorites(filtered);
  };

  const handleRemoveFavorite = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!(await Dialog.confirm({ title: '알림', message: '관심 목록에서 삭제하시겠습니까?' })).value) return;

    try {
      const token = await getValidAuthToken();
      if (!token) {
        await Dialog.alert({ title: '알림', message: "로그인이 필요합니다." });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/post/${itemId}/unlike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 204 || response.ok) {
        setFavorites(prev => prev.filter(item => item.id !== itemId));
        await Dialog.alert({ title: '알림', message: "삭제되었습니다." });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '삭제 실패');
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      await Dialog.alert({ title: '알림', message: '삭제 중 오류가 발생했습니다.' });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>관심 목록을 불러오는 중...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={`favorites-page ${theme}`}>
      {/* Header */}
      <header className="fav-header">
        <div>
          <div className="fav-eyebrow">· WATCHLIST ·</div>
          <div className="fav-title">관심 흔적</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="fav-search-btn" onClick={() => navigate('/search')}>
            <Search size={18} />
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="fav-stats-strip">
        <svg width="200" height="80" viewBox="0 0 200 80" style={{ position: "absolute", right: -10, top: -10, opacity: 0.15, pointerEvents: "none" }}>
          <g stroke="currentColor" strokeWidth="0.8" fill="none">
            <path d="M0 20 Q 50 0, 100 20 T 200 20"/>
            <path d="M0 40 Q 50 20, 100 40 T 200 40"/>
            <path d="M0 60 Q 50 40, 100 60 T 200 60"/>
          </g>
        </svg>
        <div className="fav-stats-item">
          <div className="fav-stats-val">{favorites.length}</div>
          <div className="fav-stats-label">저장됨</div>
        </div>
        <div style={{ width: 1, height: 28, background: "rgba(195,219,200,0.25)", position: "relative", zIndex: 2 }}/>
        <div className="fav-stats-item">
          <div className="fav-stats-val" style={{ color: "var(--c-honey, #D9A441)" }}>{favorites.filter(i => i.isCompleted).length}</div>
          <div className="fav-stats-label">완료/매칭</div>
        </div>
      </div>

      {/* Sort/filter */}
      <div className="fav-filter-row">
        <div className="fav-filter-pills">
          {['all', 'lost', 'found'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`fav-filter-pill ${filterType === type ? 'active' : ''}`}
            >
              {type === 'all' ? '전체' : type === 'lost' ? '분실' : '습득'}
            </button>
          ))}
        </div>
        <button className="fav-sort" onClick={() => setSortBy(sortBy === 'recent' ? 'date' : 'recent')}>
          <span>{sortBy === 'recent' ? '최신순' : '날짜순'}</span>
          <Filter size={10} />
        </button>
      </div>

      {/* List */}
      <div className="fav-list">
        {filteredFavorites.length === 0 ? (
           <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
            <Heart size={48} color="var(--c-slate, #556B60)" style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--c-slate, #556B60)' }}>관심 목록이 비어있습니다.</p>
            <button className="browse-button" onClick={() => navigate('/home')} style={{ marginTop: '16px', background: 'var(--c-forest)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px' }}>아이템 둘러보기</button>
           </div>
        ) : (
          filteredFavorites.map((item) => (
            <div key={item.id} className="fav-card" onClick={() => navigate(`/items/${item.id}`)}>
              <div className={`fav-card-bar ${item.status}`} />
              <div className="fav-card-body">
                <div className="fav-thumb-wrap">
                  <ImageWithFallback src={item.image} alt={item.title} />
                  {item.isCompleted && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>완료</div>
                  )}
                  <button className="fav-heart-btn" onClick={(e) => handleRemoveFavorite(item.id, e)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/></svg>
                  </button>
                </div>
                <div className="fav-card-content">
                  <div className="fav-meta-row">
                    <span className={`fav-type-badge ${item.status}`}>· {item.status.toUpperCase()} ·</span>
                    {item.rewardPoints ? <span className="fav-reward">◆ {item.rewardPoints}</span> : null}
                  </div>
                  <div className="fav-item-title">{item.title}</div>
                  <div className="fav-footer-info">
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location}</span>
                    <span>·</span>
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fav-hint">
        💡 관심 흔적은 내용이 바뀌면 알림을 받을 수 있어요
      </div>

      <BottomNavigation />
    </div>
  );
};

export default FavoritesPage;
