// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Package, ChevronRight, Camera, LogOut, Settings, TrendingUp,
//   Activity as ActivityIcon, Bell, Mail, Shield, Trophy
// } from 'lucide-react';
// import { getUserInfo, checkToken, getValidAuthToken, type UserInfo } from '../utils/auth';
// import BottomNavigation from './BottomNavigation';
// import { uploadImage } from '../utils/file';
// import { useTheme } from '../utils/theme'; // ✅ useTheme 추가
// import '../styles/profile-page.css';
// import { API_BASE_URL } from '../config';

// interface UserStats {
//   totalItems: number;
//   successfulMatches: number;
//   currentPoints: number;
//   averageRating: number;
//   trustScore: number;
// }

// interface Badge {
//   id: string;
//   name: string;
//   description: string;
//   icon: string;
//   earnedDate: string;
//   rarity: 'common' | 'rare' | 'epic' | 'legendary';
// }

// interface Activity {
//   id: string;
//   type: 'item_posted' | 'review_received' | 'badge_earned';
//   description: string;
//   timestamp: string;
//   points?: number;
// }

// const ProfilePage: React.FC = () => {
//   const navigate = useNavigate();
//   const { theme } = useTheme(); // ✅ 테마 훅 사용
//   const isDark = theme === 'dark'; // ✅ 다크 모드 여부 확인

//   const [user, setUser] = useState<UserInfo | null>(getUserInfo());

//   const [isEditing, setIsEditing] = useState(false);
//   const [editNickname, setEditNickname] = useState('');
  
//   const [profileImage, setProfileImage] = useState('');
//   const [isSaving, setIsSaving] = useState(false);
//   const [editImageFile, setEditImageFile] = useState<File | null>(null);

//   const [stats, setStats] = useState<UserStats>({
//     totalItems: 0,
//     successfulMatches: 0,
//     currentPoints: 0,
//     averageRating: 0,
//     trustScore: 0,
//   });

//   const [_activities, setActivities] = useState<Activity[]>([]);
//   const [badges, setBadges] = useState<Badge[]>([]);

//   useEffect(() => {
//     const loadProfile = async () => {
//       const currentUser = getUserInfo();
//       if (!currentUser) {
//         navigate('/login');
//         return;
//       }

//       const freshData = await checkToken(currentUser.id.toString());

//       if (freshData) {
//         setUser(freshData);
//         setEditNickname(freshData.nickname);
//         setProfileImage(freshData.profileImage);

//         setStats({
//           totalItems: freshData.posts?.length || 0,
//           successfulMatches: freshData.returnedItemsCount || 0,
//           currentPoints: freshData.point || 0,
//           averageRating: freshData.totalReviews > 0
//             ? Math.round(parseFloat((freshData.totalScore / freshData.totalReviews).toFixed(1)))
//             : 0,
//           trustScore: freshData.totalScore,
//         });

//         const postActivities: Activity[] = (freshData.posts || []).map(post => ({
//           id: `post - ${post.id} `,
//           type: 'item_posted',
//           description: `'${post.title}' 게시글 등록`,
//           timestamp: post.createdAt
//         }));

//         const reviewActivities: Activity[] = (freshData.receivedReviews || []).map(review => ({
//           id: `review - ${review.id} `,
//           type: 'review_received',
//           description: `후기 도착: "${review.content.substring(0, 10)}..."`,
//           timestamp: new Date().toISOString()
//         }));

//         const combinedActivities = [...postActivities, ...reviewActivities]
//           .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
//           .slice(0, 10);

//         setActivities(combinedActivities);

//         const earnedBadges: Badge[] = Array.from({ length: freshData.badgeCount || 0 }).map((_, idx) => ({
//           id: `badge - ${idx} `,
//           name: `뱃지 ${idx + 1} `,
//           description: '활동을 통해 획득했습니다.',
//           icon: '🏅',
//           earnedDate: new Date().toISOString(),
//           rarity: 'common'
//         }));
//         setBadges(earnedBadges);
//       }
//     };

//     loadProfile();
//   }, [navigate]);

