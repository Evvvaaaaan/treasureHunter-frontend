import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, Filter, Bookmark, Trash2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import BottomNavigation from './BottomNavigation';
import { getUserInfo, checkToken, getValidAuthToken } from '../utils/auth';
import { useTheme } from '../utils/theme';
import '../styles/favorites-page.css';
import { API_BASE_URL } from '../config';

const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

interface FavoriteItem {
  id: string;
  title: string;
  category: string;
  location: string;
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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [favorites, filterType, sortBy]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const token = await getValidAuthToken();
      if (!token) {
        alert('로그인이 필요합니다.');
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

          return {
            id: post.id.toString(),
            title: post.title,
            category: category,
            location: `위도: ${post.lat}, 경도: ${post.lon}`,
            date: post.lostAt,
            image: displayImage,
            status: (post.type || 'LOST').toLowerCase() as 'lost' | 'found',
            bookmarkedAt: new Date().toISOString(),
            rewardPoints: post.setPoint,
            isCompleted: post.isCompleted
          };
        });
        setFavorites(mappedItems);
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

    if (!confirm('관심 목록에서 삭제하시겠습니까?')) return;

    try {
      const token = await getValidAuthToken();
      if (!token) {
        alert("로그인이 필요합니다.");
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
        alert("삭제되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '삭제 실패');
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('삭제 중 오류가 발생했습니다.');
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

  // 테마에 따른 색상 정의
  const isDark = theme === 'dark';
  const headerBg = isDark ? '#111827' : '#ffffff';
  const headerBorder = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#f3f4f6' : '#111827';
  const subTextColor = isDark ? '#9ca3af' : '#6b7280';
  const cardBg = isDark ? '#1f2937' : '#ffffff';

  return (
    // [수정] paddingTop 제거 및 배경색 테마 적용
    <div className={`favorites-page ${theme}`} style={{ minHeight: '100vh', backgroundColor: isDark ? '#030712' : '#f9fafb', paddingBottom: '80px' }}>
      
      {/* Header */}
      <header 
        className="favorites-header"
        // [수정] 다이나믹 아일랜드 해결을 위한 스타일 적용
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: headerBg,
          borderBottom: `1px solid ${headerBorder}`,
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '16px',
          // 핵심: 안전 영역만큼 패딩을 추가
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          color: textColor
        }}
      >
        <div className="header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
              <ArrowLeft size={24} color={textColor} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'inherit', letterSpacing: '-.8px' }}>관심 목록</h1>
          </div>
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            style={{ color: subTextColor }}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            className="filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '16px' }}
          >
            <div className="filter-group">
              <label style={{color: textColor}}>유형</label>
              <div className="filter-buttons">
                {['all', 'lost', 'found'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type as any)}
                    className={filterType === type ? 'active' : ''}
                    style={{ 
                      backgroundColor: filterType === type ? undefined : (isDark ? '#374151' : 'white'),
                      color: filterType === type ? undefined : subTextColor,
                      borderColor: isDark ? '#4b5563' : undefined
                    }}
                  >
                    {type === 'all' ? '전체' : type === 'lost' ? '분실물' : '습득물'}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label style={{color: textColor}}>정렬</label>
              <div className="filter-buttons">
                <button
                  onClick={() => setSortBy('recent')}
                  className={sortBy === 'recent' ? 'active' : ''}
                  style={{ 
                    backgroundColor: sortBy === 'recent' ? undefined : (isDark ? '#374151' : 'white'),
                    color: sortBy === 'recent' ? undefined : subTextColor,
                    borderColor: isDark ? '#4b5563' : undefined
                  }}
                >
                  최근 저장순
                </button>
                <button
                  onClick={() => setSortBy('date')}
                  className={sortBy === 'date' ? 'active' : ''}
                  style={{ 
                    backgroundColor: sortBy === 'date' ? undefined : (isDark ? '#374151' : 'white'),
                    color: sortBy === 'date' ? undefined : subTextColor,
                    borderColor: isDark ? '#4b5563' : undefined
                  }}
                >
                  날짜순
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Count */}
        <div className="favorites-count" style={{ color: subTextColor, marginTop: '16px' }}>
          <Bookmark size={14} />
          <span>총 {filteredFavorites.length}개의 아이템</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="favorites-content" style={{ padding: '20px' }}>
        {filteredFavorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Heart size={64} color="#d1d5db" />
            </div>
            <h2 style={{color: textColor}}>관심 목록이 비어있습니다</h2>
            <p style={{color: subTextColor}}>마음에 드는 아이템을 관심 목록에 추가해보세요!</p>
            <button
              className="browse-button"
              onClick={() => navigate('/home')}
            >
              아이템 둘러보기
            </button>
          </div>
        ) : (
          <div className="favorites-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {filteredFavorites.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="favorite-card"
                onClick={() => navigate(`/items/${item.id}`)}
                style={{ backgroundColor: cardBg, borderColor: headerBorder }}
              >
                <div className="card-image">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Badge
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: item.status === 'lost' ? '#ef4444' : '#10b981',
                      color: 'white',
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: 600
                    }}
                  >
                    {item.status === 'lost' ? '분실' : '습득'}
                  </Badge>

                  {/* 삭제 버튼 */}
                  <button
                    className="remove-favorite-btn"
                    onClick={(e) => handleRemoveFavorite(item.id, e)}
                  >
                    <Trash2 size={14} />
                  </button>

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
                      fontSize: '14px'
                    }}>
                      완료됨
                    </div>
                  )}
                </div>

                <div className="card-content">
                  <div>
                    <h3 style={{color: textColor}}>{item.title}</h3>
                    <span className="category-badge" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', color: subTextColor }}>{item.category}</span>
                  </div>

                  <div className="card-meta">
                    <div className="meta-item">
                      <MapPin size={12} color={subTextColor} />
                      <span style={{color: subTextColor}}>{item.location}</span>
                    </div>
                    <div className="meta-item">
                      <Calendar size={12} color={subTextColor} />
                      <span style={{color: subTextColor}}>{formatDate(item.date)}</span>
                    </div>
                  </div>

                  {item.rewardPoints && item.rewardPoints > 0 && (
                    <div className="reward-badge">
                      <span>💰</span> {item.rewardPoints.toLocaleString()}P
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
        }
      </main >

      <BottomNavigation />
    </div >
  );
};

export default FavoritesPage;