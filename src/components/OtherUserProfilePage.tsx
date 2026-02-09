import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Shield,
  Award,
  AlertCircle,
  Edit3 // 리뷰 아이콘 추가
} from "lucide-react";
import { useTheme } from "../utils/theme";
import { getUserProfile, type UserInfo } from "../utils/auth";
import "../styles/other-user-profile-page.css";

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
  const { id } = useParams<{ id: string }>(); // id는 조회 대상 유저의 ID
  const { theme } = useTheme();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadUserProfile(id);
    }
  }, [id]);

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
      const trustScore = Math.round(avgScore); // 5점 만점 기준 -> 100점 만점

      const mappedProfile: UserProfile = {
        id: userData.id.toString(),
        nickname: userData.nickname,
        profileImage: userData.profileImage || "https://via.placeholder.com/400x400?text=No+Image",
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

  const handleReport = () => {
    if (confirm("이 사용자를 신고하시겠습니까?")) {
      alert("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
    }
  };
  
  // [수정] 리뷰 페이지 이동 핸들러
  const handleWriteReview = () => {
      // /review/:userId 경로로 이동
      navigate(`/review/${id}`);
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 100) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
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
          <button
            onClick={() => navigate(-1)}
            className="back-button-error"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`other-user-profile-page ${theme}`}>
      <div className="profile-header-other">
        <button
          className="back-btn-other"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} />
        </button>
        <h1>프로필</h1>
        <button
          className="report-btn-other"
          onClick={handleReport}
        >
          <AlertCircle size={20} />
        </button>
      </div>

      <div className="profile-content-other">
        <div className="user-info-card-other">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper-other">
              <img
                src={userProfile.profileImage}
                alt={userProfile.nickname}
              />
              {userProfile.isOnline && (
                <div className="online-badge-other">온라인</div>
              )}
            </div>

            <div className="profile-info-text">
              <h2>{userProfile.nickname}</h2>
              <div className="profile-meta-row">
                <span className="meta-item">
                  <MapPin size={14} />
                  {userProfile.location}
                </span>
                <span className="meta-item">
                  <Calendar size={14} />
                  {userProfile.joinedDate} 가입
                </span>
              </div>
            </div>
          </div>

          <div className="trust-score-card">
            <div className="trust-score-header">
              <Shield
                size={20}
                style={{
                  color: getTrustScoreColor(userProfile.trustScore),
                }}
              />
              <span>신뢰도</span>
            </div>
            <div className="trust-score-value">
              <span
                className="score-number"
                style={{
                  color: getTrustScoreColor(userProfile.trustScore),
                }}
              >
                {userProfile.trustScore}
              </span>
              <span className="score-max">점</span>
            </div>
            <div className="trust-score-bar">
              <div
                className="trust-score-fill"
                style={{
                  width: `${Math.min(userProfile.trustScore, 100)}%`,
                  backgroundColor: getTrustScoreColor(userProfile.trustScore),
                }}
              />
            </div>
          </div>

          <div className="profile-actions-other">
            {/* [수정] 후기 작성 버튼 연결 */}
            <button
              className="chat-btn-other secondary" // 스타일 조정 필요시 chat-btn-other 재사용
              style={{ backgroundColor: '#f3f4f6', color: '#374151', boxShadow: 'none', border: '1px solid #e5e7eb' }}
              onClick={handleWriteReview}
            >
              <Edit3 size={20} />
              후기 작성
            </button>
          </div>
        </div>

        <div className="stats-section-other">
          <h3 className="section-title-other">활동 통계</h3>
          <div className="stats-grid-other">
            <div className="stat-card-other">
              <div
                className="stat-icon-other"
                style={{ backgroundColor: "#dcfce7" }}
              >
                <Star size={20} style={{ color: "#10b981" }} />
              </div>
              <div className="stat-info-other">
                <p className="stat-label-other">찾은 물건</p>
                <p className="stat-value-other">
                  {userProfile.stats.itemsFound}개
                </p>
              </div>
            </div>

            <div className="stat-card-other">
              <div
                className="stat-icon-other"
                style={{ backgroundColor: "#fef3c7" }}
              >
                <MapPin
                  size={20}
                  style={{ color: "#f59e0b" }}
                />
              </div>
              <div className="stat-info-other">
                <p className="stat-label-other">
                  잃어버린 물건
                </p>
                <p className="stat-value-other">
                  {userProfile.stats.itemsLost}개
                </p>
              </div>
            </div>

            <div className="stat-card-other">
              <div
                className="stat-icon-other"
                style={{ backgroundColor: "#dbeafe" }}
              >
                <Award size={20} style={{ color: "#3b82f6" }} />
              </div>
              <div className="stat-info-other">
                <p className="stat-label-other">받은 리뷰</p>
                <p className="stat-value-other">
                  {userProfile.stats.helpedOthers}개
                </p>
              </div>
            </div>
          </div>
        </div>

        {userProfile.badges.length > 0 && (
          <div className="badges-section-other">
            <h3 className="section-title-other">획득한 배지</h3>
            <div className="badges-grid-other">
              {userProfile.badges.map((badge) => (
                <div key={badge.id} className="badge-card-other">
                  <div className="badge-icon-other">
                    {badge.icon}
                  </div>
                  <div className="badge-info-other">
                    <p className="badge-name-other">
                      {badge.name}
                    </p>
                    <p className="badge-desc-other">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtherUserProfilePage;