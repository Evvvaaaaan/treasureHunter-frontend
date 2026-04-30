import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';
import { getUserInfo } from '../utils/auth';
import { fetchLeaderboard, type LeaderboardType, type LeaderboardEntry } from '../utils/leaderboard';
import BottomNavigation from './BottomNavigation';
import '../styles/leaderboard-page.css';

interface LeaderboardUser extends LeaderboardEntry {
  rank: number;
  displayScore: number;
}

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('points');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── API에서 리더보드 데이터 로드 ──
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchLeaderboard(activeTab);

        const processedData = data.map((user) => {
          let score = 0;
          if (activeTab === 'points') score = user.point;
          else if (activeTab === 'returns') score = user.returnedItemsCount;
          else if (activeTab === 'finds') score = user.foundCount || 0;

          return { ...user, displayScore: score };
        });

        processedData.sort((a, b) => b.displayScore - a.displayScore);

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

  // ── 헬퍼 함수 ──
  const getScoreLabel = (type: LeaderboardType): string => {
    switch (type) {
      case 'returns': return '회';
      case 'points': return 'P';
      case 'finds': return '건';
    }
  };

  const displayValue = (user: LeaderboardUser) =>
    `${user.displayScore.toLocaleString()}${getScoreLabel(activeTab)}`;

  const currentUserId = userInfo?.id;

  // ── 데이터 파생 ──
  const topTen = leaderboardData.slice(0, 10);
  const topThree = topTen.slice(0, 3);
  const rankFourToTen = topTen.slice(3);

  const myEntry = currentUserId
    ? leaderboardData.find(u => u.id === currentUserId)
    : null;

  const myRankOutsideTop10 = myEntry && myEntry.rank > 10;

  const tenthPlace = topTen.length >= 10 ? topTen[9] : null;

  // 1등과 2등 격차
  const first = topThree[0];
  const second = topThree[1];
  const gapFirstSecond = first && second ? first.displayScore - second.displayScore : 0;

  // 내가 10위 안에 들려면 얼마나 더 필요한지
  const catchUpToTen = myEntry && tenthPlace
    ? tenthPlace.displayScore - myEntry.displayScore + 1
    : 0;

  const getInitial = (name: string) => name?.charAt(0) || '?';

  const getAvatarColor = (rank: number) => {
    const colors = ['#0F3D2E', '#2A5A42', '#7B5A3A', '#3A5A7B', '#5A3A7B', '#3A7B5A', '#7B3A3A', '#5A7B3A', '#7B6A3A', '#3A6A7B'];
    return colors[(rank - 1) % colors.length];
  };

  // ── 로딩 ──
  if (isLoading) {
    return (
      <div className="lb-page">
        <div className="lb-header">
          <button className="lb-header-btn" onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
          <h1 className="lb-header-title">리더보드</h1>
          <div style={{ width: 38 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '1rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6FA886' }} />
          <p style={{ color: '#4D7A62' }}>랭킹을 불러오는 중...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // ── 에러 ──
  if (error) {
    return (
      <div className="lb-page">
        <div className="lb-header">
          <button className="lb-header-btn" onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
          <h1 className="lb-header-title">리더보드</h1>
          <div style={{ width: 38 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '1rem', color: '#4D7A62' }}>
          <p>{error}</p>
          <button onClick={() => setActiveTab(activeTab)} style={{ padding: '8px 20px', borderRadius: '10px', background: '#0F3D2E', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            다시 시도
          </button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="lb-page">
      {/* Header */}
      <div className="lb-header">
        <button className="lb-header-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="lb-header-title">리더보드</h1>
        <div style={{ width: 38 }} />
      </div>

      <div className="lb-scroll">
        {/* Scope Tabs */}
        <div className="lb-scope-wrap">
          <div className="lb-scope-tabs">
            <button
              className={`lb-scope-tab ${activeTab === 'points' ? 'active' : ''}`}
              onClick={() => setActiveTab('points')}
            >
              <span className="lb-scope-label">보유 포인트</span>
              <span className="lb-scope-sub">pts 기준</span>
            </button>
            <button
              className={`lb-scope-tab ${activeTab === 'returns' ? 'active' : ''}`}
              onClick={() => setActiveTab('returns')}
            >
              <span className="lb-scope-label">찾아준 횟수</span>
              <span className="lb-scope-sub">회 기준</span>
            </button>
            <button
              className={`lb-scope-tab ${activeTab === 'finds' ? 'active' : ''}`}
              onClick={() => setActiveTab('finds')}
            >
              <span className="lb-scope-label">발견 횟수</span>
              <span className="lb-scope-sub">건 기준</span>
            </button>
          </div>
        </div>

        {/* Podium (Top 3) */}
        {topThree.length >= 3 && (
          <div className="lb-podium-card">
            <div className="lb-podium-row">
              {/* 2nd Place */}
              <div className="lb-podium-item lb-p2">
                <div className="lb-avatar-wrap">
                  <div className="lb-avatar" style={{ background: getAvatarColor(2) }}>
                    {second.profileImage
                      ? <img src={second.profileImage} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : <span>{getInitial(second.nickname)}</span>}
                  </div>
                  <div className="lb-rank-badge lb-rank-2">2</div>
                </div>
                <div className="lb-podium-name">{second.nickname}</div>
                <div className="lb-points-box lb-pts-2">
                  <span className="lb-pts-num">{second.displayScore.toLocaleString()}</span>
                  <span className="lb-pts-label">{getScoreLabel(activeTab)}</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="lb-podium-item lb-p1">
                <div className="lb-crown">
                  <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
                    <rect x="3" y="21" width="32" height="5" rx="2.5" fill="#C9A227"/>
                    <path d="M3 21 L7 8 L14.5 15 L19 3 L23.5 15 L31 8 L35 21 Z" fill="#C9A227"/>
                    <path d="M3 21 L7 8 L14.5 15 L19 3 L23.5 15 L31 8 L35 21 Z" fill="url(#crownGrad)"/>
                    <circle cx="19" cy="3.5" r="2" fill="#F0C84A"/>
                    <circle cx="7" cy="8" r="1.5" fill="#F0C84A"/>
                    <circle cx="31" cy="8" r="1.5" fill="#F0C84A"/>
                    <defs>
                      <linearGradient id="crownGrad" x1="19" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#F0C84A" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#9A7510" stopOpacity="0.25"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="lb-avatar-wrap">
                  <div className="lb-avatar lb-avatar-first" style={{ background: getAvatarColor(1) }}>
                    {first.profileImage
                      ? <img src={first.profileImage} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : <span>{getInitial(first.nickname)}</span>}
                  </div>
                  <div className="lb-rank-badge lb-rank-1">1</div>
                </div>
                <div className="lb-podium-name">{first.nickname}</div>
                <div className="lb-points-box lb-pts-1">
                  <span className="lb-pts-num">{first.displayScore.toLocaleString()}</span>
                  <span className="lb-pts-label">{getScoreLabel(activeTab)}</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="lb-podium-item lb-p3">
                <div className="lb-avatar-wrap">
                  <div className="lb-avatar" style={{ background: getAvatarColor(3) }}>
                    {topThree[2].profileImage
                      ? <img src={topThree[2].profileImage} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : <span>{getInitial(topThree[2].nickname)}</span>}
                  </div>
                  <div className="lb-rank-badge lb-rank-3">3</div>
                </div>
                <div className="lb-podium-name">{topThree[2].nickname}</div>
                <div className="lb-points-box lb-pts-3">
                  <span className="lb-pts-num">{topThree[2].displayScore.toLocaleString()}</span>
                  <span className="lb-pts-label">{getScoreLabel(activeTab)}</span>
                </div>
              </div>
            </div>

            {/* 1등-2등 격차 */}
            <div className="lb-gap-info">
              <TrendingUp size={13} />
              <span>1등과 2등의 격차 {gapFirstSecond.toLocaleString()}{getScoreLabel(activeTab)}</span>
            </div>
          </div>
        )}

        {/* Rankings 4~10 */}
        <div className="lb-list">
          {rankFourToTen.map((user) => {
            const isMe = currentUserId !== undefined && user.id === currentUserId;
            return (
              <div
                key={user.id}
                className={`lb-list-item ${isMe ? 'lb-item-me' : ''}`}
                onClick={() => { if (!isMe) navigate(`/other-profile/${user.id}`); }}
              >
                <div className="lb-item-rank">{user.rank}</div>
                <div className="lb-item-avatar" style={{ background: getAvatarColor(user.rank) }}>
                  {user.profileImage
                    ? <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : <span>{getInitial(user.nickname)}</span>}
                </div>
                <div className="lb-item-info">
                  <div className="lb-item-name">{isMe ? '나 (내 순위)' : user.nickname}</div>
                  <div className="lb-item-title">
                    신뢰도 {user.totalReviews > 0 ? Math.round(user.totalScore / user.totalReviews) : 0}점
                  </div>
                </div>
                <div className="lb-item-right">
                  <div className="lb-item-pts">{displayValue(user)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 내가 10위 밖일 때 — 비교 카드 */}
        {myRankOutsideTop10 && myEntry && tenthPlace && (
          <div className="lb-myrank-card">
            <div className="lb-myrank-badge">
              <span className="lb-myrank-num">{myEntry.rank}</span>
            </div>
            <div className="lb-myrank-info">
              <div className="lb-myrank-label">지금 나의 위치</div>
              <div className="lb-myrank-sub">{displayValue(myEntry)}</div>
              <div className="lb-myrank-compare">
                <div className="lb-compare-row">
                  <span className="lb-compare-label">10위 ({tenthPlace.nickname})</span>
                  <span className="lb-compare-val">{displayValue(tenthPlace)}</span>
                </div>
                <div className="lb-compare-row">
                  <span className="lb-compare-label">나</span>
                  <span className="lb-compare-val">{displayValue(myEntry)}</span>
                </div>
                <div className="lb-compare-gap">
                  10위 진입까지 <span className="lb-catchup-pts">+{catchUpToTen.toLocaleString()}{getScoreLabel(activeTab)}</span> 더 필요
                </div>
              </div>
            </div>
            <div className="lb-myrank-weekly">
              <div className="lb-myrank-tag">MY RANK</div>
            </div>
          </div>
        )}

        {/* 내가 10위 안일 때 — 간단한 하이라이트 */}
        {myEntry && myEntry.rank <= 10 && (
          <div className="lb-myrank-card" style={{ background: '#1B5E42' }}>
            <div className="lb-myrank-badge">
              <span className="lb-myrank-num">{myEntry.rank}</span>
            </div>
            <div className="lb-myrank-info">
              <div className="lb-myrank-label">🎉 TOP 10 안에 있습니다!</div>
              <div className="lb-myrank-sub">{displayValue(myEntry)} · 신뢰도 {myEntry.totalReviews > 0 ? Math.round(myEntry.totalScore / myEntry.totalReviews) : 0}점</div>
            </div>
            <div className="lb-myrank-weekly">
              <div className="lb-myrank-tag">MY RANK</div>
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default LeaderboardPage;