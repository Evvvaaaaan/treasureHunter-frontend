import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, TrendingUp, Crown, Award } from 'lucide-react';
import { getUserInfo } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
import '../styles/leaderboard-page.css';

// SVG imports from Figma
import svgPaths from '../imports/svg-e8y36ov2i9';
import imgEllipse56 from "figma:asset/89891e3396fd2a3770fa0304a3e5d201e94fff7d.png";
import imgEllipse57 from "figma:asset/c8addd2f00ea051951c56b986eaaf0c17b2d71e1.png";
import imgEllipse58 from "figma:asset/1306aff247bf0127d6345951033ecbd4cb4c4362.png";
import imgEllipse59 from "figma:asset/9099bbfcf2566544cb65546f3660785e131b4479.png";
import imgEllipse60 from "figma:asset/de4265679c10ffe0b3bb5d3771be69df0acd50cf.png";
import imgEllipse61 from "figma:asset/e60f575a81c72a7ccd0f428e129fc797d1d4a738.png";
import imgEllipse62 from "figma:asset/ae2049e4fcc57086ea2f268a5cfc91a66dab222d.png";
import imgEllipse55 from "figma:asset/479ec3132a110f44be362d4aaf14e861d0a71d29.png";
import imgEllipse63 from "figma:asset/f52f60237f6b84d2dd4fb5d81f7e111d1ce642b3.png";
import imgEllipse64 from "figma:asset/f270fee843d3de6496ad0f5ac2294c4574003a96.png";

interface LeaderboardUser {
  id: string;
  rank: number;
  nickname: string;
  profileImage: string;
  score: number;
  averageRating: number;
}

