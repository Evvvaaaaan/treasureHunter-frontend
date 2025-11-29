import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, Filter, Bookmark, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import BottomNavigation from './BottomNavigation';
// auth 유틸리티 import
import { getUserInfo, checkToken, getValidAuthToken, type UserInfo } from '../utils/auth';
import '../styles/my-items-page.css'; // 기존 스타일 재사용 (또는 favorites-page.css)

// API 기본 URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';
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

// 카테고리 매핑
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
  
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'date'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadFavorites();
  }, []);

  // 필터 및 정렬 적용
  useEffect(() => {
    applyFiltersAndSort();
  }, [favorites, filterType, sortBy]);

  // 1. 관심 목록 데이터 불러오기 (User 정보의 likedPosts 활용)
  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const token = await getValidAuthToken();
      if (!token) {
        // 토큰 없으면 로그인 페이지로
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const currentUser = getUserInfo();
      if (!currentUser) return;

      // 최신 유저 정보 조회 (likedPosts 포함)
      const freshUserInfo = await checkToken(currentUser.id.toString());
      
      if (freshUserInfo && freshUserInfo.likedPosts) {
        const mappedItems: FavoriteItem[] = freshUserInfo.likedPosts.map((post) => {
            const displayImage = post.images && post.images.length > 0 ? post.images[0] : DEFAULT_IMAGE;
            const category = CATEGORY_MAP[post.itemCategory] || post.itemCategory;
            
            return {
                id: post.id.toString(),
                title: post.title,
                category: category,
                location: `위도: ${post.lat}, 경도: ${post.lon}`, // 필요시 역지오코딩 추가 가능
                date: post.lostAt,
                image: displayImage,
                status: (post.type || 'LOST').toLowerCase() as 'lost' | 'found',
                bookmarkedAt: new Date().toISOString(), // API에 필드가 없다면 현재 시간 대체
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

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.status === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          // bookmarkedAt 기준으로 정렬
          return new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime();
        case 'date':
          // 분실/습득 날짜 기준으로 정렬
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return 0;
      }
    });

    setFilteredFavorites(filtered);
  };

  // 2. [API 연결] 관심 목록 삭제 (좋아요 해제)
  const handleRemoveFavorite = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    if (!confirm('관심 목록에서 삭제하시겠습니까?')) return;

    try {
      const token = await getValidAuthToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      // API 호출: 좋아요 해제 (Unlike)
      // POST /api/v1/post/{id}/unlike
      const response = await fetch(`${API_BASE_URL}/post/${itemId}/unlike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
        // Body 없음
      });
      
      // 204 No Content 또는 200 OK 성공 처리
      if (response.status === 204 || response.ok) {
          // 성공 시 UI에서 즉시 제거
          setFavorites(prev => prev.filter(item => item.id !== itemId));
          // filteredFavorites는 useEffect에 의해 자동으로 업데이트됨
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>관심 목록을 불러오는 중...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="favorites-page" style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingBottom: '80px' }}>
      {/* Header */}
      <header className="favorites-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 20px' }}>
        <div className="header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
                <ArrowLeft size={24} color="#111827" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#111827' }}>관심 목록</h1>
          </div>
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
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
            style={{ overflow: 'hidden', marginTop: '16px' }}
          >
            <div className="filter-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>유형</label>
              <div className="filter-buttons" style={{ display: 'flex', gap: '8px' }}>
                {['all', 'lost', 'found'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        style={{ 
                            padding: '6px 14px', 
                            borderRadius: '20px', 
                            border: `1px solid ${filterType === type ? '#10b981' : '#e5e7eb'}`,
                            backgroundColor: filterType === type ? '#10b981' : 'white',
                            color: filterType === type ? 'white' : '#6b7280',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {type === 'all' ? '전체' : type === 'lost' ? '분실물' : '습득물'}
                    </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>정렬</label>
              <div className="filter-buttons" style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSortBy('recent')}
                  style={{ 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    border: `1px solid ${sortBy === 'recent' ? '#10b981' : '#e5e7eb'}`,
                    backgroundColor: sortBy === 'recent' ? '#10b981' : 'white',
                    color: sortBy === 'recent' ? 'white' : '#6b7280',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                }}
                >
                  최근 저장순
                </button>
                <button
                  onClick={() => setSortBy('date')}
                  style={{ 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    border: `1px solid ${sortBy === 'date' ? '#10b981' : '#e5e7eb'}`,
                    backgroundColor: sortBy === 'date' ? '#10b981' : 'white',
                    color: sortBy === 'date' ? 'white' : '#6b7280',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                }}
                >
                  날짜순
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Count */}
        <div className="favorites-count" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
          <Bookmark size={14} />
          <span>총 {filteredFavorites.length}개의 아이템</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="favorites-content" style={{ padding: '20px' }}>
        {filteredFavorites.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="empty-icon" style={{ marginBottom: '16px', color: '#d1d5db', display: 'flex', justifyContent: 'center' }}>
              <Heart size={64} />
            </div>
            <h2 style={{ fontSize: '18px', marginBottom: '8px', color: '#111827' }}>관심 목록이 비어있습니다</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>마음에 드는 아이템을 관심 목록에 추가해보세요!</p>
            <button 
              className="browse-button"
              onClick={() => navigate('/home')}
              style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
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
                style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              >
                <div className="card-image" style={{ width: '100%', height: '140px', position: 'relative' }}>
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
                  
                  {/* 삭제 버튼 (우측 상단) */}
                  <button
                    className="remove-favorite-btn"
                    onClick={(e) => handleRemoveFavorite(item.id, e)}
                    style={{ 
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '28px', 
                        height: '28px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        border: 'none', 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ef4444',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
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

                <div className="card-content" style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0', color: '#111827', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
                    <span style={{ fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{item.category}</span>
                  </div>

                  <div className="card-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#6b7280' }}>
                    <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location}</span>
                    </div>
                    <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>

                  {item.rewardPoints && item.rewardPoints > 0 && (
                    <div className="reward-badge" style={{ marginTop: 'auto', fontSize: '12px', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>💰</span> {item.rewardPoints.toLocaleString()}P
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default FavoritesPage;