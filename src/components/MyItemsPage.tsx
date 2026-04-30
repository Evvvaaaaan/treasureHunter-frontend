import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Package, Loader2, AlertCircle, Navigation } from 'lucide-react';
import { useTheme } from '../utils/theme';
import { getValidAuthToken, getUserInfo, type UserInfo } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
import '../styles/my-items-page.css';
import { API_BASE_URL } from '../config'; 

interface ApiPost {
  id: number;
  title: string;
  content: string;
  type: 'LOST' | 'FOUND';
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

interface MyItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  category: string;
  content: string;
  location: string;
  date: string;
  image: string;
  status: 'active' | 'completed';
  points: number;
  distance: number | null;
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

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
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
  return R * c;
};

const MyItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  
  const [rawPosts, setRawPosts] = useState<ApiPost[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("위치 정보를 가져올 수 없습니다:", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    loadMyItems();
  }, []);

  const loadMyItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getValidAuthToken();
      if (!token) {
        setError('로그인이 필요합니다.');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      const localUserInfo = getUserInfo();
      if (!localUserInfo || !localUserInfo.id) {
        setError('사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/${localUserInfo.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`데이터를 불러오는데 실패했습니다. (${response.status})`);
      }

      const userData: UserInfo = await response.json();
      
      const myPosts = userData.posts || [];
      
      myPosts.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRawPosts(myPosts as unknown as ApiPost[]);

    } catch (err) {
      console.error('내 게시물 로딩 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const items: MyItem[] = useMemo(() => {
    return rawPosts.map((post) => {
      let distance: number | null = null;
      
      if (userLocation && post.lat && post.lon) {
        distance = getDistance(
          userLocation.lat,
          userLocation.lon,
          post.lat,
          post.lon
        );
      }

      return {
        id: post.id.toString(),
        type: (post.type || 'LOST').toLowerCase() as 'lost' | 'found',
        title: post.title,
        category: CATEGORY_MAP[post.itemCategory] || post.itemCategory,
        content: post.content,
        location: `위도: ${post.lat}, 경도: ${post.lon}`,
        date: post.lostAt,
        image: post.images && post.images.length > 0
          ? post.images[0]
          : DEFAULT_IMAGE, 
        status: post.isCompleted ? 'completed' : 'active',
        points: post.setPoint,
        distance: distance,
      };
    });
  }, [rawPosts, userLocation]);

  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className={`my-items-page ${theme}`}>
      <div className="my-items-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>내 게시물</h1>
        <button className="add-button" onClick={() => navigate('/create')}>
          <Plus size={24} />
        </button>
      </div>

      <div className="my-items-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          전체 <span className="tab-count">{items.length}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'lost' ? 'active' : ''}`}
          onClick={() => setActiveTab('lost')}
        >
          분실물 <span className="tab-count">{items.filter(i => i.type === 'lost').length}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'found' ? 'active' : ''}`}
          onClick={() => setActiveTab('found')}
        >
          습득물 <span className="tab-count">{items.filter(i => i.type === 'found').length}</span>
        </button>
      </div>

      <div className="my-items-content">
        {isLoading ? (
          <div className="loading-container">
            <Loader2 className="loading-spinner" />
            <p>게시물을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={loadMyItems} className="retry-button">다시 시도</button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <Package size={64} className="empty-icon" />
            <h3>등록된 아이템이 없습니다</h3>
            <p>
              {activeTab === 'all' && '아직 등록한 분실물이나 습득물이 없어요'}
              {activeTab === 'lost' && '아직 등록한 분실물이 없어요'}
              {activeTab === 'found' && '아직 등록한 습득물이 없어요'}
            </p>
            <button className="empty-action-btn" onClick={() => navigate('/create')}>
              <Plus size={20} />
              첫 아이템 등록하기
            </button>
          </div>
        ) : (
          <div className="items-list">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="item-card"
                onClick={() => navigate(`/items/${item.id}`)}
              >
                <div className="item-image-container">
                  <img src={item.image} alt={item.title} className="item-image" />
                  
                  <div className="image-overlay">
                    <div className={`type-badge ${item.type}`}>
                      {item.type === 'lost' ? '분실물' : '습득물'}
                    </div>
                  </div>

                  {item.status === 'completed' && (
                    <div className="completed-overlay">
                      완료됨
                    </div>
                  )}
                </div>
                <div className="item-content">
                  <div className="item-header">
                    <h3 className="item-title">{item.title}</h3>
                  </div>
                  
                  <div className="item-meta-row">
                    <span className="item-category-badge">{item.category}</span>
                    {item.points > 0 && (
                      <span className="item-points-badge">
                        💰 {item.points.toLocaleString()}P
                      </span>
                    )}
                  </div>
                  
                  <p className="item-description">{item.content}</p>
                  
                  <div className="item-footer">
                    <div className="detail-row">
                      <Calendar size={14} />
                      <span>{formatDate(item.date)}</span>
                    </div>
                    {item.distance !== null && (
                      <div className="detail-row">
                        <Navigation size={14} />
                        <span>{item.distance.toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MyItemsPage;