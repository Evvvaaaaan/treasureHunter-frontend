import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft,Search, Loader2, Coins, MapPin, Calendar, Package, X } from "lucide-react";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { getValidAuthToken } from "../utils/auth";
import "../styles/search-page.css";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';
const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

// API Response Type
interface ApiPost {
  id: number;
  title: string;
  content: string;
  type: 'LOST' | 'FOUND';
  author?: {
    id: number;
    nickname: string;
    profileImage: string;
    totalScore: number;
    totalReviews: number;
  };
  images: string[];
  setPoint: number;
  itemCategory: string;
  lat: number;
  lon: number;
  lostAt: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  isCompleted: boolean;
}

// UI Display Type
interface SearchResultItem {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  imageUrl: string;
  status: "lost" | "found";
  points: number;
  isCompleted: boolean;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL에서 초기 검색어 가져오기
  const initialQuery = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [postType, setPostType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  
  // 최근 검색어 (로컬 스토리지 사용 권장, 여기서는 State로 유지)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  // 검색어가 URL에 있거나 필터가 변경되면 API 호출
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      fetchSearchResults(initialQuery, postType);
    }
  }, [initialQuery, postType]);

  // 최근 검색어 저장
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const fetchSearchResults = async (query: string, type: 'ALL' | 'LOST' | 'FOUND') => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const token = await getValidAuthToken();
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // API URL 구성
      let url = `${API_BASE_URL}/posts?searchType=text&query=${encodeURIComponent(query)}`;
      if (type !== 'ALL') {
        url += `&postType=${type}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      const posts: ApiPost[] = data.posts || [];

      // API 데이터를 UI 데이터로 변환
      const mappedResults: SearchResultItem[] = posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        category: post.itemCategory, // 필요시 한글 매핑 추가
        location: post.lat && post.lon ? '위치 정보 있음' : '위치 미상', // 실제 주소 변환은 Geocoder 필요
        date: post.lostAt,
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : DEFAULT_IMAGE,
        status: (post.type || 'LOST').toLowerCase() as 'lost' | 'found',
        points: post.setPoint,
        isCompleted: post.isCompleted
      }));

      setResults(mappedResults);

    } catch (error) {
      console.error("Search API Error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 최근 검색어 업데이트
      if (!recentSearches.includes(searchQuery.trim())) {
        setRecentSearches(prev => [searchQuery.trim(), ...prev].slice(0, 10));
      }
      // URL 변경 -> useEffect 트리거 -> API 호출
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleSearchClick = (query: string) => {
    setSearchQuery(query);
    setSearchParams({ q: query });
  };

  const handleRemoveSearch = (query: string) => {
    setRecentSearches(recentSearches.filter((item) => item !== query));
  };

  const handleClearAll = () => {
    setRecentSearches([]);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="search-page">
      {/* Header */}
      <header className="search-header">
        <div className="search-header-container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft style={{ width: "1.5rem", height: "1.5rem" }} />
          </button>
          <h1>검색</h1>
          <div style={{ width: "1.5rem" }}></div> {/* Spacer */}
        </div>
        
        {/* Type Filter Tabs - 검색어가 있을 때만 표시하거나 항상 표시 */}
        <div className="filter-tabs" style={{ display: 'flex', gap: '8px', padding: '0 16px 12px' }}>
          {['ALL', 'LOST', 'FOUND'].map((type) => (
            <button
              key={type}
              onClick={() => setPostType(type as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                border: `1px solid ${postType === type ? '#10b981' : '#e5e7eb'}`,
                backgroundColor: postType === type ? '#10b981' : 'white',
                color: postType === type ? 'white' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {type === 'ALL' ? '전체' : type === 'LOST' ? '분실물' : '습득물'}
            </button>
          ))}
        </div>
      </header>

      {/* Search Input */}
      <div className="search-input-container">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-input-icon" />
            <Input
              type="text"
              placeholder="검색어를 입력하세요 (예: 지갑, 아이폰)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="search-content">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <Loader2 className="animate-spin" size={32} color="#10b981" />
            <p style={{ marginTop: '12px', color: '#6b7280' }}>검색 중...</p>
          </div>
        ) : !initialQuery ? (
          // Recent Searches (검색어가 없을 때)
          <div className="recent-searches">
            <div className="recent-searches-header">
              <h2>최근 검색어</h2>
              {recentSearches.length > 0 && (
                <button onClick={handleClearAll} className="clear-all-btn">
                  전체 삭제
                </button>
              )}
            </div>
            <div className="recent-searches-list">
              {recentSearches.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '20px' }}>최근 검색 내역이 없습니다.</p>
              ) : (
                recentSearches.map((query, index) => (
                  <div key={index} className="recent-search-item">
                    <button
                      onClick={() => handleSearchClick(query)}
                      className="recent-search-btn"
                    >
                      {query}
                    </button>
                    <button
                      onClick={() => handleRemoveSearch(query)}
                      className="remove-search-btn"
                    >
                      <X size={16} color="#9ca3af" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : results.length > 0 ? (
          // Search Results
          <div className="search-results">
            {results.map((item) => (
              <div
                key={item.id}
                className="search-result-item"
                onClick={() => navigate(`/items/${item.id}`)}
              >
                <div className="result-image" style={{ position: 'relative' }}>
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {item.isCompleted && (
                    <div style={{
                      position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '12px', zIndex: 1
                    }}>
                      완료됨
                    </div>
                  )}
                </div>
                <div className="result-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Badge
                      className={item.status === "lost" ? "badge-lost" : "badge-found"}
                      style={{
                        backgroundColor: item.status === "lost" ? "#ef4444" : "#10b981",
                        color: "white",
                        fontSize: '10px',
                        padding: '2px 6px',
                        height: 'auto'
                      }}
                    >
                      {item.status === "lost" ? "분실" : "습득"}
                    </Badge>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </h3>
                  </div>
                  
                  <div className="result-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            {item.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {formatDate(item.date)}
                        </span>
                    </div>
                    {item.points > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: 600 }}>
                        <Coins size={12} />
                        {item.points.toLocaleString()}P
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // No Results
          <div className="no-results">
            <div className="no-results-icon">
              <Package style={{ width: "3rem", height: "3rem", color: "#d1d5db" }} />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', marginTop: '1rem' }}>검색 결과가 없습니다</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>다른 검색어로 다시 시도해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}