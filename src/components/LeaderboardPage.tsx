import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, TrendingUp, Crown, Award, Loader2, AlertCircle } from 'lucide-react';
import { getUserInfo } from '../utils/auth';
import { fetchLeaderboard, type LeaderboardType, type LeaderboardEntry } from '../utils/leaderboard';
import BottomNavigation from './BottomNavigation';
import '../styles/leaderboard-page.css';

interface LeaderboardUser extends LeaderboardEntry {
  rank: number;
  displayScore: number; // 화면에 표시할 점수 (타입에 따라 다름)
}

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
        const data = await fetchLeaderboard(activeTab);
        
        // 데이터 가공 및 정렬
        // API에서 이미 정렬되어 온다고 가정하지만, 클라이언트에서도 한 번 더 정렬 가능
        // 타입에 따라 정렬 기준 및 표시 점수 결정
        const processedData = data.map((user) => {
            let score = 0;
            if (activeTab === 'points') score = user.totalScore;
            else if (activeTab === 'returns') score = user.returnedItemsCount;
            else if (activeTab === 'finds') score = user.returnedItemsCount; // 'finds'에 대한 정확한 필드가 없다면 임시로 대체하거나 API 확인 필요

            return {
                ...user,
                displayScore: score
            };
        });

        // 점수 내림차순 정렬
        processedData.sort((a, b) => b.displayScore - a.displayScore);

        // 순위 할당
        const dataWithRank = processedData.map((user, index) => ({
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
      case 'returns':
        return '찾아준 횟수';
      case 'points':
        return '보유 포인트';
      case 'finds':
        return '발견 횟수';
    }
  };

  const getScoreLabel = (type: LeaderboardType): string => {
    switch (type) {
      case 'returns':
        return '회';
      case 'points':
        return 'pts';
      case 'finds':
        return '건';
    }
  };

  const calculateAverageRating = (score: number, reviews: number) => {
      if (reviews === 0) return 0;
      return (score / reviews).toFixed(1);
  };

  const topThree = leaderboardData.slice(0, 3);
  const restOfList = leaderboardData.slice(3);
  
  const currentUserId = userInfo?.id; 

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

      <div className="leaderboard-tabs">
        <button
          className={`tab ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          <Award size={18} />
          <span>{getTabLabel('points')}</span>
        </button>
        <button
          className={`tab ${activeTab === 'returns' ? 'active' : ''}`}
          onClick={() => setActiveTab('returns')}
        >
          <Trophy size={18} />
          <span>{getTabLabel('returns')}</span>
        </button>
        <button
          className={`tab ${activeTab === 'finds' ? 'active' : ''}`}
          onClick={() => setActiveTab('finds')}
        >
          <TrendingUp size={18} />
          <span>{getTabLabel('finds')}</span>
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
                <div className="podium-section">
                {topThree[1] && (
                    <div className="podium-item second">
                        <div className="podium-avatar" onClick={() => navigate(`/other-profile/${topThree[1].id}`)}>
                        <img src={topThree[1].profileImage} alt={topThree[1].nickname} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=User')} />
                        <div className="rank-badge">
                            <span>2</span>
                        </div>
                        </div>
                        <div className="podium-info">
                        <p className="podium-name">{topThree[1].nickname}</p>
                        <div className="podium-score">
                            <Trophy size={12} className="score-icon" />
                            <span>{topThree[1].displayScore.toLocaleString()} {getScoreLabel(activeTab)}</span>
                        </div>
                        <div className="podium-rating">
                            <Star size={10} fill="currentColor" />
                            <span>{calculateAverageRating(topThree[1].totalScore, topThree[1].totalReviews)}</span>
                        </div>
                        </div>
                    </div>
                )}

                {topThree[0] && (
                    <div className="podium-item first">
                        <Crown className="crown-icon" size={32} />
                        <div className="podium-avatar" onClick={() => navigate(`/other-profile/${topThree[0].id}`)}>
                        <img src={topThree[0].profileImage} alt={topThree[0].nickname} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=User')} />
                        <div className="rank-badge">
                            <span>1</span>
                        </div>
                        </div>
                        <div className="podium-info">
                        <p className="podium-name">{topThree[0].nickname}</p>
                        <div className="podium-score">
                            <Trophy size={12} className="score-icon" />
                            <span>{topThree[0].displayScore.toLocaleString()} {getScoreLabel(activeTab)}</span>
                        </div>
                        <div className="podium-rating">
                            <Star size={10} fill="currentColor" />
                            <span>{calculateAverageRating(topThree[0].totalScore, topThree[0].totalReviews)}</span>
                        </div>
                        </div>
                    </div>
                )}

                {topThree[2] && (
                    <div className="podium-item third">
                        <div className="podium-avatar" onClick={() => navigate(`/other-profile/${topThree[2].id}`)}>
                        <img src={topThree[2].profileImage} alt={topThree[2].nickname} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=User')} />
                        <div className="rank-badge">
                            <span>3</span>
                        </div>
                        </div>
                        <div className="podium-info">
                        <p className="podium-name">{topThree[2].nickname}</p>
                        <div className="podium-score">
                            <Trophy size={12} className="score-icon" />
                            <span>{topThree[2].displayScore.toLocaleString()} {getScoreLabel(activeTab)}</span>
                        </div>
                        <div className="podium-rating">
                            <Star size={10} fill="currentColor" />
                            <span>{calculateAverageRating(topThree[2].totalScore, topThree[2].totalReviews)}</span>
                        </div>
                        </div>
                    </div>
                )}
                </div>

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
                    <img src={user.profileImage || 'https://via.placeholder.com/150?text=User'} alt={user.nickname} className="ranking-avatar" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=User')} />
                    <div className="ranking-info">
                        <p className="ranking-name">{user.nickname} {user.id === currentUserId && '(나)'}</p>
                        <div className="ranking-rating">
                        <Star size={12} fill="currentColor" />
                        <span>{calculateAverageRating(user.totalScore, user.totalReviews)}</span>
                        </div>
                    </div>
                    <div className="ranking-score">
                        <span>{user.displayScore.toLocaleString()} {getScoreLabel(activeTab)}</span>
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