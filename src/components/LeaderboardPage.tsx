import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, TrendingUp, Crown, Award, Loader2, AlertCircle } from 'lucide-react';
import { getUserInfo } from '../utils/auth';
// import { fetchLeaderboard, type LeaderboardType } from '../utils/leaderboard'; // API 유틸 제거 (Mock 데이터 사용)
import BottomNavigation from './BottomNavigation';
import '../styles/leaderboard-page.css';

// 리더보드 타입 정의 (컴포넌트 내부로 이동 또는 유지)
type LeaderboardType = 'helped' | 'points' | 'found';

interface LeaderboardUser {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
  // 랭킹 계산을 위해 추가 (데이터 로딩 시 index 기반으로 할당)
  rank?: number; 
}

// [NEW] Mock Data 정의
const MOCK_LEADERBOARD_DATA = {
  leaderboard: [
    {
      id: 1,
      nickname: 'ggm77',
      profileImage: 'https://lh3.googleusercontent.com/a/ACg8ocLpILFoJJPk1chIgbRGc1B-emhwRZqtMoAvakM3E3DL60H8x4N1=s96-c',
      totalScore: 1200, // 예시 점수 (순위 확인용)
      totalReviews: 15
    },
    {
      id: 2,
      nickname: 'seohamin',
      profileImage: 'https://lh3.googleusercontent.com/a/ACg8ocLo_CskRbceA4VxhYu6L2KjD8TCxdNc8vauXbJLTmRFvVN1CQ=s96-c',
      totalScore: 950,
      totalReviews: 8
    },
    {
      id: 3,
      nickname: 'evan',
      profileImage: 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png', // 예시 이미지 URL (실제 URL로 교체 필요할 수 있음)
      totalScore: 135,
      totalReviews: 2
    },
    {
      id: 4,
      nickname: 'evans',
      profileImage: 'https://lh3.googleusercontent.com/a/ACg8ocLnwYc68EShUut08Jb5y0k2h6w0yNOSq0yidOdp_UxRxL4pCski=s96-c',
      totalScore: 50,
      totalReviews: 1
    },
    {
      id: 5,
      nickname: 'evannns',
      profileImage: 'https://lh3.googleusercontent.com/a/ACg8ocJAFMcb6sqi31su6-K0pPMz8uBqhkP0mbVaQu7St3e9OZnEcQ=s96-c',
      totalScore: 0,
      totalReviews: 0
    }
  ]
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('points');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 실제 API 호출 대신 Mock 데이터 사용 및 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 데이터 가공: rank 추가 및 정렬 (totalScore 기준 내림차순 예시)
        // 실제 API에서는 정렬되어 올 수 있지만, 안전하게 클라이언트에서도 정렬
        const sortedData = [...MOCK_LEADERBOARD_DATA.leaderboard].sort((a, b) => b.totalScore - a.totalScore);
        
        const dataWithRank = sortedData.map((user, index) => ({
          ...user,
          rank: index + 1
        }));

        setLeaderboardData(dataWithRank);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setError('리더보드 정보를 불러오지 못했습니다.');
        setLeaderboardData([]); 
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  const getTabLabel = (type: LeaderboardType): string => {
    switch (type) {
      case 'helped':
        return '찾아준 횟수';
      case 'points':
        return '보유 포인트'; // 여기서는 totalScore를 포인트로 가정하고 표시
      case 'found':
        return '발견 횟수';
    }
  };

  const getScoreLabel = (type: LeaderboardType): string => {
    switch (type) {
      case 'helped':
        return '회';
      case 'points':
        return '점'; // pts -> 점
      case 'found':
        return '건';
    }
  };

  // 평균 평점 계산 헬퍼 함수 (totalScore / totalReviews)
  const calculateAverageRating = (score: number, reviews: number) => {
      if (reviews === 0) return 0;
      return (score / reviews).toFixed(1);
  };

  const topThree = leaderboardData.slice(0, 3);
  const restOfList = leaderboardData.slice(3);
  
  // 내 랭킹 찾기 (닉네임이나 ID로 비교)
  const currentUserId = userInfo?.id; // number 타입
  // const currentUserRankIndex = leaderboardData.findIndex(user => user.id === currentUserId);

  if (isLoading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
            <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
            </button>
            <h1>리더보드</h1>
            <div className="header-spacer" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '1rem' }}>
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-gray-500">랭킹을 불러오는 중...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>리더보드</h1>
        <div className="header-spacer" />
      </div>

      {/* Tabs */}
      <div className="leaderboard-tabs">
        <button
          className={`tab ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          <Award size={18} />
          <span>{getTabLabel('points')}</span>
        </button>
        {/* 다른 탭들은 현재 데이터 구조상 points와 동일한 데이터를 보여주게 됩니다. 
            실제로는 API 호출 시 type에 따라 다른 데이터를 받아와야 합니다. */}
        <button
          className={`tab ${activeTab === 'helped' ? 'active' : ''}`}
          onClick={() => setActiveTab('helped')}
        >
          <Trophy size={18} />
          <span>{getTabLabel('helped')}</span>
        </button>
        <button
          className={`tab ${activeTab === 'found' ? 'active' : ''}`}
          onClick={() => setActiveTab('found')}
        >
          <TrendingUp size={18} />
          <span>{getTabLabel('found')}</span>
        </button>
      </div>

      <div className="leaderboard-content">
        {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
                <AlertCircle size={32} />
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="text-sm text-primary underline">다시 시도</button>
            </div>
        ) : leaderboardData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
                <p>랭킹 데이터가 없습니다.</p>
            </div>
        ) : (
            <>
                {/* Top 3 Podium */}
                <div className="podium-section">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="podium-item second">
                        <div className="podium-avatar" onClick={() => navigate(`/other-profile/${topThree[1].id}`)}>
                        <img src={topThree[1].profileImage} alt={topThree[1].nickname} />
                        <div className="rank-badge">
                            <span>2</span>
                        </div>
                        </div>
                        <div className="podium-info">
                        <p className="podium-name">{topThree[1].nickname}</p>
                        <div className="podium-score">
                            <Trophy size={12} className="score-icon" />
                            <span>{topThree[1].totalScore.toLocaleString()} {getScoreLabel(activeTab)}</span>
                        </div>
                        <div className="podium-rating">
                            <Star size={10} fill="currentColor" />
                            <span>{calculateAverageRating(topThree[1].totalScore, topThree[1].totalReviews)}</span>
                        </div>
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                    <div className="podium-item first">
                        <Crown className="crown-icon" size={32} />
                        <div className="podium-avatar" onClick={() => navigate(`/other-profile/${topThree[0].id}`)}>
                        <img src={topThree[0].profileImage} alt={topThree[0].nickname} />
                        <div className="rank-badge">
                            <span>1</span>
                        </div>
                        </div>
                        <div className="podium-info">
                        <p className="podium-name">{topThree[0].nickname}</p>
                        <div className="podium-score">
                            <Trophy size={12} className="score-icon" />
                            <span>{topThree[0].totalScore.toLocaleString()} {getScoreLabel(activeTab)}</span>
                        </div>
                        <div className="podium-rating">
                            <Star size={10} fill="currentColor" />
                            <span>{calculateAverageRating(topThree[0].totalScore, topThree[0].totalReviews)}</span>
                        </div>
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <div className="podium-item third">
                        <div className="podium-avatar" onClick={() => navigate(`/other-profile/${topThree[2].id}`)}>
                        <img src={topThree[2].profileImage} alt={topThree[2].nickname} />
                        <div className="rank-badge">
                            <span>3</span>
                        </div>
                        </div>
                        <div className="podium-info">
                        <p className="podium-name">{topThree[2].nickname}</p>
                        <div className="podium-score">
                            <Trophy size={12} className="score-icon" />
                            <span>{topThree[2].totalScore.toLocaleString()} {getScoreLabel(activeTab)}</span>
                        </div>
                        <div className="podium-rating">
                            <Star size={10} fill="currentColor" />
                            <span>{calculateAverageRating(topThree[2].totalScore, topThree[2].totalReviews)}</span>
                        </div>
                        </div>
                    </div>
                )}
                </div>

                {/* Rest of the list */}
                <div className="ranking-list">
                {restOfList.map((user) => (
                    <div
                    key={user.id}
                    className={`ranking-item ${user.id === currentUserId ? 'current-user' : ''}`}
                    onClick={() => {
                        if (user.id !== currentUserId) {
                             navigate(`/other-profile/${user.id}`);
                        }
                    }}
                    >
                    <div className="ranking-number">
                        <span>{user.rank}</span>
                    </div>
                    <img src={user.profileImage} alt={user.nickname} className="ranking-avatar" />
                    <div className="ranking-info">
                        <p className="ranking-name">{user.nickname} {user.id === currentUserId && '(나)'}</p>
                        <div className="ranking-rating">
                        <Star size={12} fill="currentColor" />
                        <span>{calculateAverageRating(user.totalScore, user.totalReviews)}</span>
                        </div>
                    </div>
                    <div className="ranking-score">
                        <span>{user.totalScore.toLocaleString()} {getScoreLabel(activeTab)}</span>
                    </div>
                    </div>
                ))}
                </div>
            </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default LeaderboardPage;