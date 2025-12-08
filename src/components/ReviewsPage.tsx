import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, Award } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { getUserInfo, checkToken, getValidAuthToken } from '../utils/auth';
import '../styles/review-page.css'; // 기존 review-page.css 재활용 또는 새로 생성 필요

// API 데이터 타입 정의 (auth.ts의 ReceivedReview 참고)
interface ReviewAuthor {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
}

interface ReceivedReview {
  id: number;
  author?: ReviewAuthor;
  title: string;
  content: string;
  score: number;
  images: string[];
  // createdAt 필드가 auth.ts의 ReceivedReview에는 없지만, 보통 리뷰에는 날짜가 있으므로 확인 필요.
  // 만약 없다면 임의의 날짜나 생략 처리. 여기서는 있다고 가정하거나 없으면 현재 시간으로 처리.
  createdAt?: string;
}

// UI 표시용 인터페이스
interface ReviewUI {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerImage: string;
  rating: number;
  content: string;
  title: string; // itemName 대신 title 사용
  createdAt: string;
  helpful: number; // API에 없다면 0으로 처리
  category: 'lost' | 'found'; // API에 없다면 기본값 처리
  images: string[];
}

interface RatingStats {
  average: number;
  total: number;
  distribution: {
    excellent: number; // 90-100
    good: number; // 80-89
    average: number; // 70-79
    fair: number; // 60-69
    poor: number; // 0-59
  };
}

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<RatingStats>({
    average: 0,
    total: 0,
    distribution: {
      excellent: 0,
      good: 0,
      average: 0,
      fair: 0,
      poor: 0
    }
  });

  const [reviews, setReviews] = useState<ReviewUI[]>([]);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getValidAuthToken();
      if (!token) {
        // 로그인 안 된 경우 처리
        // alert('로그인이 필요합니다.'); // 필요시 주석 해제
        // navigate('/login');
        // return;
        // 또는 단순히 빈 상태로 표시
      }

      const currentUser = getUserInfo();
      if (!currentUser) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // 최신 유저 정보 조회 (receivedReviews 포함)
      const freshUserInfo = await checkToken(currentUser.id.toString());

      if (freshUserInfo && freshUserInfo.receivedReviews) {
        const apiReviews = freshUserInfo.receivedReviews;

        // 통계 계산
        let totalScore = 0;
        const distribution = {
          excellent: 0,
          good: 0,
          average: 0,
          fair: 0,
          poor: 0
        };

        const mappedReviews: ReviewUI[] = apiReviews.map((review: ReceivedReview) => {
          totalScore += review.score;

          if (review.score >= 90) distribution.excellent++;
          else if (review.score >= 80) distribution.good++;
          else if (review.score >= 70) distribution.average++;
          else if (review.score >= 60) distribution.fair++;
          else distribution.poor++;

          return {
            id: review.id.toString(),
            reviewerId: review.author?.id.toString() || 'unknown',
            reviewerName: review.author?.nickname || '익명',
            reviewerImage: review.author?.profileImage || 'https://via.placeholder.com/150?text=User',
            rating: review.score,
            content: review.content,
            title: review.title,
            // API에 createdAt이 없다면 임시로 현재 시간 사용 (실제로는 API 수정 필요할 수 있음)
            createdAt: review.createdAt || new Date().toISOString(),
            helpful: 0, // API에 관련 필드가 없다면 0
            category: 'lost', // API에 카테고리 정보가 없다면 기본값
            images: review.images || []
          };
        });

        const total = apiReviews.length;
        const average = total > 0 ? totalScore / total : 0;

        setStats({
          average,
          total,
          distribution
        });
        setReviews(mappedReviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('리뷰 로딩 실패:', err);
      setError('리뷰를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return '오늘';
      if (days === 1) return '어제';
      if (days < 7) return `${days}일 전`;
      if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks}주 전`;
      }
      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // 초록색
    if (score >= 80) return '#3b82f6'; // 파란색
    if (score >= 70) return '#f59e0b'; // 주황색
    if (score >= 60) return '#ef4444'; // 빨간색
    return '#9ca3af'; // 회색
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return '최고예요';
    if (score >= 80) return '좋아요';
    if (score >= 70) return '보통이에요';
    if (score >= 60) return '별로예요';
    return '아쉬워요';
  };

  const renderRatingBar = (label: string, count: number, range: string) => {
    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
    return (
      <div key={label} className="rating-bar-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
        <div className="rating-bar-label" style={{ width: '60px', color: '#6b7280' }}>
          <span className="range-text">{range}</span>
        </div>
        <div className="rating-bar-container" style={{ flex: 1, height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', margin: '0 12px', overflow: 'hidden' }}>
          <div
            className="rating-bar-fill"
            style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }}
          />
        </div>
        <span className="rating-bar-count" style={{ width: '30px', textAlign: 'right', color: '#374151', fontWeight: 500 }}>{count}</span>
      </div>
    );
  };

  const filteredReviews = reviews
    .filter(review => {
      if (filterRating === null) return true;
      if (filterRating === 'excellent') return review.rating >= 90;
      if (filterRating === 'good') return review.rating >= 80 && review.rating < 90;
      if (filterRating === 'average') return review.rating >= 70 && review.rating < 80;
      if (filterRating === 'fair') return review.rating >= 60 && review.rating < 70;
      if (filterRating === 'poor') return review.rating < 60;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return b.rating - a.rating;
      }
    });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>리뷰를 불러오는 중...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="reviews-page" style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="reviews-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="back-button" onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
          <ArrowLeft size={24} color="#111827" />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#111827' }}>받은 후기</h1>
        <div className="header-spacer" style={{ width: '24px' }} />
      </div>

      {/* Rating Summary */}
      <div className="rating-summary" style={{ backgroundColor: 'white', padding: '24px 20px', marginBottom: '12px' }}>
        <div className="rating-overview" style={{ display: 'flex', gap: '32px' }}>
          <div className="rating-score" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 'bold', margin: 0, color: '#111827', lineHeight: 1 }}>
              {stats.average.toFixed(1)}<span className="score-unit" style={{ fontSize: '16px', color: '#9ca3af', fontWeight: 'normal', marginLeft: '4px' }}>점</span>
            </h2>
            <p className="rating-grade" style={{ fontSize: '16px', fontWeight: 600, color: getScoreColor(stats.average), margin: '8px 0 4px' }}>{getScoreGrade(stats.average)}</p>
            <p className="rating-count" style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{stats.total}개의 후기</p>
          </div>

          <div className="rating-distribution" style={{ flex: 1 }}>
            {renderRatingBar('excellent', stats.distribution.excellent, '90-100')}
            {renderRatingBar('good', stats.distribution.good, '80-89')}
            {renderRatingBar('average', stats.distribution.average, '70-79')}
            {renderRatingBar('fair', stats.distribution.fair, '60-69')}
            {renderRatingBar('poor', stats.distribution.poor, '0-59')}
          </div>
        </div>
      </div>

      {/* Filter & Sort */}
      <div className="reviews-controls" style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div className="filter-buttons" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {[
            { key: null, label: '전체' },
            { key: 'excellent', label: '90-100점' },
            { key: 'good', label: '80-89점' },
            { key: 'average', label: '70-79점' },
            { key: 'fair', label: '60-69점' },
            { key: 'poor', label: '0-59점' }
          ].map((filter) => (
            <button
              key={filter.label}
              className={`filter-chip ${filterRating === filter.key ? 'active' : ''}`}
              onClick={() => setFilterRating(filter.key as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1px solid ${filterRating === filter.key ? '#10b981' : '#e5e7eb'}`,
                backgroundColor: filterRating === filter.key ? '#10b981' : 'white',
                color: filterRating === filter.key ? 'white' : '#6b7280',
                fontSize: '13px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              color: '#374151',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="recent">최신순</option>
            <option value="rating">높은 점수순</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredReviews.length > 0 ? (
          filteredReviews.map(review => (
            <div key={review.id} className="review-card" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div className="review-header" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <img
                  src={review.reviewerImage}
                  alt={review.reviewerName}
                  className="reviewer-image"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb' }}
                />
                <div className="reviewer-info" style={{ flex: 1 }}>
                  <div className="reviewer-name-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="reviewer-name" style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{review.reviewerName}</span>
                    {/* 카테고리 정보가 있다면 표시, 없다면 생략하거나 기본값 */}
                    {/* <span className={`item-category`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                      {review.category === 'lost' ? '분실물' : '습득물'}
                    </span> */}
                  </div>
                  <div className="review-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      className="review-score-badge"
                      style={{
                        backgroundColor: getScoreColor(review.rating),
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {review.rating}점
                    </div>
                    <span className="review-date" style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="review-content">
                <p className="review-item-name" style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                  <span style={{ marginRight: '4px' }}>📦</span>
                  {review.title}
                </p>
                <p className="review-text" style={{ fontSize: '15px', color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{review.content}</p>

                {/* 이미지 렌더링 추가 */}
                {review.images && review.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto' }}>
                    {review.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`review-img-${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="review-footer" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="helpful-button" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>
                  <ThumbsUp size={14} />
                  <span>도움돼요 {review.helpful}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Award size={48} stroke="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280', fontSize: '15px' }}>해당하는 후기가 없습니다</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default ReviewsPage;