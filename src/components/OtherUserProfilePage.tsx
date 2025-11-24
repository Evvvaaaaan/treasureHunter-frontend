import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Star,
  MapPin,
  Calendar,
  Shield,
  Award,
  AlertCircle,
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
  trustScore: number; // API의 totalScore와 연결됨
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

  const loadUserProfile = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. API 호출 (src/utils/auth.ts의 getUserProfile 사용)
      const userData: UserInfo | null = await getUserProfile(userId);

      if (!userData) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      // 2. API 응답(UserInfo)을 UI 상태(UserProfile)로 매핑
      const mappedProfile: UserProfile = {
        id: userData.id.toString(),
        nickname: userData.nickname,
        profileImage: userData.profileImage || "https://via.placeholder.com/400x400?text=No+Image",
        // API에 bio(자기소개) 필드가 없으므로 기본값 설정
        bio: "안녕하세요! 보물찾기를 통해 잃어버린 물건을 찾고 있습니다.",
        
        // [요청사항 반영] 신뢰도를 totalScore로 연결
        trustScore: userData.totalScore || 0,
        
        // API에 접속 상태/위치 정보가 없으므로 기본값 설정
        isOnline: false, 
        location: "활동 지역 정보 없음", 
        
        joinedDate: new Date(userData.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric'
        }),
        
        stats: {
          // 찾아준 물건 개수
          itemsFound: userData.returnedItemsCount || 0,
          
          // 잃어버린 물건 개수 (게시글 중 type이 LOST인 것 카운트)
          itemsLost: userData.posts ? userData.posts.filter(p => 
            (p.type || '').toUpperCase() === 'LOST'
          ).length : 0,
          
          // 도움 준 횟수 (받은 리뷰 수로 대체)
          helpedOthers: userData.totalReviews || 0,
          
          // 성공률 (임시 계산: 리뷰 수 / (찾은 수 + 1) * 100 등으로 계산하거나 고정값)
          successRate: 95, 
        },
        
        // 뱃지 상세 정보가 없으므로 badgeCount를 기반으로 더미 뱃지 생성
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

  const handleStartChat = () => {
    navigate(`/chat/${id}`);
  };

  const handleReport = () => {
    if (confirm("이 사용자를 신고하시겠습니까?")) {
      alert("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
    }
  };

  const getTrustScoreColor = (score: number) => {
    // 점수 기준에 따라 색상 변경 (totalScore 기준)
    // 예: 100점 이상 초록, 50점 이상 노랑, 그 외 빨강
    // totalScore의 범위에 따라 기준 점수 조정이 필요할 수 있습니다.
    if (score >= 100) return "#10b981"; // Green
    if (score >= 50) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
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
      {/* Header */}
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

      {/* Profile Content */}
      <div className="profile-content-other">
        {/* User Info Card */}
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

          {/* Trust Score (Total Score) */}
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
              {/* Total Score는 상한선이 없을 수 있으므로 /100 제거하거나 상황에 맞게 수정 */}
              <span className="score-max">점</span>
            </div>
            <div className="trust-score-bar">
              <div
                className="trust-score-fill"
                style={{
                  // 100점을 100%로 가정 (필요시 분모 조정)
                  width: `${Math.min(userProfile.trustScore, 100)}%`,
                  backgroundColor: getTrustScoreColor(userProfile.trustScore),
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions-other">
            <button
              className="chat-btn-other primary"
              onClick={handleStartChat}
            >
              <MessageCircle size={20} />
              메시지 보내기
            </button>
          </div>
        </div>

        {/* Stats Grid */}
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

        {/* Badges Section */}
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