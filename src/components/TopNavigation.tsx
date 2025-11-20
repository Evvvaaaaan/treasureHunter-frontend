import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ThemeToggle from './ThemeToggle';
import '../styles/top-navigation.css';

interface TopNavigationProps {
  showSearch?: boolean;
  title?: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  showSearch = true, 
  title 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = !!localStorage.getItem('auth_token');

  // Determine page title if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    if (path === '/home') return '보물찾기';
    if (path === '/map') return '지도';
    if (path === '/store') return '스토어';
    if (path === '/profile') return '프로필';
    return '보물찾기';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchBar(false);
      setSearchQuery('');
    }
  };

  const notifications = [
    { id: 1, unread: true }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <nav className="top-navigation">
        <div className="nav-content">
          {/* Left Section */}
          <div className="nav-left">
            <button 
              className="nav-icon-btn mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <motion.button 
              className="nav-logo"
              onClick={() => navigate('/home')}
              whileTap={{ scale: 0.95 }}
            >
              <span className="logo-icon">🔍</span>
              <span className="logo-text">{getPageTitle()}</span>
            </motion.button>
          </div>

          {/* Right Section */}
          <div className="nav-right">
            <ThemeToggle />

            {showSearch && (
              <motion.button 
                className="nav-icon-btn"
                onClick={() => setShowSearchBar(!showSearchBar)}
                whileTap={{ scale: 0.92 }}
              >
                <Search size={20} />
              </motion.button>
            )}

            {isAuthenticated && (
              <motion.button 
                className="nav-icon-btn notification-btn"
                onClick={() => navigate('/notifications')}
                whileTap={{ scale: 0.92 }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </motion.button>
            )}

            <motion.button 
              className="nav-profile-btn"
              onClick={() => isAuthenticated ? navigate('/profile') : navigate('/login')}
              whileTap={{ scale: 0.92 }}
            >
              {user?.profile_image ? (
                <img src={user.profile_image} alt="프로필" />
              ) : (
                <div className="profile-placeholder">
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearchBar && (
            <motion.div 
              className="search-bar-container"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <form onSubmit={handleSearch} className="search-form">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="분실물이나 습득물을 검색하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="search-input"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    className="search-clear"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              className="mobile-menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div 
              className="mobile-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="mobile-menu-header">
                <div className="mobile-menu-profile">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt="프로필" />
                  ) : (
                    <div className="profile-placeholder-large">
                      {user?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="mobile-menu-user-info">
                    <p className="user-name">{user?.name || '게스트'}</p>
                    <p className="user-email">{user?.email || '로그인이 필요합니다'}</p>
                  </div>
                </div>
              </div>

              <div className="mobile-menu-items">
                <button onClick={() => { navigate('/home'); setShowMobileMenu(false); }}>
                  🏠 홈
                </button>
                <button onClick={() => { navigate('/map'); setShowMobileMenu(false); }}>
                  🗺️ 지도
                </button>
                <button onClick={() => { navigate('/store'); setShowMobileMenu(false); }}>
                  🛍️ 스토어
                </button>
                <button onClick={() => { navigate('/profile'); setShowMobileMenu(false); }}>
                  👤 프로필
                </button>
                
                {isAuthenticated ? (
                  <>
                    <div className="menu-divider" />
                    <button onClick={() => { navigate('/settings'); setShowMobileMenu(false); }}>
                      ⚙️ 설정
                    </button>
                    <button 
                      onClick={() => { 
                        localStorage.clear(); 
                        navigate('/login'); 
                        setShowMobileMenu(false); 
                      }}
                      className="logout-btn"
                    >
                      🚪 로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <div className="menu-divider" />
                    <button onClick={() => { navigate('/login'); setShowMobileMenu(false); }}>
                      🔐 로그인
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopNavigation;
