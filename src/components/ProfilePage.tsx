import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Edit2, Star, Award, TrendingUp, 
  MessageCircle, Package, ChevronRight, Camera, LogOut
} from 'lucide-react';
// [변경] API 관련 유틸 함수 import
import { getUserInfo, checkToken, getValidAuthToken, type UserInfo } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
import '../styles/profile-page.css';

// API URL (환경변수 또는 하드코딩)
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

interface UserStats {
  totalItems: number;
  successfulMatches: number;
  currentPoints: number;
  averageRating: number;
  trustScore: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Activity {
  id: string;
  type: 'item_posted' | 'review_received' | 'badge_earned'; // 타입 매핑 변경
  description: string;
  timestamp: string;
  points?: number;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  
  // [변경] 로컬 스토리지 정보와 실제 API 정보를 동기화하기 위한 상태 관리
  const [user, setUser] = useState<UserInfo | null>(getUserInfo());
  
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  
  // [질문] UserInfo에 bio 필드가 없어 임시 상태로 관리합니다.
  const [bio, setBio] = useState('보물을 찾아 헤매는 탐험가'); 
  const [profileImage, setProfileImage] = useState('');
  
  const [stats, setStats] = useState<UserStats>({
    totalItems: 0,
    successfulMatches: 0,
    currentPoints: 0,
    averageRating: 0,
    trustScore: 0,
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  
  // [질문] 뱃지 상세 리스트 API가 확인되지 않아 우선 Mock 데이터 유지
  const [badges] = useState<Badge[]>([
    { id: '1', name: '신뢰왕', description: '신뢰도 95% 이상', icon: '🏆', earnedDate: '2025-09-15', rarity: 'legendary' },
    { id: '2', name: '활동왕', description: '게시글 10개 작성', icon: '🔥', earnedDate: '2025-10-01', rarity: 'common' }
  ]);

  // 1. 데이터 로드 및 동기화
  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = getUserInfo();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // 최신 정보 받아오기
      const freshData = await checkToken(currentUser.id.toString());
      
      if (freshData) {
        setUser(freshData);
        setNickname(freshData.nickname);
        setProfileImage(freshData.profileImage);
        
        // [연결] API 데이터 -> Stats 매핑
        setStats({
          totalItems: freshData.posts?.length || 0, // 작성한 게시글 수
          successfulMatches: freshData.returnedItemsCount || 0, // 반환(성공) 횟수
          currentPoints: freshData.point || 0, // 현재 포인트
          averageRating: freshData.totalReviews > 0 
            ? parseFloat((freshData.totalScore / freshData.totalReviews).toFixed(1)) 
            : 0, // 평점 계산 (총점 / 리뷰수)
          trustScore: freshData.totalScore // 신뢰도 (총점 사용 or 별도 로직)
        });

        // [연결] API 데이터 -> Activities 매핑
        // 게시글(posts)과 받은 리뷰(receivedReviews)를 합쳐서 활동 내역 생성
        const postActivities: Activity[] = (freshData.posts || []).map(post => ({
          id: `post-${post.id}`,
          type: 'item_posted',
          description: `'${post.title}' 게시글 등록`,
          timestamp: post.createdAt
        }));

        const reviewActivities: Activity[] = (freshData.receivedReviews || []).map(review => ({
          id: `review-${review.id}`,
          type: 'review_received',
          description: `후기 도착: "${review.content.substring(0, 10)}..."`,
          timestamp: new Date().toISOString() // 리뷰 날짜 필드가 없다면 현재 시간 혹은 추가 필요
        }));

        // 날짜순 정렬
        const combinedActivities = [...postActivities, ...reviewActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10); // 최근 10개만

        setActivities(combinedActivities);
      }
    };

    loadProfile();
  }, [navigate]);

