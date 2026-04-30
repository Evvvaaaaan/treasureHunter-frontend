import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Award,
  TrendingUp,
  AlertCircle,
  Edit3,
  ShieldAlert,
} from "lucide-react";
import { useTheme } from "../utils/theme";
import { getUserProfile, type UserInfo } from "../utils/auth";
import { Dialog } from '@capacitor/dialog';
import "../styles/profile-page.css";

// UI에 표시할 사용자 프로필 인터페이스
interface UserProfile {
  id: string;
  nickname: string;
  profileImage: string;
  bio: string;
  trustScore: number;
  isOnline: boolean;
  location: string;
  joinedDate: string;
  stats: {
    itemsFound: number;
    itemsLost: number;
    helpedOthers: number;
    successRate: number;
  };
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
  }[];
}

const OtherUserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadUserProfile(id);
    }
  }, [id]);

  // ── API에서 사용자 프로필 로드 ──
  const loadUserProfile = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData: UserInfo | null = await getUserProfile(userId);

      if (!userData) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      const avgScore = userData.totalReviews > 0
        ? userData.totalScore / userData.totalReviews
        : 0;
      const trustScore = 50 + Math.round(avgScore * 10);

      const mappedProfile: UserProfile = {
        id: userData.id.toString(),
        nickname: userData.nickname,
        profileImage: userData.profileImage || "https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png",
        bio: "안녕하세요! 보물찾기를 통해 잃어버린 물건을 찾고 있습니다.",
        trustScore: trustScore,
        isOnline: false,
        location: "활동 지역 정보 없음",
        joinedDate: new Date(userData.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric'
        }),
        stats: {
          itemsFound: userData.returnedItemsCount || 0,
          itemsLost: userData.posts ? userData.posts.filter(p =>
            (p.type || '').toUpperCase() === 'LOST'
          ).length : 0,
          helpedOthers: userData.totalReviews || 0,
          successRate: 95,
        },
        badges: Array.from({ length: userData.badgeCount || 0 }).map((_, idx) => ({
          id: `badge-${idx}`,
          name: `뱃지 ${idx + 1}`,
          icon: "🏅",
          description: "활동을 통해 획득한 뱃지입니다."
        }))
      };

      setUserProfile(mappedProfile);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      setError("프로필을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── 신고 ──
  const handleReport = async () => {
    const { value } = await Dialog.confirm({ title: '알림', message: "이 사용자를 신고하시겠습니까?" });
    if (value) {
      await Dialog.alert({ title: '알림', message: "신고가 접수되었습니다. 검토 후 조치하겠습니다." });
    }
  };

  // ── 리뷰 작성 ──
  const handleWriteReview = () => {
    navigate(`/review/${id}`);
  };

  // ── 차단 ──
  const handleBlock = async () => {
    const { value } = await Dialog.confirm({ title: '알림', message: "이 사용자를 차단하시겠습니까?\n차단 시 더 이상 이 사용자의 게시글과 메시지가 보이지 않습니다." });
    if (value) {
      const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
      if (id && !blockedUsers.includes(id)) {
        blockedUsers.push(id);
        localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
      }
      await Dialog.alert({ title: '알림', message: "사용자가 차단되었습니다." });
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className={`other-user-profile-page ${theme}`}>
        <div className="loading-container-profile">
          <div className="loading-spinner-profile" />
          <p>프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className={`other-user-profile-page ${theme}`}>
        <div className="error-container-profile">
          <AlertCircle size={64} />
          <h3>{error || "프로필을 찾을 수 없습니다"}</h3>
          <button onClick={() => navigate(-1)} className="back-button-error">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`other-user-profile-page ${theme}`}>
      {/* Header */}
      <div className="profile-header-other-forest">
        <button className="back-btn-other-forest" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>프로필</h1>
        <button className="report-btn-other-forest" onClick={handleReport}>
          <AlertCircle size={20} />
        </button>
      </div>

      {/* Profile Content */}
      <div className="profile-content-other-forest">
        {/* Main Profile Card */}
        <div className="profile-card-other-forest">
          <div className="profile-card-header-other-forest">
            <div className="profile-avatar-other-forest">
              <img
                src={userProfile.profileImage}
                alt={userProfile.nickname}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png'; }}
              />
              {userProfile.isOnline && <div className="online-badge-forest">온라인</div>}
            </div>
            <div className="profile-header-info-other">
              <h2>{userProfile.nickname}</h2>
              <p className="profile-role-other">{userProfile.joinedDate} 가입</p>
            </div>
          </div>

          {/* Trust Score */}
          <div className="trust-score-section-other">
            <div className="trust-score-label-other">
              <span>TRUST SCORE</span>
              <span className="trust-score-value-other">{userProfile.trustScore}점</span>
            </div>
            <div className="trust-score-bar-other-forest">
              <div
                className="trust-score-fill-other-forest"
                style={{ width: `${Math.min(userProfile.trustScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid-other-forest">
            <div className="stat-item-other-forest">
              <p className="stat-number-other">{userProfile.stats.itemsFound}</p>
              <p className="stat-label-other-small">찾음</p>
            </div>
            <div className="stat-item-other-forest">
              <p className="stat-number-other">{userProfile.stats.itemsLost}</p>
              <p className="stat-label-other-small">분실</p>
            </div>
            <div className="stat-item-other-forest">
              <p className="stat-number-other">{userProfile.stats.helpedOthers}</p>
              <p className="stat-label-other-small">후기</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions-other-forest">
          <button className="review-btn-other-forest" onClick={handleWriteReview}>
            <Edit3 size={20} />
            후기 작성
          </button>
          <button className="chat-btn-other-forest" style={{ background: '#fee2e2', color: '#ef4444', boxShadow: 'none' }} onClick={handleBlock}>
            <ShieldAlert size={20} />
            차단
          </button>
        </div>

        {/* Activity Section */}
        <div className="activity-section-forest">
          <h3 className="section-title-forest">활동 내역</h3>
          <div className="activity-list">
            <div className="activity-item-forest">
              <div className="activity-icon-forest">
                <Star size={20} />
              </div>
              <div className="activity-content">
                <p className="activity-title">찾은 물건</p>
                <p className="activity-desc">{userProfile.stats.itemsFound}개</p>
              </div>
            </div>
            <div className="activity-item-forest">
              <div className="activity-icon-forest">
                <Award size={20} />
              </div>
              <div className="activity-content">
                <p className="activity-title">도움 준 사람</p>
                <p className="activity-desc">{userProfile.stats.helpedOthers}명</p>
              </div>
            </div>
            <div className="activity-item-forest">
              <div className="activity-icon-forest">
                <TrendingUp size={20} />
              </div>
              <div className="activity-content">
                <p className="activity-title">성공률</p>
                <p className="activity-desc">{userProfile.stats.successRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherUserProfilePage;