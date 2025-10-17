import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DOMKeyframesResolver, motion } from 'motion/react';
import {
  Search,
  MapPin,
  Plus,
  Bell,
  Calendar,
  Tag,
  ChevronRight,
  Map,
  User,
  LogOut,
  Trash2,
} from 'lucide-react';
// import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { getUserInfo, clearTokens } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/home-page.css';
import {deleteUser} from '../utils/auth';


interface LostItem {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  status: 'lost' | 'found';
}

const mockLostItems: LostItem[] = [
  {
    id: '1',
    title: '검은색 지갑',
    category: '지갑',
    location: '강남역 2번 출구',
    date: '2025-10-12',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    status: 'lost',
  },
  {
    id: '2',
    title: 'iPhone 15 Pro',
    category: '휴대폰',
    location: '홍대입구역',
    date: '2025-10-11',
    image: 'https://images.unsplash.com/photo-1592286927505-b0501739b7a5?w=400',
    status: 'found',
  },
  {
    id: '3',
    title: '파란색 우산',
    category: '우산',
    location: '신촌역 1번 출구',
    date: '2025-10-10',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400',
    status: 'lost',
  },
  {
    id: '4',
    title: '열쇠고리 (곰돌이)',
    category: '열쇠',
    location: '서울대입구역',
    date: '2025-10-10',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400',
    status: 'found',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(getUserInfo());
  const [searchQuery, setSearchQuery] = useState('');
  const [lostItems, setLostItems] = useState<LostItem[]>(mockLostItems);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
  };

  const filteredItems = lostItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

   const handleDeleteUser = async () => {
    // 사용자에게 탈퇴 의사를 다시 한 번 확인합니다.
    if (userInfo && window.confirm('정말로 회원 탈퇴를 진행하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // deleteUser API를 호출합니다.
      const success = await deleteUser(userInfo.id.toString());
      
      // API 호출 성공 여부와 관계없이 사용자에게 알리고 로그인 페이지로 보냅니다.
      // deleteUser 함수가 성공 시 내부적으로 토큰을 삭제합니다.
      if (success) {
        alert('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
      } else {
        alert('회원 탈퇴 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
      navigate('/login', { replace: true });
    }
  };
  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-container">
          <div className="header-content">
            {/* Logo */}
            <div className="header-logo">
              <div className="logo-icon">
                <MapPin style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.125rem', color: '#111827' }}>보물찾기</h1>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>분실물 찾기</p>
              </div>
            </div>

            {/* Right Section */}
            <div className="header-actions">
              <button className="notification-btn">
                <Bell style={{ width: '1.25rem', height: '1.25rem', color: '#4b5563' }} />
                <span className="notification-badge" />
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

                {/* Profile Menu */}
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
                    <button onClick={handleLogout} className="menu-item logout">
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

          {/* Search Bar */}
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

      {/* Main Content */}
      <main className="main-content">
        {/* Quick Actions */}
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

        {/* Recent Items */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
            <h2 style={{ fontSize: '1.125rem', color: '#111827' }}>최근 분실물</h2>
            <button className="view-all-btn">전체보기</button>
          </div>

          <div className="items-grid">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="item-card"
                onClick={() => navigate(`/item/${item.id}`)}
              >
                <div className="item-image">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Badge
                    className={item.status === 'lost' ? 'badge-lost' : 'badge-found'}
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: item.status === 'lost' ? '#ef4444' : '#22c55e',
                      color: 'white',
                    }}
                  >
                    {item.status === 'lost' ? '분실' : '발견'}
                  </Badge>
                </div>
                <div className="item-info">
                  <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#111827' }}>{item.title}</h3>
                  <div className="item-meta">
                    <div className="meta-item">
                      <MapPin style={{ width: '0.75rem', height: '0.75rem' }} />
                      <span>{item.location}</span>
                    </div>
                    <div className="meta-item">
                      <Calendar style={{ width: '0.75rem', height: '0.75rem' }} />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">
                <Search style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
              </div>
              <p style={{ color: '#4b5563' }}>검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/create')}
        className="fab"
      >
        <Plus style={{ width: '2rem', height: '2rem', color: 'white' }} />
      </motion.button>

      {/* Bottom Safe Area for Mobile */}
      <div className="bottom-safe-area" />
    </div>
  );
}
