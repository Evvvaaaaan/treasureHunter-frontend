import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Camera, LogOut, Package, Trophy,
  TrendingUp, Mail, Shield, Star, ChevronRight
} from 'lucide-react';
import { getUserInfo, checkToken, getValidAuthToken, type UserInfo, saveUserInfo } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
import { uploadImage } from '../utils/file';
import { useTheme } from '../utils/theme';
import '../styles/profile-page.css';
import { API_BASE_URL } from '../config';
import ContactModal from './ContactModal';
import { Dialog } from "@capacitor/dialog";

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

// ── Explorer Level System ──────────────────────────────────────
// 레벨 점수 = 등록(×1) + 회수(×3) + 포인트(200당 1점)
// LV.1 NOVICE    :  0 ~ 4점
// LV.2 EXPLORER  :  5 ~ 14점
// LV.3 TRACKER   : 15 ~ 29점
// LV.4 FINDER    : 30 ~ 59점
// LV.5 GUARDIAN  : 60점 이상
const LEVEL_CRITERIA = [
  { level: 1, title: 'NOVICE',   min: 0,  max: 4  },
  { level: 2, title: 'EXPLORER', min: 5,  max: 14 },
  { level: 3, title: 'TRACKER',  min: 15, max: 29 },
  { level: 4, title: 'FINDER',   min: 30, max: 59 },
  { level: 5, title: 'GUARDIAN', min: 60, max: Infinity },
];