//   const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setEditImageFile(file);
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setProfileImage(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSaveProfile = async () => {
//     if (!user) return;
//     setIsSaving(true);

//     try {
//       const token = await getValidAuthToken();
//       if (!token) throw new Error("인증 토큰이 없습니다.");

//       let finalImageUrl = user.profileImage;

//       if (editImageFile) {
//         try {
//           finalImageUrl = await uploadImage(editImageFile);
//         } catch (uploadError) {
//           console.error("이미지 업로드 실패:", uploadError);
//           alert("이미지 업로드에 실패했습니다.");
//           setIsSaving(false);
//           return;
//         }
//       }

//       const requestBody: { profileImage: string; nickname?: string } = {
//         profileImage: finalImageUrl
//       };

//       if (editNickname !== user.nickname) {
//         requestBody.nickname = editNickname;
//       }

//       const response = await fetch(`${API_BASE_URL}/user/${user.id}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify(requestBody),
//       });

//       if (response.ok) {
//         const updatedUser = await response.json();
//         setUser(updatedUser);
//         setIsEditing(false);
//         alert('프로필이 저장되었습니다!');
//       } else {
//         const errData = await response.json().catch(() => ({}));
//         throw new Error(errData.message || '프로필 수정 실패');
//       }

//     } catch (error) {
//       console.error('Failed to save profile:', error);
//       alert(`프로필 저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleLogout = () => {
//     if (confirm('로그아웃 하시겠습니까?')) {
//       localStorage.clear();
//       navigate('/login');
//     }
//   };

//   const getRarityColor = (rarity: string) => {
//     switch (rarity) {
//       case 'legendary': return '#fbbf24';
//       case 'epic': return '#a855f7';
//       case 'rare': return '#3b82f6';
//       default: return '#6b7280';
//     }
//   };

//   // ✅ 테마 색상 변수 정의
//   const bgColor = isDark ? '#030712' : '#f9fafb';
//   const textColor = isDark ? '#f9fafb' : '#111827';
//   const subTextColor = isDark ? '#9ca3af' : '#6b7280';
//   const cardBg = isDark ? '#1f2937' : '#ffffff';
//   const borderColor = isDark ? '#374151' : '#e5e7eb';

//   if (!user) return null;

//   return (
//     // ✅ 전체 페이지 배경색 동적 적용
//     <div className={`profile-page ${theme}`} style={{ backgroundColor: bgColor, paddingBottom: '80px', minHeight: '100vh', color: textColor }}>
      
//       {/* Header */}
//       <div 
//         className="profile-header"
//         style={{
//           position: 'sticky',
//           top: 0,
//           zIndex: 50,
//           backgroundColor: bgColor, // ✅ 헤더 배경도 다크모드 적용
//           paddingTop: 'calc(16px + env(safe-area-inset-top))',
//           paddingBottom: '16px',
//           paddingLeft: '20px',
//           paddingRight: '20px',
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           borderBottom: '1px solid transparent' 
//         }}
//       >
//         {/* ✅ 요청하신 폰트 스타일 적용 */}
//         <h1 style={{ 
//           fontSize: '28px', 
//           fontWeight: 800, 
//           margin: 0, 
//           color: textColor, // 다크모드일 때는 흰색, 라이트모드일 때는 #111827
//           letterSpacing: '-0.8px' 
//         }}>
//           프로필
//         </h1>
//         <button 
//           className="menu-button" 
//           onClick={() => navigate('/settings')}
//           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
//         >
//           <Settings size={24} color={textColor} />
//         </button>
//       </div>

//       <div className="profile-content" style={{ padding: '0 20px 20px 20px' }}>
//         <div className="profile-card" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
//           <div className="profile-top">
//             <div className="profile-image-wrapper">
//               <img src={profileImage || user.profileImage} alt="Profile" className="profile-image" />
//               {isEditing && (
//                 <label className="edit-image-btn">
//                   <Camera size={18} />
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleProfileImageChange}
//                     style={{ display: 'none' }}
//                   />
//                 </label>
//               )}
//             </div>

//             <div className="profile-info-wrapper">
//               {isEditing ? (
//                 <div className="profile-edit-form">
//                   <input
//                     type="text"
//                     value={editNickname}
//                     onChange={(e) => setEditNickname(e.target.value)}
//                     className="edit-input"
//                     placeholder="닉네임"
//                     style={{ backgroundColor: isDark ? '#374151' : 'white', color: textColor, border: `1px solid ${borderColor}` }}
//                   />
//                 </div>
//               ) : (
//                 <div className="profile-info">
//                   <h2 style={{ color: textColor }}>{user.nickname}</h2>
//                   <p className="profile-bio" style={{ color: subTextColor }}>{user.email}</p>
//                 </div>
//               )}
//             </div>

//             {!isEditing ? (
//               <button className="edit-profile-btn" onClick={() => setIsEditing(true)} style={{ color: textColor, borderColor: borderColor }}>
//                 편집
//               </button>
//             ) : (
//               <div className="edit-actions">
//                 <button className="cancel-btn" onClick={() => setIsEditing(false)} style={{ color: subTextColor }}>
//                   취소
//                 </button>
//                 <button className="save-btn" onClick={handleSaveProfile} disabled={isSaving}>
//                   {isSaving ? '저장...' : '저장'}
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Stats Row */}
//           <div className="stats-row" style={{ borderColor: borderColor }}>
//             <div className="stat-item" style={{ display: 'block' }}>
//               <p className="stat-value" style={{ color: textColor }}>{stats.totalItems}</p>
//               <p className="stat-label text-[10px]" style={{ color: subTextColor }}>등록 아이템</p>
//             </div>
//             <div className="stat-divider" style={{ backgroundColor: borderColor }}></div>
//             <div className="stat-item" style={{ display: 'block' }}>
//               <p className="stat-value" style={{ color: textColor }}>{stats.successfulMatches}</p>
//               <p className="stat-label" style={{ color: subTextColor }}>성공 매칭</p>
//             </div>
//             <div className="stat-divider" style={{ backgroundColor: borderColor }}></div>
//             <div className="stat-item" style={{ display: 'block' }}>
//               <p className="stat-value" style={{ color: textColor }}>{stats.averageRating.toFixed(0)}</p>
//               <p className="stat-label" style={{ color: subTextColor }}>평균 평점</p>
//             </div>
//           </div>
//         </div>