type LeaderboardType = 'helped' | 'points' | 'found';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('points');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - 실제로는 API에서 가져와야 함
  const mockData: Record<LeaderboardType, LeaderboardUser[]> = {
    points: [
      { id: '1', rank: 1, nickname: 'Bryan Wolf', profileImage: imgEllipse55, score: 43, averageRating: 4.9 },
      { id: '2', rank: 2, nickname: 'Meghan Jes...', profileImage: imgEllipse63, score: 40, averageRating: 4.8 },
      { id: '3', rank: 3, nickname: 'Alex Turner', profileImage: imgEllipse64, score: 38, averageRating: 4.7 },
      { id: '4', rank: 4, nickname: 'Marsha Fisher', profileImage: imgEllipse56, score: 36, averageRating: 4.6 },
      { id: '5', rank: 5, nickname: 'Juanita Cormier', profileImage: imgEllipse57, score: 35, averageRating: 4.5 },
      { id: '6', rank: 6, nickname: 'You', profileImage: imgEllipse58, score: 34, averageRating: 4.4 },
      { id: '7', rank: 7, nickname: 'Tamara Schmidt', profileImage: imgEllipse59, score: 33, averageRating: 4.3 },
      { id: '8', rank: 8, nickname: 'Ricardo Veum', profileImage: imgEllipse60, score: 32, averageRating: 4.2 },
      { id: '9', rank: 9, nickname: 'Gary Sanford', profileImage: imgEllipse61, score: 31, averageRating: 4.1 },
      { id: '10', rank: 10, nickname: 'Becky Bartell', profileImage: imgEllipse62, score: 30, averageRating: 4.0 },
    ],
    helped: [
      { id: '1', rank: 1, nickname: 'Bryan Wolf', profileImage: imgEllipse55, score: 25, averageRating: 4.9 },
      { id: '2', rank: 2, nickname: 'Alex Turner', profileImage: imgEllipse64, score: 23, averageRating: 4.7 },
      { id: '3', rank: 3, nickname: 'Meghan Jes...', profileImage: imgEllipse63, score: 20, averageRating: 4.8 },
      { id: '4', rank: 4, nickname: 'Marsha Fisher', profileImage: imgEllipse56, score: 18, averageRating: 4.6 },
      { id: '5', rank: 5, nickname: 'Juanita Cormier', profileImage: imgEllipse57, score: 16, averageRating: 4.5 },
      { id: '6', rank: 6, nickname: 'You', profileImage: imgEllipse58, score: 15, averageRating: 4.4 },
      { id: '7', rank: 7, nickname: 'Ricardo Veum', profileImage: imgEllipse60, score: 14, averageRating: 4.2 },
      { id: '8', rank: 8, nickname: 'Tamara Schmidt', profileImage: imgEllipse59, score: 12, averageRating: 4.3 },
      { id: '9', rank: 9, nickname: 'Gary Sanford', profileImage: imgEllipse61, score: 11, averageRating: 4.1 },
      { id: '10', rank: 10, nickname: 'Becky Bartell', profileImage: imgEllipse62, score: 10, averageRating: 4.0 },
    ],
    found: [
      { id: '1', rank: 1, nickname: 'Alex Turner', profileImage: imgEllipse64, score: 30, averageRating: 4.7 },
      { id: '2', rank: 2, nickname: 'Bryan Wolf', profileImage: imgEllipse55, score: 28, averageRating: 4.9 },
      { id: '3', rank: 3, nickname: 'Meghan Jes...', profileImage: imgEllipse63, score: 26, averageRating: 4.8 },
      { id: '4', rank: 4, nickname: 'Marsha Fisher', profileImage: imgEllipse56, score: 22, averageRating: 4.6 },
      { id: '5', rank: 5, nickname: 'You', profileImage: imgEllipse58, score: 20, averageRating: 4.4 },
      { id: '6', rank: 6, nickname: 'Juanita Cormier', profileImage: imgEllipse57, score: 18, averageRating: 4.5 },
      { id: '7', rank: 7, nickname: 'Ricardo Veum', profileImage: imgEllipse60, score: 16, averageRating: 4.2 },
      { id: '8', rank: 8, nickname: 'Tamara Schmidt', profileImage: imgEllipse59, score: 14, averageRating: 4.3 },
      { id: '9', rank: 9, nickname: 'Gary Sanford', profileImage: imgEllipse61, score: 12, averageRating: 4.1 },
      { id: '10', rank: 10, nickname: 'Becky Bartell', profileImage: imgEllipse62, score: 10, averageRating: 4.0 },
    ],
  };

  useEffect(() => {
    // 실제로는 API 호출
    setIsLoading(true);
    setTimeout(() => {
      setLeaderboardData(mockData[activeTab]);
      setIsLoading(false);
    }, 300);
  }, [activeTab]);

  const getTabLabel = (type: LeaderboardType): string => {
    switch (type) {
      case 'helped':
        return '찾아준 횟수';
      case 'points':
        return '보유 포인트';
      case 'found':
        return '발견 횟수';
    }
  };

  const getScoreLabel = (type: LeaderboardType): string => {
    switch (type) {
      case 'helped':
        return '회';
      case 'points':
        return 'pts';
      case 'found':
        return '건';
    }
  };

  const topThree = leaderboardData.slice(0, 3);
  const restOfList = leaderboardData.slice(3);
  const currentUserRank = leaderboardData.find(user => user.nickname === 'You');

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
          className={`tab ${activeTab === 'helped' ? 'active' : ''}`}
          onClick={() => setActiveTab('helped')}
        >
          <Trophy size={18} />
          <span>{getTabLabel('helped')}</span>
        </button>
        <button
          className={`tab ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          <Award size={18} />
          <span>{getTabLabel('points')}</span>
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
        {/* Top 3 Podium */}
        <div className="podium-section">
          {topThree.length >= 3 && (
            <>
              {/* 2nd Place */}
              <div className="podium-item second">
                <div className="podium-avatar">
                  <img src={topThree[1].profileImage} alt={topThree[1].nickname} />
                  <div className="rank-badge">
                    <span>2</span>
                  </div>
                </div>
                <div className="podium-info">
                  <p className="podium-name">{topThree[1].nickname}</p>
                  <div className="podium-score">
                    <Trophy size={12} className="score-icon" />
                    <span>{topThree[1].score} {getScoreLabel(activeTab)}</span>
                  </div>
                  <div className="podium-rating">
                    <Star size={10} fill="currentColor" />
                    <span>{topThree[1].averageRating}</span>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="podium-item first">
                <Crown className="crown-icon" size={32} />
                <div className="podium-avatar">
                  <img src={topThree[0].profileImage} alt={topThree[0].nickname} />
                  <div className="rank-badge">
                    <span>1</span>
                  </div>
                </div>
                <div className="podium-info">
                  <p className="podium-name">{topThree[0].nickname}</p>
                  <div className="podium-score">
                    <Trophy size={12} className="score-icon" />
                    <span>{topThree[0].score} {getScoreLabel(activeTab)}</span>
                  </div>
                  <div className="podium-rating">
                    <Star size={10} fill="currentColor" />
                    <span>{topThree[0].averageRating}</span>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="podium-item third">
                <div className="podium-avatar">
                  <img src={topThree[2].profileImage} alt={topThree[2].nickname} />
                  <div className="rank-badge">
                    <span>3</span>
                  </div>
                </div>
                <div className="podium-info">
                  <p className="podium-name">{topThree[2].nickname}</p>
                  <div className="podium-score">
                    <Trophy size={12} className="score-icon" />
                    <span>{topThree[2].score} {getScoreLabel(activeTab)}</span>
                  </div>
                  <div className="podium-rating">
                    <Star size={10} fill="currentColor" />
                    <span>{topThree[2].averageRating}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rest of the list */}
        <div className="ranking-list">
          {restOfList.map((user) => (
            <div
              key={user.id}
              className={`ranking-item ${user.nickname === 'You' ? 'current-user' : ''}`}
              onClick={() => {
                if (user.nickname !== 'You') {
                  navigate(`/user/${user.id}`);
                }
              }}
            >
              <div className="ranking-number">
                <span>{user.rank}</span>
              </div>
              <img src={user.profileImage} alt={user.nickname} className="ranking-avatar" />
              <div className="ranking-info">
                <p className="ranking-name">{user.nickname}</p>
                <div className="ranking-rating">
                  <Star size={12} fill="currentColor" />
                  <span>{user.averageRating}</span>
                </div>
              </div>
              <div className="ranking-score">
                <span>{user.score} {getScoreLabel(activeTab)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default LeaderboardPage;
