import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Calendar, Share2, Flag, MessageCircle, ChevronLeft, ChevronRight, X, Star, Heart, Edit, Trash, Check, MoreVertical } from 'lucide-react';
import { useTheme } from '../utils/theme';
import { getValidAuthToken, getUserInfo } from '../utils/auth';
import { createChatRoom } from '../utils/chat';
import '../styles/item-detail.css';
import { API_BASE_URL } from '../config'; 
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
  viewCount: number;
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
  likeCount?: number;
  isLiked?: boolean;
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

const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

const ItemDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const currentUser = getUserInfo();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [postAuthor, setPostAuthor] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isMyPost = item && currentUser && postAuthor?.id === currentUser.id.toString();

  // 좌표 -> 주소 변환 함수 (Google Maps Geocoder 사용)
  const convertCoordsToAddress = async (lat: number, lng: number) => {
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
          // "대한민국" 접두어 제거 후 반환
          return response.results[0].formatted_address.replace(/^대한민국\s*/, '');
        }
      } catch (e) {
        console.error("Geocoding failed:", e);
      }
    }
    return null;
  };

  // Google Maps API 로드 대기 및 주소 재업데이트 (데이터 로드 시점에 API가 준비 안 된 경우 대비)
  useEffect(() => {
    if (!item) return;
    // 이미 주소 형식이면(숫자가 아니면) 스킵
    if (item.location.address && !item.location.address.startsWith('위도:')) return;

    const updateAddress = async () => {
        const addr = await convertCoordsToAddress(item.location.coordinates.lat, item.location.coordinates.lng);
        if (addr) {
            setItem(prev => prev ? ({
                ...prev,
                location: {
                    ...prev.location,
                    address: addr
                }
            }) : null);
        }
    };

    if (window.google && window.google.maps) {
        updateAddress();
    } else {
        const interval = setInterval(() => {
            if (window.google && window.google.maps) {
                clearInterval(interval);
                updateAddress();
            }
        }, 500);
        return () => clearInterval(interval);
    }
  }, [item]);

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
      const headers: HeadersInit = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/post/${itemId}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch item details: ${response.status}`);
      }

      const data: ApiPost = await response.json();

      // [수정] 초기 주소 설정: API 로드 상태 확인 후 바로 주소 변환 시도
      let address = `위도: ${data.lat}, 경도: ${data.lon}`; // 기본값 (API 로드 전)
      
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        try {
          const geocoder = new google.maps.Geocoder();
          const geoResponse = await geocoder.geocode({ location: { lat: data.lat, lng: data.lon } });
          if (geoResponse.results && geoResponse.results[0]) {
            address = geoResponse.results[0].formatted_address.replace(/^대한민국\s*/, '');
          }
        } catch (e) {
          console.error("Initial geocoding failed, will retry in useEffect", e);
        }
      }
      
      const images = data.images && data.images.length > 0 
          ? data.images 
          : [DEFAULT_IMAGE];

      const mappedItem: ItemDetail = {
        id: data.id.toString(),
        type: (data.type || 'LOST').toLowerCase() as 'lost' | 'found',
        title: data.title,
        description: data.content,
        category: CATEGORY_MAP[data.itemCategory] || data.itemCategory,
        images: images,
        location: {
          address: address, // 변환된 주소 또는 기본값
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
        viewCount: data.viewCount, 
        bookmarkCount: 0,
        isBookmarked: false,
        likes: data.likeCount || 0,
        isLiked: data.isLiked || false
      };

      setItem(mappedItem);

      if (data.author && !data.isAnonymous) {
        const avgScore = data.author.totalReviews > 0 
            ? data.author.totalScore / data.author.totalReviews 
            : 0;
        const trustScore = Math.round(avgScore); 

        setPostAuthor({
          id: data.author.id.toString(),
          nickname: data.author.nickname,
          profileImage: data.author.profileImage || 'https://via.placeholder.com/150?text=User',
          trustScore: trustScore,
          successCount: 0,
          badges: [],
          isOnline: false
        });
      } else {
        setPostAuthor({
          id: 'anonymous',
          nickname: '익명',
          profileImage: 'https://via.placeholder.com/150?text=Anonymous',
          trustScore: 0,
          successCount: 0,
          badges: [],
          isOnline: false
        });
      }

    } catch (error) {
        console.error("Load detail error", error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleDelete = async () => {
    if (!confirm('정말 이 게시물을 삭제하시겠습니까?')) return;
    try {
      const token = await getValidAuthToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }
      const response = await fetch(`${API_BASE_URL}/post/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('게시물이 삭제되었습니다.');
        navigate('/home');
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      alert('삭제에 실패했습니다.');
    }
    setIsMenuOpen(false);
  };

  const handleLike = async () => {
    if (!item || !id) return;
    const token = await getValidAuthToken();
    if (!token) {
      if(confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?")) navigate('/login');
      return;
    }
    const prevItem = { ...item };
    setItem({
      ...item,
      likes: item.isLiked ? item.likes - 1 : item.likes + 1,
      isLiked: !item.isLiked
    });
    try {
      const action = prevItem.isLiked ? 'unlike' : 'like';
      const response = await fetch(`${API_BASE_URL}/post/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Like action failed');
    } catch (error) {
      setItem(prevItem);
    }
  };

  const handleEdit = () => {
    setIsMenuOpen(false);
    alert("게시글 수정 기능은 준비 중입니다.");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title,
          text: item?.description,
          url: window.location.href
        });
      } catch (error) { console.log('Share cancelled'); }
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

  const handleStartChat = async () => {
    const currentUser = getUserInfo();
    if (!currentUser) {
      if (confirm('로그인이 필요한 서비스입니다. 로그인 하시겠습니까?')) {
        navigate('/login');
      }
      return;
    }
    if (isMyPost) {
      alert("자신의 게시물에는 채팅을 걸 수 없습니다.");
      return;
    }
    try {
      const roomName = `${item?.title}`; 
      const postId = parseInt(item?.id || '0', 10);
      if (!postId) {
        alert("잘못된 게시글 정보입니다.");
        return;
      }
      const roomId = await createChatRoom(roomName, postId, false);
      navigate(`/chat/${roomId}`);
    } catch (error) {
      alert("채팅방을 만들 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => prev === (item?.images.length || 0) - 1 ? 0 : prev + 1);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => prev === 0 ? (item?.images.length || 0) - 1 : prev - 1);
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
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <div className="header-actions">
          <button className="icon-button" onClick={handleShare}>
            <Share2 size={20} />
          </button>
          {isMyPost ? (
            <div className="menu-wrapper">
              <button 
                className="icon-button" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <MoreVertical size={20} />
              </button>
              {isMenuOpen && (
                <>
                  <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)} />
                  <div className="post-menu">
                    <button className="menu-item edit" onClick={handleEdit}>
                      <Edit size={18} /><span>수정</span>
                    </button>
                    <button className="menu-item delete" onClick={handleDelete}>
                      <Trash size={18} /><span>삭제</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button className="icon-button" onClick={handleReport}>
              <Flag size={20} />
            </button>
          )}
        </div>
      </div>

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

      <div className="detail-content">
        <div className="item-header">
          <span className={`type-badge ${item.type}`}>
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
            <span className="views">조회수 {item.viewCount}</span>
          </div>
        </div>

        {postAuthor && (
            <div className="user-card" onClick={() => postAuthor.id !== 'anonymous' && navigate(`/other-profile/${postAuthor.id}`)}>
            <div className="user-avatar-wrapper">
                <img src={postAuthor.profileImage} alt={postAuthor.nickname} className="user-avatar" />
                {postAuthor.isOnline && <span className="online-indicator"></span>}
            </div>
            <div className="user-info">
                <div className="user-name">
                <span>{postAuthor.nickname}</span>
                {postAuthor.badges.map((badge, idx) => (
                    <span key={idx} className="user-badge">{badge}</span>
                ))}
                </div>
                <div className="user-stats">
                <span className="trust-score">
                    <Star size={14} fill="#10b981" stroke="#10b981" />
                    신뢰도 {postAuthor.trustScore}%
                </span>
                </div>
            </div>
            {postAuthor.id !== 'anonymous' && <ChevronRight size={20} className="chevron" />}
            </div>
        )}

        {item.reward.points > 0 && (
          <div className="reward-card">
            <div className="reward-icon">💰</div>
            <div className="reward-info">
              <p className="reward-points">{item.reward.points.toLocaleString()} 포인트</p>
              <p className="reward-description">{item.reward.description}</p>
            </div>
          </div>
        )}

        <div className="description-section">
          <h2>상세 설명</h2>
          <p style={{whiteSpace: 'pre-wrap',wordBreak: 'break-all', overflowWrap: 'break-word'}}>{item.description}</p>
        </div>

        <div className="info-section">
          <h2>날짜 정보</h2>
          <div className="info-item">
            <Calendar size={18} />
            <div>
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

        <div className="location-section">
          <h2>
            <MapPin size={20} />
            {item.type === 'lost' ? '분실 위치' : '습득 위치'}
          </h2>
          <p className="location-address">{item.location.address}</p>
          <div className="map-container">
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBN5hX-FL_N57xUwRVVuY4ExZQuro5Ti2s&q=${item.location.coordinates.lat},${item.location.coordinates.lng}&zoom=15`}
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
        
        {isMyPost ? (
            <button className="chat-button" style={{background: '#e5e7eb', color: '#374151', cursor: 'default'}}>
                내가 쓴 글
            </button>
        ) : (
            <button className="chat-button" onClick={handleStartChat}>
            <MessageCircle size={20} />
            채팅하기
            </button>
        )}
      </div>

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