  // 2. 프로필 이미지 업로드 (기존 로직 + API 연결 준비)
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 미리보기 설정
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // [추가] 여기서 실제 이미지 업로드 API를 호출해야 합니다.
      // const uploadedUrl = await uploadImage(file);
      // setProfileImage(uploadedUrl);
    }
  };

  // 3. 프로필 수정 저장
  const handleSaveProfile = async () => {
    try {
      const token = await getValidAuthToken();
      if (!user || !token) return;

      // [질문] 프로필 수정 API 엔드포인트가 auth.ts에 없습니다.
      // 일반적으로 PUT /api/v1/user/{id} 형식을 사용한다고 가정하고 작성했습니다.
      const response = await fetch(`${API_BASE_URL}/api/v1/user/${user.id}`, {
        method: 'PUT', // 또는 PATCH
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nickname: nickname,
          profileImage: profileImage,
          // bio: bio // API 지원 여부 확인 필요
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // 로컬 스토리지 업데이트 등의 후처리
        setIsEditing(false);
        alert('프로필이 저장되었습니다!');
        // 정보 다시 불러오기
        checkToken(user.id.toString());
      } else {
        throw new Error('Update failed');
      }
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('프로필 저장 실패 (API 엔드포인트 확인 필요)');
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      // [변경] auth.ts의 clearTokens 사용 권장
      localStorage.clear(); 
      navigate('/login');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#fbbf24';
      case 'epic': return '#a855f7';
      case 'rare': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'review_received': return '🎉';
      case 'badge_earned': return '🏅';
      case 'item_posted': return '📦';
      default: return '📌';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${hours}시간 전`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}일 전`;
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1>프로필</h1>
        <button className="settings-button" onClick={() => navigate('/settings')}>
          <Settings size={20} />
        </button>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-image-wrapper">
          <img src={profileImage || user.profileImage} alt="Profile" className="profile-image" />
          {isEditing && (
            <label className="edit-image-btn">
              <Camera size={20} />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        {isEditing ? (
          <div className="profile-edit-form">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="edit-input"
              placeholder="닉네임"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="edit-textarea"
              placeholder="자기소개"
              maxLength={100}
            />
            <div className="edit-actions">
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                취소
              </button>
              <button className="save-btn" onClick={handleSaveProfile}>
                저장
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-info">
            <div className="profile-name">
              <h2>{user.nickname}</h2>
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} />
              </button>
            </div>
            <p className="profile-bio">{bio}</p>
            
            <div className="trust-badge">
              <Star size={16} fill="#10b981" stroke="#10b981" />
              <span>신뢰도 {stats.trustScore}점</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <Package size={24} className="stat-icon" />
          <p className="stat-value">{stats.totalItems}</p>
          <p className="stat-label">등록 아이템</p>
        </div>
        <div className="stat-card">
          <MessageCircle size={24} className="stat-icon" />
          <p className="stat-value">{stats.successfulMatches}</p>
          <p className="stat-label">성공 매칭</p>
        </div>
        <div className="stat-card">
          <TrendingUp size={24} className="stat-icon" />
          <p className="stat-value">{stats.currentPoints.toLocaleString()}</p>
          <p className="stat-label">보유 포인트</p>
        </div>
        <div className="stat-card">
          <Award size={24} className="stat-icon" />
          <p className="stat-value">{stats.averageRating}</p>
          <p className="stat-label">평균 평점</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="section">
        <div className="section-header">
          <h3>획득한 뱃지</h3>
          <span className="badge-count">{user.badgeCount}개</span>
        </div>
        <div className="badges-grid">
          {/* [질문] UserInfo에는 badgeCount 숫자만 있고 실제 뱃지 리스트 데이터가 없습니다.
             API에서 뱃지 리스트를 주는 엔드포인트가 따로 있나요? 
             일단 Mock 데이터(badges)를 표시합니다.
          */}
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className="badge-card"
              style={{ borderColor: getRarityColor(badge.rarity) }}
            >
              <div className="badge-icon">{badge.icon}</div>
              <p className="badge-name">{badge.name}</p>
              <p className="badge-description">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="section">
        <div className="section-header">
          <h3>최근 활동</h3>
        </div>
        <div className="activity-timeline">
          {activities.length > 0 ? activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{getActivityIcon(activity.type)}</div>
              <div className="activity-content">
                <p className="activity-description">{activity.description}</p>
                <p className="activity-time">{formatDate(activity.timestamp)}</p>
              </div>
              {activity.points && (
                <div className="activity-points">+{activity.points.toLocaleString()}P</div>
              )}
            </div>
          )) : (
            <p className="no-data-message">최근 활동 내역이 없습니다.</p>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="menu-section">
        <button className="menu-item" onClick={() => navigate('/store')}>
          <div className="menu-left">
            <div className="menu-icon">💰</div>
            <span>포인트 스토어</span>
          </div>
          <ChevronRight size={20} />
        </button>
        <button className="menu-item" onClick={() => navigate('/my-items')}>
          <div className="menu-left">
            <div className="menu-icon">📦</div>
            <span>내 등록 아이템</span>
          </div>
          <ChevronRight size={20} />
        </button>
        {/* Favorite Items 기능이 auth.ts 데이터에는 likedPosts로 존재함 */}
        <button className="menu-item" onClick={() => navigate('/favorites')}>
          <div className="menu-left">
            <div className="menu-icon">⭐</div>
            <span>관심 목록 ({user.likedPosts?.length || 0})</span>
          </div>
          <ChevronRight size={20} />
        </button>
        <button className="menu-item logout" onClick={handleLogout}>
          <div className="menu-left">
            <LogOut size={20} />
            <span>로그아웃</span>
          </div>
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;