//         {/* 획득한 뱃지 섹션 */}
//         {badges.length > 0 && (
//           <div className="menu-section">
//             <h3 className="section-title" style={{ color: textColor }}>획득한 뱃지</h3>
//             <div className="badges-grid" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
//               {badges.map((badge) => (
//                 <div
//                   key={badge.id}
//                   className="badge-card"
//                   style={{
//                     border: `1px solid ${getRarityColor(badge.rarity)} `,
//                     borderRadius: '8px',
//                     padding: '8px',
//                     minWidth: '80px',
//                     textAlign: 'center',
//                     backgroundColor: cardBg
//                   }}
//                 >
//                   <div className="badge-icon" style={{ fontSize: '24px' }}>{badge.icon}</div>
//                   <p className="badge-name" style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', color: textColor }}>{badge.name}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Account Section */}
//         <div className="menu-section">
//           <h3 className="section-title" style={{ color: textColor }}>계정</h3>
//           <div className="menu-card" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
//             <button className="menu-item" onClick={() => navigate('/my-items')}>
//               <div className="menu-left">
//                 <div className="menu-icon primary">
//                   <Package size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>내 등록 아이템</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//             <button className="menu-item" onClick={() => navigate('/reviews')}>
//               <div className="menu-left">
//                 <div className="menu-icon success">
//                   <Trophy size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>받은 후기</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//             <button className="menu-item" onClick={() => navigate('/favorites')}>
//               <div className="menu-left">
//                 <div className="menu-icon warning">
//                   <ActivityIcon size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>관심 목록 ({user.likedPosts?.length || 0})</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//             <button className="menu-item" onClick={() => navigate('/store')}>
//               <div className="menu-left">
//                 <div className="menu-icon info">
//                   <TrendingUp size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>포인트 스토어</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//             <button className="menu-item" onClick={() => navigate('/leaderboard')}>
//               <div className="menu-left">
//                 <div className="menu-icon success">
//                   <Trophy size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>리더보드</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//           </div>
//         </div>

//         {/* Notification Section */}
//         <div className="menu-section">
//           <h3 className="section-title" style={{ color: textColor }}>알림</h3>
//           <div className="menu-card" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
//             <button className="menu-item" onClick={() => navigate('/home')}>
//               <div className="menu-left">
//                 <div className="menu-icon primary">
//                   <Bell size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>알림 설정</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//           </div>
//         </div>

