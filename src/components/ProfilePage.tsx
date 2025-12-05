import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Edit2, Star, Award, TrendingUp, 
  MessageCircle, Package, ChevronRight, Camera, LogOut,
  Activity as ActivityIcon, Bell, Mail, Shield, Trophy
} from 'lucide-react';
import { getUserInfo, checkToken, getValidAuthToken, type UserInfo } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
import { uploadImage } from '../utils/file';
import '../styles/profile-page.css';

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
  type: 'item_posted' | 'review_received' | 'badge_earned';
  description: string;
  timestamp: string;
  points?: number;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<UserInfo | null>(getUserInfo());
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  // API에 bio 필드가 없으므로 로컬 상태로만 관리하거나 제외 (여기서는 제외하고 닉네임/이름 수정에 집중)
  
  const [profileImage, setProfileImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  
  const [stats, setStats] = useState<UserStats>({
    totalItems: 0,
    successfulMatches: 0,
    currentPoints: 0,
    averageRating: 0,
    trustScore: 0,
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  
  // 뱃지 데이터는 API에서 상세 정보를 주지 않으므로 더미 또는 badgeCount 기반 생성
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = getUserInfo();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // 최신 정보 로드
      const freshData = await checkToken(currentUser.id.toString());
      
      if (freshData) {
        setUser(freshData);
        setEditNickname(freshData.nickname);
        setEditName(freshData.name);
        setProfileImage(freshData.profileImage);
        
        // 통계 계산
        setStats({
          totalItems: freshData.posts?.length || 0,
          successfulMatches: freshData.returnedItemsCount || 0,
          currentPoints: freshData.point || 0,
          averageRating: freshData.totalReviews > 0 
            ? parseFloat((freshData.totalScore / freshData.totalReviews).toFixed(1)) 
            : 0,
          trustScore: freshData.totalScore
        });

        // 활동 내역 생성 (게시글 등록 + 리뷰 받음)
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
          timestamp: new Date().toISOString() // 리뷰 생성일이 없다면 현재 시간 임시 사용
        }));

        const combinedActivities = [...postActivities, ...reviewActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);

        setActivities(combinedActivities);

        // 뱃지 생성 (badgeCount 기반 더미)
        const earnedBadges: Badge[] = Array.from({ length: freshData.badgeCount || 0 }).map((_, idx) => ({
            id: `badge-${idx}`,
            name: `뱃지 ${idx + 1}`,
            description: '활동을 통해 획득했습니다.',
            icon: '🏅',
            earnedDate: new Date().toISOString(),
            rarity: 'common'
        }));
        setBadges(earnedBadges);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const token = await getValidAuthToken();
      if (!token) throw new Error("인증 토큰이 없습니다.");

      let finalImageUrl = user.profileImage; 

      if (editImageFile) {
        try {
          finalImageUrl = await uploadImage(editImageFile);
        } catch (uploadError) {
          console.error("이미지 업로드 실패:", uploadError);
          alert("이미지 업로드에 실패했습니다.");
          setIsSaving(false);
          return;
        }
      }

      // 프로필 수정 API 호출 (PATCH)
      const response = await fetch(`${API_BASE_URL}/user/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: editNickname,
          profileImage: finalImageUrl,
          name: editName
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        // 로컬 스토리지 정보도 갱신해주면 좋음 (checkToken이 해주긴 함)
        setIsEditing(false);
        alert('프로필이 저장되었습니다!');
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || '프로필 수정 실패');
      }

    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(`프로필 저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
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
    try {
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
    } catch {
        return dateString;
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1>프로필</h1>
        <button className="menu-button" onClick={() => navigate('/settings')}>
          <Settings size={20} />
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-top">
            <div className="profile-image-wrapper">
              <img src={profileImage || user.profileImage} alt="Profile" className="profile-image" />
              {isEditing && (
                <label className="edit-image-btn">
                  <Camera size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div className="profile-info-wrapper">
              {isEditing ? (
                <div className="profile-edit-form">
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="edit-input"
                    placeholder="닉네임"
                  />
                </div>
              ) : (
                <div className="profile-info">
                  <h2>{user.nickname}</h2>
                  {/* Bio가 없으므로 이메일이나 이름 표시 */}
                  <p className="profile-bio">{user.email}</p> 
                </div>
              )}
            </div>

            {!isEditing ? (
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                편집
              </button>
            ) : (
              <div className="edit-actions">
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                  취소
                </button>
                <button className="save-btn" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? '저장...' : '저장'}
                </button>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-item" style={{display: 'block'}}>
              <p className="stat-value">{stats.totalItems}</p>
              <p className="stat-label text-[10px]">등록 아이템</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item" style={{display: 'block'}}>
              <p className="stat-value">{stats.successfulMatches}</p>
              <p className="stat-label">성공 매칭</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item" style={{display: 'block'}}>
              <p className="stat-value">{stats.averageRating.toFixed(1)}</p>
              <p className="stat-label">평균 평점</p>
            </div>
          </div>
        </div>

        {/* 획득한 뱃지 섹션 (있는 경우만 표시) */}
        {badges.length > 0 && (
            <div className="menu-section">
                <h3 className="section-title">획득한 뱃지</h3>
                <div className="badges-grid" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {badges.map((badge) => (
                    <div 
                    key={badge.id} 
                    className="badge-card"
                    style={{ 
                        border: `1px solid ${getRarityColor(badge.rarity)}`, 
                        borderRadius: '8px', 
                        padding: '8px', 
                        minWidth: '80px', 
                        textAlign: 'center',
                        backgroundColor: '#fff'
                    }}
                    >
                    <div className="badge-icon" style={{ fontSize: '24px' }}>{badge.icon}</div>
                    <p className="badge-name" style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{badge.name}</p>
                    </div>
                ))}
                </div>
            </div>
        )}

        {/* Account Section */}
        <div className="menu-section">
          <h3 className="section-title">계정</h3>
          <div className="menu-card">
            <button className="menu-item" onClick={() => navigate('/my-items')}>
              <div className="menu-left">
                <div className="menu-icon primary">
                  <Package size={20} />
                </div>
                <span>내 등록 아이템</span>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
            <button className="menu-item" onClick={() => navigate('/reviews')}>
              <div className="menu-left">
                <div className="menu-icon success">
                  <Trophy size={20} />
                </div>
                <span>받은 후기</span>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
            <button className="menu-item" onClick={() => navigate('/favorites')}>
              <div className="menu-left">
                <div className="menu-icon warning">
                  <ActivityIcon size={20} />
                </div>
                <span>관심 목록 ({user.likedPosts?.length || 0})</span>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
            <button className="menu-item" onClick={() => navigate('/store')}>
              <div className="menu-left">
                <div className="menu-icon info">
                  <TrendingUp size={20} />
                </div>
                <span>포인트 스토어</span>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </div>

        {/* Notification Section */}
        <div className="menu-section">
          <h3 className="section-title">알림</h3>
          <div className="menu-card">
            <button className="menu-item" onClick={() => navigate('/notifications')}>
              <div className="menu-left">
                <div className="menu-icon primary">
                  <Bell size={20} />
                </div>
                <span>알림 설정</span>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </div>

        {/* Other Section */}
        <div className="menu-section">
          <h3 className="section-title">기타</h3>
          <div className="menu-card">
            <button className="menu-item">
              <div className="menu-left">
                <div className="menu-icon success">
                  <Mail size={20} />
                </div>
                <span>문의하기</span>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
            <button className="menu-item">
              <div className="menu-left">
                <div className="menu-icon warning">
                  <Shield size={20} />
                </div>
                <span>개인정보 처리방침</span>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
            <button className="menu-item" onClick={() => navigate('/settings')}>
              <div className="menu-left">
                <div className="menu-icon info">
                  <Settings size={20} />
                </div>
                <span>설정</span>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;