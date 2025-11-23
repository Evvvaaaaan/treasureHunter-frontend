import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, TrendingUp, Clock, Heart, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
// [추가] 인증 및 API 유틸리티 import
import { getValidAuthToken, checkToken, getUserInfo } from '../utils/auth';
import '../styles/store-page.css';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  category: string;
  stock: number;
  isLimited: boolean;
  limitedEndTime?: string;
  rating: number;
  reviewCount: number;
  tags: string[];
}

interface CartItem {
  productId: string;
  quantity: number;
}

// [추가] API 기본 URL 설정
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

const StorePage: React.FC = () => {
  const navigate = useNavigate();

  const [currentPoints, setCurrentPoints] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // 초기값 빈 배열
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ['전체', '생활용품', '디지털', '푸드', '문화', '교통', '한정상품', '기부'];

  // 초기 데이터 로딩
  useEffect(() => {
    const initStore = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserPoints(), fetchProducts()]);
      setIsLoading(false);
    };
    initStore();
  }, []);

  // 필터링은 로컬 데이터 기준으로 수행 (API에서 필터링을 지원하면 API 호출로 변경 가능)
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === '전체' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 1. 사용자 포인트 가져오기 (실제 연동)
  const fetchUserPoints = async () => {
    try {
      const localUserInfo = getUserInfo();
      if (localUserInfo) {
        // 최신 정보 갱신 (포인트 포함)
        const freshInfo = await checkToken(localUserInfo.id.toString());
        if (freshInfo) {
          setCurrentPoints(freshInfo.point);
        }
      }
    } catch (err) {
      console.error("포인트 정보 로딩 실패:", err);
    }
  };

  // 2. 상품 목록 가져오기 (API 연동)
  const fetchProducts = async () => {
    try {
      const token = await getValidAuthToken();
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // [질문 1] 상품 목록 API 엔드포인트가 무엇인가요? (임시: /products)
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        // 404면 API가 없는 것이므로 Mock 데이터 사용 (개발 편의용)
        if (response.status === 404) {
          console.warn("상품 API를 찾을 수 없어 테스트 데이터를 사용합니다.");
          setProducts(MOCK_PRODUCTS); // 하단에 정의된 Mock 데이터 사용
          return;
        }
        throw new Error(`상품을 불러오는데 실패했습니다. (${response.status})`);
      }

      const data = await response.json();
      // 데이터 구조에 맞춰 수정 필요 (예: data.products 또는 data)
      setProducts(Array.isArray(data) ? data : data.products || []);

    } catch (err) {
      console.error("상품 로딩 실패:", err);
      setError("상품 정보를 불러올 수 없습니다.");
      setProducts(MOCK_PRODUCTS); // 에러 시 테스트 데이터 폴백
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    // [추가 가능] 위시리스트 API 연동
  };

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = '장바구니에 추가되었습니다!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
    // [추가 가능] 장바구니 API 연동
  };

  const getTotalCartItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalCartPoints = () => {
    return cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const getRemainingTime = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return '종료';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}시간 ${minutes}분`;
  };

  return (
    <div className="store-page">
      {/* Header */}
      <div className="store-header">
        <div className="header-top">
          <h1>포인트 스토어</h1>
          <button 
            className="cart-button"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={24} />
            {getTotalCartItems() > 0 && (
              <span className="cart-badge">{getTotalCartItems()}</span>
            )}
          </button>
        </div>

        {/* Points Display */}
        <div className="points-card">
          <div className="points-info">
            <p className="points-label">보유 포인트</p>
            <p className="points-value">{currentPoints.toLocaleString()}P</p>
          </div>
          <button className="points-history-btn" onClick={() => navigate('/points-history')}>
            <TrendingUp size={16} />
            내역
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="상품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="categories-scroll">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="products-container">
        {isLoading ? (
          <div className="loading-container" style={{display: 'flex', justifyContent: 'center', padding: '2rem'}}>
            <Loader2 className="loading-spinner" style={{animation: 'spin 1s linear infinite'}} />
          </div>
        ) : error && products.length === 0 ? (
          <div className="error-container" style={{textAlign: 'center', padding: '2rem', color: 'red'}}>
            <AlertCircle style={{margin: '0 auto 0.5rem'}} />
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                {product.isLimited && product.limitedEndTime && (
                  <div className="limited-badge">
                    <Clock size={12} />
                    {getRemainingTime(product.limitedEndTime)}
                  </div>
                )}

                <button
                  className={`wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}`}
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart size={20} fill={wishlist.includes(product.id) ? '#ef4444' : 'none'} />
                </button>

                <div 
                  className="product-image"
                  onClick={() => navigate(`/store/product/${product.id}`)}
                >
                  <img src={product.image} alt={product.name} />
                </div>

                <div className="product-info">
                  <div className="product-tags">
                    {product.tags.map((tag, idx) => (
                      <span key={idx} className="product-tag">{tag}</span>
                    ))}
                  </div>

                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>

                  <div className="product-rating">
                    <span className="rating-stars">⭐ {product.rating}</span>
                    <span className="rating-count">({product.reviewCount})</span>
                  </div>

                  <div className="product-footer">
                    <div className="product-price">
                      {product.discount > 0 && (
                        <>
                          <span className="discount-badge">{product.discount}%</span>
                          <span className="original-price">{product.originalPrice.toLocaleString()}P</span>
                        </>
                      )}
                      <span className="current-price">{product.price.toLocaleString()}P</span>
                    </div>

                    <button
                      className="add-to-cart-btn"
                      onClick={() => addToCart(product.id)}
                      disabled={currentPoints < product.price}
                    >
                      담기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Summary */}
      {getTotalCartItems() > 0 && (
        <div className="floating-cart" onClick={() => navigate('/cart')}>
          <div className="cart-summary">
            <ShoppingCart size={20} />
            <span>{getTotalCartItems()}개 상품</span>
          </div>
          <div className="cart-total">
            <span>{getTotalCartPoints().toLocaleString()}P</span>
            <ChevronRight size={20} />
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

// 백엔드 API가 준비되지 않았을 때를 대비한 Mock Data
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '스타벅스 아메리카노',
    description: '스타벅스 아메리카노 Tall 사이즈 쿠폰',
    price: 4500,
    originalPrice: 4900,
    discount: 8,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    category: '푸드',
    stock: 100,
    isLimited: false,
    rating: 4.8,
    reviewCount: 1234,
    tags: ['인기', '베스트']
  },
  // ... 나머지 데이터 유지
];

export default StorePage;