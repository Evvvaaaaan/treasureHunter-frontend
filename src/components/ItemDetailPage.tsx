import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Calendar, Share2, Flag, Bookmark, MessageCircle, ChevronLeft, ChevronRight, X, Star } from 'lucide-react';
import '../styles/item-detail.css';

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
  matchProbability: number;
  status: 'active' | 'matched' | 'completed';
  viewCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
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

const ItemDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    loadItemDetail();
  }, [id]);

  const loadItemDetail = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://treasurehunter.seohamin.com/api/v1/items/${id}/detail`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setItem(data.item);
      setUser(data.user);
      setIsBookmarked(data.isBookmarked);
    } catch (error) {
      console.error('Failed to load item detail:', error);
      // Mock data for development
      setItem({
        id: id || '1',
        type: 'lost',
        title: 'iPhone 15 Pro 분실했습니다',
        description: '강남역 2번 출구 근처에서 iPhone 15 Pro (퍼플색)을 분실했습니다. 투명 케이스에 스티커가 붙어있습니다.',
        category: '전자기기',
        images: [
          'https://images.unsplash.com/photo-1592286927505-838d8be747f2?w=800',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
          'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=800'
        ],
        location: {
          address: '서울특별시 강남구 강남대로 지하 396',
          coordinates: { lat: 37.498, lng: 127.028 }
        },
        dateInfo: {
          lostDate: '2025-10-20',
          postedDate: '2025-10-20'
        },
        reward: {
          points: 50000,
          description: '찾아주시면 5만 포인트 드립니다!'
        },
        matchProbability: 95,
        status: 'active',
        viewCount: 234,
        bookmarkCount: 12,
        isBookmarked: false
      });

      setUser({
        id: 'user123',
        nickname: '보물사냥꾼',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        trustScore: 98,
        successCount: 24,
        badges: ['신뢰왕', '베테랑', '친절왕'],
        isOnline: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`https://treasurehunter.seohamin.com/api/v1/items/${id}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Bookmark failed:', error);
      setIsBookmarked(!isBookmarked);
    }
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
    navigate(`/chat/${item?.id}`);
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

  if (!item || !user) {
    return (
      <div className="item-detail-error">
        <p>게시물을 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  return (
    <div className="item-detail-page">
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
          <img
            src={item.images[currentImageIndex]}
            alt={`${item.title} - ${currentImageIndex + 1}`}
            onClick={() => setIsImageViewerOpen(true)}
          />
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
        {/* Match Probability */}
        {item.matchProbability >= 70 && (
          <div className="match-badge">
            <span className="match-icon">🎯</span>
            <span>보물 발견 확률 {item.matchProbability}%</span>
          </div>
        )}

        {/* Title & Type */}
        <div className="item-header">
          <span className={`type-badge ${item.type}`}>
            {item.type === 'lost' ? '분실물' : '발견물'}
          </span>
          <h1>{item.title}</h1>
          <div className="item-meta">
            <span className="category">{item.category}</span>
            <span className="views">조회 {item.viewCount}</span>
          </div>
        </div>

        {/* User Info */}
        <div className="user-card" onClick={() => navigate(`/profile/${user.id}`)}>
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
              <span className="success-count">성공 거래 {user.successCount}회</span>
            </div>
          </div>
          <ChevronRight size={20} className="chevron" />
        </div>

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
          <p>{item.description}</p>
        </div>

        {/* Date Info */}
        <div className="info-section">
          <h2>날짜 정보</h2>
          <div className="info-item">
            <Calendar size={18} />
            <div>
              <p className="info-label">{item.type === 'lost' ? '분실 날짜' : '발견 날짜'}</p>
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
            {item.type === 'lost' ? '분실 위치' : '발견 위치'}
          </h2>
          <p className="location-address">{item.location.address}</p>
          <div className="map-container">
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBN5hX-FL_N57xUwRVVuY4ExZQuro5Ti2s&q=${item.location.coordinates.lat},${item.location.coordinates.lng}`}
              width="100%"
              height="250"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions">
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