//         {/* Other Section */}
//         <div className="menu-section">
//           <h3 className="section-title" style={{ color: textColor }}>기타</h3>
//           <div className="menu-card" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
//             <button className="menu-item">
//               <div className="menu-left">
//                 <div className="menu-icon success">
//                   <Mail size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>문의하기</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//             <button className="menu-item"  onClick={() => navigate('/privacy')}>
//               <div className="menu-left">
//                 <div className="menu-icon warning">
//                   <Shield size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>개인정보 처리방침</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//             <button className="menu-item" onClick={() => navigate('/settings')}>
//               <div className="menu-left">
//                 <div className="menu-icon info">
//                   <Settings size={20} />
//                 </div>
//                 <span style={{ color: textColor }}>설정</span>
//               </div>
//               <ChevronRight size={20} className="chevron" color={subTextColor} />
//             </button>
//           </div>
//         </div>

//         {/* Logout Button */}
//         <div className="logout-section">
//           <button className="logout-btn" onClick={handleLogout} style={{ backgroundColor: cardBg, borderColor: borderColor, color: '#ef4444' }}>
//             <LogOut size={20} />
//             <span>로그아웃</span>
//           </button>
//         </div>
//       </div>

//       <BottomNavigation />
//     </div>
//   );
// };

// export default ProfilePage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Camera, Edit2, Bell, Ticket,
  History as HistoryIcon, LogOut, Package, Trophy,
  Activity as ActivityIcon, TrendingUp, Mail, Shield
} from 'lucide-react';
import { getUserInfo, checkToken, getValidAuthToken, type UserInfo, saveUserInfo } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
import { uploadImage } from '../utils/file';
import { useTheme } from '../utils/theme';
import '../styles/profile-page.css';
import { API_BASE_URL } from '../config';

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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [user, setUser] = useState<UserInfo | null>(getUserInfo());
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');

  
  const [profileImage, setProfileImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [stats, setStats] = useState<UserStats>({
    totalItems: 0,
    successfulMatches: 0,
    currentPoints: 0,
    averageRating: 0,
    trustScore: 0,
  });

  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = getUserInfo();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const freshData = await checkToken(currentUser.id.toString());

      if (freshData) {
        setUser(freshData);
        setEditNickname(freshData.nickname);
        setProfileImage(freshData.profileImage);
        // editBio(freshData.bio || ''); // 추후 API에 bio가 추가되면 주석 해제

        setStats({
          totalItems: freshData.posts?.length || 0,
          successfulMatches: freshData.returnedItemsCount || 0,
          currentPoints: freshData.point || 0,
          averageRating: freshData.totalReviews > 0
            ? parseFloat((freshData.totalScore / freshData.totalReviews).toFixed(1))
            : 0,
          trustScore: freshData.totalScore,
        });

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
      try {
        // 즉시 업로드 및 미리보기 적용
        const uploadedUrl = await uploadImage(file);
        setProfileImage(uploadedUrl);
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        alert("이미지 업로드에 실패했습니다.");
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const token = await getValidAuthToken();
      if (!token) throw new Error("인증 토큰이 없습니다.");

      const requestBody: { profileImage: string; nickname?: string } = {
        profileImage: profileImage || user.profileImage
      };

      if (editNickname !== user.nickname) {
        requestBody.nickname = editNickname;
      }

      const response = await fetch(`${API_BASE_URL}/user/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        saveUserInfo(updatedUser); // 로컬 스토리지 최신화
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

  if (!user) return null;

  return (
    // ✅ [수정됨] paddingBottom을 늘려서 바텀 네비게이션과 겹치지 않도록 함
    <div className={`profile-page ${theme}`} style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>
      {/* 1. Dark Header Section */}
      <div className="profile-dark-header rounded-[0px]">
        {/* Header Top */}
        <div className="profile-header-top">
          <button className="header-icon-btn" onClick={() => navigate('/home')}>
            <ArrowLeft size={20} />
          </button>
          <h1>프로필</h1>
          <button className="header-icon-btn" onClick={() => navigate('/settings')}>
            <Settings size={20} />
          </button>
        </div>

        {/* Profile Hero - Centered */}
        <div className="profile-hero-section">
          <div className="profile-avatar-large">
            <img 
              src={profileImage || user.profileImage} 
              alt="Profile" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=User'; }}
            />
            {isEditing && (
              <label className="edit-avatar-btn">
                <Camera size={16} />
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
            <div className="profile-edit-hero">
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                className="edit-input-hero"
                placeholder="닉네임"
              />
              <div className="edit-actions-hero">
                <button className="cancel-btn-hero" onClick={() => setIsEditing(false)}>
                  취소
                </button>
                <button className="save-btn-hero" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? '저장...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-name-section">
                <h2 className="profile-name-large">{user.nickname}</h2>
                <p className="profile-email">{user.email}</p>
              </div>
              <button className="edit-profile-btn-hero" onClick={() => setIsEditing(true)}>
                <Edit2 size={14} />
                <span>프로필 편집</span>
              </button>
            </>
          )}
        </div>

        {/* Quick Stats in Dark Section */}
        <div className="quick-stats">
          <div className="quick-stat-item">
            <p className="quick-stat-value">{stats.totalItems}</p>
            <p className="quick-stat-label">등록 아이템</p>
          </div>
          <div className="quick-stat-divider"></div>
          <div className="quick-stat-item">
            <p className="quick-stat-value">{stats.successfulMatches}</p>
            <p className="quick-stat-label">성공 매칭</p>
          </div>
          <div className="quick-stat-divider"></div>
          <div className="quick-stat-item">
            <p className="quick-stat-value">{stats.averageRating}</p>
            <p className="quick-stat-label">평균 평점</p>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="action-cards-wrapper"> 
           <div className="action-cards-grid">
            <button className="action-card-dark" onClick={() => navigate('/notifications')}>
              <Bell size={24} />
              <span>알림</span>
            </button>
            <button className="action-card-dark" onClick={() => navigate('/store')}>
              <Ticket size={24} />
              <span>포인트 스토어</span>
            </button>
            <button className="action-card-dark" onClick={() => navigate('/my-items')}>
              <HistoryIcon size={24} />
              <span>내역</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. White Body Content Section */}
      <div className="profile-content-body ">
        
        {/* Badges Section */}
        {badges.length > 0 && (
          <div className="content-section">
            <h3 className="section-title">획득한 뱃지</h3>
            <div className="badges-scroll-container">
              {badges.map((badge) => (
                <div key={badge.id} className="badge-item">
                  <div className="badge-icon-wrapper">{badge.icon}</div>
                  <span className="badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu List Section */}
        <div className="content-section">
          <h3 className="section-title">내 활동</h3>
          <div className="menu-list">
            <button className="menu-list-item" onClick={() => navigate('/my-items')}>
              <div className="menu-icon-bg primary"><Package size={20} /></div>
              <span className="menu-text">내 등록 아이템</span>
              <div className="menu-arrow"><ArrowLeft size={16} style={{transform: 'rotate(180deg)'}} /></div>
            </button>
            <button className="menu-list-item" onClick={() => navigate('/reviews')}>
              <div className="menu-icon-bg success"><Trophy size={20} /></div>
              <span className="menu-text">받은 후기</span>
              <div className="menu-arrow"><ArrowLeft size={16} style={{transform: 'rotate(180deg)'}} /></div>
            </button>
            <button className="menu-list-item" onClick={() => navigate('/favorites')}>
              <div className="menu-icon-bg warning"><ActivityIcon size={20} /></div>
              <span className="menu-text">관심 목록 ({user.likedPosts?.length || 0})</span>
              <div className="menu-arrow"><ArrowLeft size={16} style={{transform: 'rotate(180deg)'}} /></div>
            </button>
            <button className="menu-list-item" onClick={() => navigate('/leaderboard')}>
              <div className="menu-icon-bg info"><TrendingUp size={20} /></div>
              <span className="menu-text">리더보드</span>
              <div className="menu-arrow"><ArrowLeft size={16} style={{transform: 'rotate(180deg)'}} /></div>
            </button>
          </div>
        </div>

        <div className="content-section">
          <h3 className="section-title">고객 지원</h3>
          <div className="menu-list">
            <button className="menu-list-item">
              <div className="menu-icon-bg gray"><Mail size={20} /></div>
              <span className="menu-text">문의하기</span>
              <div className="menu-arrow"><ArrowLeft size={16} style={{transform: 'rotate(180deg)'}} /></div>
            </button>
            <button className="menu-list-item" onClick={() => navigate('/privacy')}>
              <div className="menu-icon-bg gray"><Shield size={20} /></div>
              <span className="menu-text">개인정보 처리방침</span>
              <div className="menu-arrow"><ArrowLeft size={16} style={{transform: 'rotate(180deg)'}} /></div>
            </button>
          </div>
        </div>

        <div className="logout-section">
          <button className="logout-btn-text" onClick={handleLogout}>
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;