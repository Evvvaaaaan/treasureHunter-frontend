import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Calendar, Share2, Flag, Bookmark, MessageCircle, ChevronLeft, ChevronRight, X, Star, Heart } from 'lucide-react';
import { useTheme } from '../utils/theme';
import { getValidAuthToken } from '../utils/auth';
import '../styles/item-detail.css';

// API 응답 데이터 타입 정의
interface ApiPost {
  id: number;
  title: string;
  content: string;
  type: 'LOST' | 'FOUND';
  author?: {
    id: number;
    nickname: string;
    profileImage: string;
    totalScore: number;
    totalReviews: number;
  };
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

interface ItemDetail {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  images: string[];
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  dateInfo: {
    lostDate: string;
    postedDate: string;
  };
  reward: {
    points: number;
    description: string;
  };
  status: 'active' | 'matched' | 'completed';
  viewCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
  likes: number;
  isLiked: boolean;
}

interface UserInfo {
  id: string;
  nickname: string;
  profileImage: string;
  trustScore: number;
  successCount: number;
  badges: string[];
  isOnline: boolean;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

// 카테고리 매핑 객체
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

const ItemDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      loadItemDetail(id);
    }
  }, [id]);

  const loadItemDetail = async (itemId: string) => {
    setIsLoading(true);
    try {
      const token = await getValidAuthToken();
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // API 호출 (/post/{id})
      const response = await fetch(`${API_BASE_URL}/post/${itemId}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch item details: ${response.status}`);
      }

      const data: ApiPost = await response.json();

      // 주소 변환 (좌표 -> 주소)
      let address = '위치 정보 없음';
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        try {
          const geocoder = new google.maps.Geocoder();
          const geocodeResult = await geocoder.geocode({
            location: { lat: data.lat, lng: data.lon }
          });
          if (geocodeResult.results && geocodeResult.results[0]) {
            address = geocodeResult.results[0].formatted_address;
          }
        } catch (e) {
          console.error("Geocoding failed:", e);
          address = `위도: ${data.lat}, 경도: ${data.lon}`;
        }
      } else {
         address = `위도: ${data.lat}, 경도: ${data.lon}`;
      }

      // 데이터 매핑
      const mappedItem: ItemDetail = {
        id: data.id.toString(),
        type: (data.type || 'LOST').toLowerCase() as 'lost' | 'found',
        title: data.title,
        description: data.content,
        category: CATEGORY_MAP[data.itemCategory] || data.itemCategory,
        images: data.images && data.images.length > 0 
          ? data.images 
          : ['https://via.placeholder.com/800x600?text=No+Image'],
        location: {
          address: address,
          coordinates: { lat: data.lat, lng: data.lon }
        },
        dateInfo: {
          lostDate: data.lostAt,
          postedDate: data.createdAt
        },
        reward: {
          points: data.setPoint,
          description: data.setPoint > 0 ? `${data.setPoint.toLocaleString()} 포인트` : '사례금 없음'
        },
        status: data.isCompleted ? 'completed' : 'active',
        viewCount: 0, 
        bookmarkCount: 0,
        isBookmarked: false,
        likes: 0,
        isLiked: false
      };

      setItem(mappedItem);

      // 작성자 정보 매핑
      if (data.author && !data.isAnonymous) {
        setUser({
          id: data.author.id.toString(),
          nickname: data.author.nickname,
          profileImage: data.author.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          trustScore: data.author.totalScore || 0,
          successCount: 0,
          badges: [],
          isOnline: false
        });
      } else {
        setUser({
          id: 'anonymous',
          nickname: '익명',
          profileImage: 'https://via.placeholder.com/200?text=Anonymous',
          trustScore: 0,
          successCount: 0,
          badges: [],
          isOnline: false
        });
      }

    } catch (error) {
      console.error("Error loading item details:", error);
      setItem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title,
          text: item?.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    }
  };

  const handleReport = () => {
    if (confirm('이 게시물을 신고하시겠습니까?')) {
      alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
    }
  };

  const handleStartChat = () => {
    alert("채팅 기능 준비 중입니다.");
  };

  const handleLike = () => {
    if (item) {
      setItem({
        ...item,
        likes: item.isLiked ? item.likes - 1 : item.likes + 1,
        isLiked: !item.isLiked
      });
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (item?.images.length || 0) - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (item?.images.length || 0) - 1 : prev - 1
    );
  };

  if (isLoading) {
    return (
      <div className="item-detail-loading">
        <div className="loading-spinner"></div>
        <p>보물 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-detail-error">
        <p>게시물을 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/home')}>홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className={`item-detail-page ${theme}`}>
      {/* Header */}
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <div className="header-actions">
          <button className="icon-button" onClick={handleShare}>
            <Share2 size={20} />
          </button>
          <button className="icon-button" onClick={handleReport}>
            <Flag size={20} />
          </button>
        </div>
      </div>

      {/* Image Slider */}
      <div className="image-slider">
        <div className="slider-container">
          {item.images.length > 0 && (
            <img
              src={item.images[currentImageIndex]}
              alt={`${item.title} - ${currentImageIndex + 1}`}
              onClick={() => setIsImageViewerOpen(true)}
            />
          )}
          {item.images.length > 1 && (
            <>
              <button className="slider-nav prev" onClick={prevImage}>
                <ChevronLeft size={24} />
              </button>
              <button className="slider-nav next" onClick={nextImage}>
                <ChevronRight size={24} />
              </button>
              <div className="slider-indicators">
                {item.images.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="image-counter">
          {currentImageIndex + 1} / {item.images.length}
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        {/* Title & Type */}
        <div className="item-header">
          <span className={`type-badge ${item.type}`}>
            {/* [수정] 발견물 -> 습득물 */}
            {item.type === 'lost' ? '분실물' : '습득물'}
          </span>
          {item.status === 'completed' && (
             <span className="type-badge completed" style={{marginLeft: '8px', background: '#6b7280', color: 'white'}}>
               완료
             </span>
          )}
          <h1>{item.title}</h1>
          <div className="item-meta">
            <span className="category">{item.category}</span>
            <span className="views">조회 {item.viewCount}</span>
          </div>
        </div>

        {/* User Info */}
        {user && (
            <div className="user-card" onClick={() => user.id !== 'anonymous' && navigate(`/other-profile/${user.id}`)}>
            <div className="user-avatar-wrapper">
                <img src={user.profileImage} alt={user.nickname} className="user-avatar" />
                {user.isOnline && <span className="online-indicator"></span>}
            </div>
            <div className="user-info">
                <div className="user-name">
                <span>{user.nickname}</span>
                {user.badges.map((badge, idx) => (
                    <span key={idx} className="user-badge">{badge}</span>
                ))}
                </div>
                <div className="user-stats">
                <span className="trust-score">
                    <Star size={14} fill="#10b981" stroke="#10b981" />
                    신뢰도 {user.trustScore}%
                </span>
                </div>
            </div>
            {user.id !== 'anonymous' && <ChevronRight size={20} className="chevron" />}
            </div>
        )}

        {/* Reward */}
        {item.reward.points > 0 && (
          <div className="reward-card">
            <div className="reward-icon">💰</div>
            <div className="reward-info">
              <p className="reward-points">{item.reward.points.toLocaleString()} 포인트</p>
              <p className="reward-description">{item.reward.description}</p>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="description-section">
          <h2>상세 설명</h2>
          <p style={{whiteSpace: 'pre-wrap'}}>{item.description}</p>
        </div>

        {/* Date Info */}
        <div className="info-section">
          <h2>날짜 정보</h2>
          <div className="info-item">
            <Calendar size={18} />
            <div>
              {/* [수정] 발견 날짜 -> 습득 날짜 */}
              <p className="info-label">{item.type === 'lost' ? '분실 날짜' : '습득 날짜'}</p>
              <p className="info-value">{new Date(item.dateInfo.lostDate).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
          <div className="info-item">
            <Calendar size={18} />
            <div>
              <p className="info-label">게시 날짜</p>
              <p className="info-value">{new Date(item.dateInfo.postedDate).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="location-section">
          <h2>
            <MapPin size={20} />
            {/* [수정] 발견 위치 -> 습득 위치 */}
            {item.type === 'lost' ? '분실 위치' : '습득 위치'}
          </h2>
          <p className="location-address">{item.location.address}</p>
          <div className="map-container">
            <iframe
              src={`https://maps.google.com/maps?q=${item.location.coordinates.lat},${item.location.coordinates.lng}&z=15&output=embed`}
              width="100%"
              height="250"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen
              loading="lazy"
              title="map"
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions">
        <button 
          className={`like-button ${item.isLiked ? 'active' : ''}`}
          onClick={handleLike}
        >
          <Heart 
            size={20} 
            fill={item.isLiked ? "#ef4444" : "none"}
            stroke={item.isLiked ? "#ef4444" : "currentColor"}
          />
          <span>{item.likes}</span>
        </button>
        <button 
          className={`bookmark-button ${isBookmarked ? 'active' : ''}`}
          onClick={handleBookmark}
        >
          <Bookmark size={24} fill={isBookmarked ? '#10b981' : 'none'} />
        </button>
        <button className="chat-button" onClick={handleStartChat}>
          <MessageCircle size={20} />
          채팅하기
        </button>
      </div>

      {/* Image Viewer Modal */}
      {isImageViewerOpen && (
        <div className="image-viewer-modal" onClick={() => setIsImageViewerOpen(false)}>
          <button className="close-viewer">
            <X size={32} />
          </button>
          <img
            src={item.images[currentImageIndex]}
            alt={item.title}
            onClick={(e) => e.stopPropagation()}
          />
          {item.images.length > 1 && (
            <>
              <button className="viewer-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <ChevronLeft size={32} />
              </button>
              <button className="viewer-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <div className="viewer-counter">
            {currentImageIndex + 1} / {item.images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;