const calcExplorerLevel = (totalItems: number, matches: number, points: number) => {
  const score = totalItems * 1 + matches * 3 + Math.floor(points / 200);
  return LEVEL_CRITERIA.find(c => score >= c.min && score <= c.max) ?? LEVEL_CRITERIA[0];
};
// ──────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [user, setUser] = useState<UserInfo | null>(getUserInfo());
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLevelHelp, setShowLevelHelp] = useState(false);

  const [stats, setStats] = useState<UserStats>({
    totalItems: 0,
    successfulMatches: 0,
    currentPoints: 0,
    averageRating: 0,
    trustScore: 0,
  });

  const [badges, setBadges] = useState<Badge[]>([]);

  // ── API에서 프로필 로드 ──
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

        setStats({
          totalItems: freshData.posts?.length || 0,
          successfulMatches: freshData.returnedItemsCount || 0,
          currentPoints: freshData.point || 0,
          averageRating: freshData.totalReviews > 0
            ? parseFloat((freshData.totalScore / freshData.totalReviews).toFixed(1))
            : 0,
          trustScore: 50 + Math.round((freshData.totalReviews > 0 ? (freshData.totalScore / freshData.totalReviews) : 0) * 10),
        });

        const earnedBadges: Badge[] = Array.from({ length: freshData.badgeCount || 0 }).map((_, idx) => ({
          id: `badge-${idx}`,
          name: `뱃지 ${idx + 1}`,
          description: '활동을 통해 획득했습니다.',
          icon: '🏅',
          earnedDate: new Date().toISOString(),
          rarity: 'common' as const
        }));
        setBadges(earnedBadges);
      }
    };

    loadProfile();
  }, [navigate]);

  // ── 프로필 이미지 변경 (즉시 업로드) ──
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const uploadedUrl = await uploadImage(file);
        setProfileImage(uploadedUrl);
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        await Dialog.alert({ title: '알림', message: "이미지 용량이 초과되어 업로드에 실패했습니다." });
      }
    }
  };

  // ── 프로필 저장 (PATCH API) ──
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
        saveUserInfo(updatedUser);
        setIsEditing(false);
        await Dialog.alert({ title: '알림', message: '프로필이 저장되었습니다!' });
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || '프로필 수정 실패');
      }

    } catch (error) {
      console.error('Failed to save profile:', error);
      await Dialog.alert({ title: '알림', message: `프로필 저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` });
    } finally {
      setIsSaving(false);
    }
  };

  // ── 로그아웃 ──
  const handleLogout = async () => {
    if ((await Dialog.confirm({ title: '알림', message: '로그아웃 하시겠습니까?' })).value) {
      localStorage.clear();
      navigate('/login');
    }
  };

  if (!user) return null;

  const explorerLevel = calcExplorerLevel(stats.totalItems, stats.successfulMatches, stats.currentPoints);

  return (
    <div className={`profile-page ${theme}`}>
      {/* Header */}
      <div className="profile-header-forest">
        <button className="header-icon-btn" onClick={() => navigate('/home')}>
          <ArrowLeft size={20} />
        </button>
        <h1>프로필</h1>
        <button className="header-icon-btn" onClick={() => navigate('/settings')}>
          <Settings size={20} />
        </button>
      </div>

      <div className="profile-content-forest">
        {/* Main Profile Card */}
        <div className="profile-card-forest">
          {/* Radar decoration */}
          <div className="profile-card-radar">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="35" fill="none" stroke="rgba(111,168,134,0.25)" strokeWidth="1"/>
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(111,168,134,0.18)" strokeWidth="1"/>
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(111,168,134,0.12)" strokeWidth="1"/>
              <circle cx="100" cy="100" r="110" fill="none" stroke="rgba(111,168,134,0.07)" strokeWidth="1"/>
            </svg>
          </div>

          <div className="profile-card-header-forest">
            <div className="profile-avatar-forest">
              <img
                src={profileImage || user.profileImage}
                alt="Profile"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png'; }}
              />
              {isEditing && (
                <label className="edit-avatar-btn-forest">
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
            <div className="profile-header-info" style={{ flex: 1 }}>
              {isEditing ? (
                <div className="profile-edit-inline">
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="edit-input-forest"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--c-accent)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#F5F2E8',
                      marginBottom: '10px'
                    }}
                    placeholder="닉네임"
                  />
                  <div className="edit-actions-inline" style={{ display: 'flex', gap: '8px' }}>
                    <button className="cancel-btn-forest" onClick={() => setIsEditing(false)}>
                      취소
                    </button>
                    <button className="save-btn-forest" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? '저장...' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2>{user.nickname}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <p className="profile-role" style={{ margin: 0 }}>
                      {explorerLevel.title} · LV.{explorerLevel.level}
                    </p>
                    <button
                      className="level-info-btn"
                      onClick={() => setShowLevelHelp(true)}
                      aria-label="레벨 기준 안내"
                    >
                      ⓘ
                    </button>
                  </div>
                </>
              )}
            </div>
            {!isEditing && (
              <button className="edit-btn-forest" onClick={() => setIsEditing(true)} style={{ flexShrink: 0, alignSelf: 'center' }}>
                편집
              </button>
            )}
          </div>

          {/* Trust Score */}
          <div className="trust-score-section">
            <div className="trust-score-label">
              <span>TRUST SCORE</span>
              <span className="trust-score-value">{stats.trustScore} / 100</span>
            </div>
            <div className="trust-score-bar-forest">
              <div
                className="trust-score-fill-forest"
                style={{ width: `${Math.min(stats.trustScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid-forest">
            <div className="stat-item-forest">
              <p className="stat-number">{stats.totalItems}</p>
              <p className="stat-label">등록</p>
            </div>
            <div className="stat-item-forest">
              <p className="stat-number">{stats.successfulMatches}</p>
              <p className="stat-label">회수</p>
            </div>
            <div className="stat-item-forest">
              <p className="stat-number">{stats.currentPoints.toLocaleString()}</p>
              <p className="stat-label">포인트</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="menu-list-forest" style={{ padding: '16px 20px' }}>
            <h3 className="section-title-forest" style={{ marginBottom: '12px' }}>획득한 뱃지</h3>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {badges.map((badge) => (
                <div key={badge.id} style={{
                  minWidth: '64px', textAlign: 'center', padding: '10px 8px',
                  background: 'rgba(111,168,134,0.08)', borderRadius: '14px'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{badge.icon}</div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--c-subtext)' }}>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu - 내 활동 */}
        <div className="menu-list-forest">
          <button className="menu-item-forest" onClick={() => navigate('/my-items')}>
            <div className="menu-item-icon"><Package size={20} /></div>
            <div className="menu-item-content">
              <p className="menu-item-title">내 등록 아이템</p>
              <p className="menu-item-desc">{stats.totalItems}개</p>
            </div>
            <ChevronRight size={20} className="menu-chevron" />
          </button>
          <button className="menu-item-forest" onClick={() => navigate('/reviews')}>
            <div className="menu-item-icon"><Trophy size={20} /></div>
            <div className="menu-item-content">
              <p className="menu-item-title">받은 후기</p>
            </div>
            <ChevronRight size={20} className="menu-chevron" />
          </button>
          <button className="menu-item-forest" onClick={() => navigate('/favorites')}>
            <div className="menu-item-icon"><Star size={20} /></div>
            <div className="menu-item-content">
              <p className="menu-item-title">관심 목록</p>
              <p className="menu-item-desc">{user.likedPosts?.length || 0}개 저장됨</p>
            </div>
            <ChevronRight size={20} className="menu-chevron" />
          </button>
          <button className="menu-item-forest" onClick={() => navigate('/leaderboard')}>
            <div className="menu-item-icon"><TrendingUp size={20} /></div>
            <div className="menu-item-content">
              <p className="menu-item-title">리더보드</p>
            </div>
            <ChevronRight size={20} className="menu-chevron" />
          </button>
        </div>

        {/* Menu - 고객 지원 */}
        <div className="menu-list-forest">
          <button className="menu-item-forest" onClick={() => setIsContactModalOpen(true)}>
            <div className="menu-item-icon"><Mail size={20} /></div>
            <div className="menu-item-content">
              <p className="menu-item-title">문의하기</p>
            </div>
            <ChevronRight size={20} className="menu-chevron" />
          </button>
          <ContactModal
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            email="vmfhrmfoald36@gmail.com"
          />
          <button className="menu-item-forest" onClick={() => navigate('/privacy')}>
            <div className="menu-item-icon"><Shield size={20} /></div>
            <div className="menu-item-content">
              <p className="menu-item-title">개인정보 처리방침</p>
            </div>
            <ChevronRight size={20} className="menu-chevron" />
          </button>
          <button className="menu-item-forest" onClick={handleLogout}>
            <div className="menu-item-icon"><LogOut size={20} /></div>
            <div className="menu-item-content">
              <p className="menu-item-title" style={{ color: '#ef4444' }}>로그아웃</p>
            </div>
            <ChevronRight size={20} className="menu-chevron" />
          </button>
        </div>
      </div>

      {/* Level Help Modal */}
      {showLevelHelp && (
        <div className="level-help-overlay" onClick={() => setShowLevelHelp(false)}>
          <div className="level-help-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="level-help-header">
              <h3>탐험가 레벨 기준</h3>
              <button className="level-help-close" onClick={() => setShowLevelHelp(false)}>✕</button>
            </div>
            <p className="level-help-desc">
              등록·회수·포인트 활동을 기반으로 레벨 점수를 계산합니다.
            </p>
            <div className="level-help-formula">
              <span>🗂 등록 게시글</span><span>× 1점</span>
              <span>🔁 회수 성공</span><span>× 3점</span>
              <span>💎 보유 포인트</span><span>200당 1점</span>
            </div>
            <div className="level-help-table">
              {LEVEL_CRITERIA.map((c) => (
                <div
                  key={c.level}
                  className={`level-help-row${explorerLevel.level === c.level ? ' active' : ''}`}
                >
                  <span className="lh-badge">LV.{c.level}</span>
                  <span className="lh-title">{c.title}</span>
                  <span className="lh-range">
                    {c.max === Infinity ? `${c.min}점 이상` : `${c.min} ~ ${c.max}점`}
                  </span>
                </div>
              ))}
            </div>
            <p className="level-help-current">
              현재 내 점수: <strong>
                {stats.totalItems * 1 + stats.successfulMatches * 3 + Math.floor(stats.currentPoints / 200)}점
              </strong>
            </p>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;