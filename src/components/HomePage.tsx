import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // [MODIFIED] useLocation 추가
import { motion } from 'motion/react';
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
  AlertCircle,
  Loader2, // Loader icon
} from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
// [MODIFIED] Import getAuthToken (or preferably getValidAuthToken if available)
import { getUserInfo, clearTokens, deleteUser, type UserInfo, getAuthToken, getValidAuthToken } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/home-page.css';
import { Button } from './ui/button';

// [NEW] Interface matching the API response structure for a single post
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
  type: 'lost' | 'found';
  author?: AuthorInfo; // Optional author field
  images: string[];
  setPoint: number;
  itemCategory: string;
  lat: number;
  lon: number;
  lostAt: string; // ISO Date string
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  isAnonymous: boolean;
  isCompleted: boolean;
}

// [NEW] Interface for the overall API response
interface ApiResponse {
    postList: ApiPost[];
}


// Interface for displaying items on the page
interface LostItem {
  id: string; // Use string for React keys
  title: string;
  category: string;
  location: string; // Processed location string
  date: string; // Formatted date string
  image: string; // First image URL or placeholder
  status: 'lost' | 'found';
  isCompleted: boolean;
}

// [MODIFIED] API_BASE_URL을 올바른 기본 주소로 수정합니다.
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation(); // [NEW] location 객체 가져오기
  const [userInfo, setUserInfo] = useState<UserInfo | null>(getUserInfo());
  const [searchQuery, setSearchQuery] = useState('');
  // [MODIFIED] Initialize lostItems as empty array
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // [NEW] Add loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // [NEW] Function to fetch posts from the API
  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    // Use getValidAuthToken to ensure token is not expired and try refreshing if needed
    const token = await getValidAuthToken(); // Changed from getAuthToken

    if (!token) {
      setError('로그인이 필요합니다. 다시 로그인해주세요.');
      setIsLoading(false);
      navigate('/login'); // Redirect to login if no valid token
      return;
    }

    try {
      // [MODIFIED] fetch URL을 수정하여 올바른 엔드포인트(/posts)를 호출합니다.
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json', // Indicate we expect JSON
          // [MODIFIED] 캐시 방지 헤더 추가
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        // Try parsing error response first
        let errorMessage = `HTTP 오류! 상태: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
           try {
               const errorText = await response.text();
               console.error("API Error Response (Non-JSON):", errorText);
               // 404 Not Found에 대한 더 구체적인 메시지 (선택적)
               if (response.status === 404) {
                   errorMessage = `API 엔드포인트를 찾을 수 없습니다: ${API_BASE_URL}/posts`;
               } else {
                   errorMessage = `서버 응답 오류 (상태: ${response.status}).`;
               }
           } catch {}
        }
        throw new Error(errorMessage);
      }

      // Check content type before parsing
       const contentType = response.headers.get("content-type");
       if (!contentType || !contentType.includes("application/json")) {
           const responseText = await response.text();
           console.error("Expected JSON, but received:", contentType, responseText);
           throw new Error("서버로부터 예상치 못한 형식의 응답을 받았습니다.");
       }

      const data: ApiResponse = await response.json();
      const postList = data.postList || []; // Ensure postList is an array
      console.log('Fetched Posts (no-cache):', postList); // Debug log

      // Format API data for display
      const formattedItems: LostItem[] = postList.map((post: ApiPost) => ({
        id: post.id.toString(),
        title: post.title,
        category: post.itemCategory,
        // TODO: Implement actual geocoding if needed
        location: `위도: ${post.lat.toFixed(4)}, 경도: ${post.lon.toFixed(4)}`, // Placeholder location
        date: new Date(post.lostAt).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'short', day: 'numeric'
        }), // Format date
        image: post.images && post.images.length > 0
          ? post.images[0] // Use first image
          : 'https://via.placeholder.com/400x225.png?text=No+Image', // Placeholder image
        status: post.type,
        isCompleted: post.isCompleted,
      }));

      setLostItems(formattedItems); // Update state with fetched items

    } catch (err) {
      console.error('게시글 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };


  // [MODIFIED] useEffect to check login status and fetch posts on mount OR location change
  useEffect(() => {
    if (!userInfo) {
      navigate('/login'); // Redirect if not logged in
    } else {
      console.log('HomePage effect triggered, fetching posts for:', location.pathname); // [MODIFIED] Log
      fetchPosts(); // Fetch posts if logged in
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, navigate, location]); // [MODIFIED] location을 의존성 배열에 추가

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
        alert('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
        navigate('/login', { replace: true });
      } else {
        alert('회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
    // TODO: Implement search filtering logic (client-side or API call)
    // For now, filtering happens on the `filteredItems` variable below
  };

  // Client-side filtering based on search query
  const filteredItems = lostItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    {/* [MODIFIED] Correct navigate path for profile */}
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
        {/* Verification Banner */}
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

        {/* Quick Actions */}
        <div className="quick-actions">
          {/* [MODIFIED] Correct navigate paths */}
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

          {/* Assuming /my-items is the correct route for user's posts */}
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

        {/* Recent Items Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
            <h2 style={{ fontSize: '1.125rem', color: '#111827' }}>최근 등록된 물건</h2>
            <button className="view-all-btn">전체보기</button> {/* TODO: Implement view all */}
          </div>

          {/* [MODIFIED] Conditional rendering for loading, error, data, and no results */}
          {isLoading ? (
            <div className="loading-indicator">
              <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
              <p>게시글을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>{error}</span>
              <button onClick={fetchPosts} className="retry-button">재시도</button>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="items-grid">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  // [MODIFIED] Add completed class and style
                  className={`item-card ${item.isCompleted ? 'completed' : ''}`}
                  onClick={() => navigate(`/item/${item.id}`)} // Navigate to item detail page
                  style={item.isCompleted ? { opacity: 0.6 } : {}}
                >
                  <div className="item-image">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* [MODIFIED] Display "Completed" badge or Lost/Found badge */}
                    {item.isCompleted ? (
                       <Badge
                         className="status-badge completed-badge"
                       >
                         완료
                       </Badge>
                     ) : (
                       <Badge
                         className={item.status === 'lost' ? 'status-badge badge-lost' : 'status-badge badge-found'}
                       >
                         {item.status === 'lost' ? '분실' : '습득'}
                       </Badge>
                     )}
                  </div>
                  <div className="item-info">
                    <h3 className="item-title">{item.title}</h3> {/* Added class for styling */}
                    <div className="item-meta">
                      <div className="meta-item" title={item.location}>
                        <MapPin style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0 }} />
                        <span className="meta-text">{item.location}</span> {/* Added class for styling */}
                      </div>
                      <div className="meta-item">
                        <Calendar style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0 }} />
                        <span className="meta-text">{item.date}</span> {/* Added class for styling */}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <Search style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
              </div>
              <p style={{ color: '#4b5563' }}>
                {searchQuery ? '검색 결과가 없습니다' : '등록된 게시물이 없습니다.'}
              </p>
               {/* Suggest creating a post if no posts exist and no search query */}
               {!searchQuery && lostItems.length === 0 && (
                   <Button onClick={() => navigate('/create')} style={{marginTop: '1rem'}}>
                       <Plus size={16} style={{marginRight: '0.5rem'}} /> 첫 게시물 등록하기
                   </Button>
               )}
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
        aria-label="게시물 등록" // Accessibility
      >
        <Plus style={{ width: '2rem', height: '2rem', color: 'white' }} />
      </motion.button>

      {/* 회원 탈퇴 확인 모달 */}
      {isDeleteDialogOpen && (
        <div className="delete-dialog-overlay">
          <motion.div
            className="delete-dialog-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3>회원 탈퇴</h3>
            <p>정말로 회원 탈퇴를 진행하시겠습니까?<br/>모든 정보가 영구적으로 삭제됩니다.</p>
            <div className="delete-dialog-actions">
              <button onClick={() => setIsDeleteDialogOpen(false)} className="dialog-cancel-btn">취소</button>
              <button onClick={confirmDeleteUser} className="dialog-confirm-btn">탈퇴</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom Safe Area (Handled by MainLayout now) */}
      {/* <div className="bottom-safe-area" /> */}
    </div>
  );
}

