import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Lock,
  Globe,
  Info,
  ChevronRight,
  Smartphone,
  Mail,
  Shield,
  HelpCircle,
  FileText,
  Trash2,
  LogOut
} from 'lucide-react';
import { useTheme } from '../utils/theme';
import { getUserInfo, clearTokens } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
import '../styles/settings-page.css';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const userInfo = getUserInfo();

  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    marketing: false
  });

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃하시겠습니까?')) {
      clearTokens();
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // TODO: Implement account deletion
      clearTokens();
      navigate('/login');
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div className="header-container">
          <motion.button
            className="back-btn"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1>설정</h1>
          <div style={{ width: '40px' }} /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="settings-content">
        {/* 외관 */}
        <section className="settings-section">
          <h2 className="section-title">외관</h2>
          <div className="settings-list">
            <button className="setting-item" onClick={toggleTheme}>
              <div className="setting-left">
                {theme === 'dark' ? (
                  <Moon size={20} className="setting-icon" />
                ) : (
                  <Sun size={20} className="setting-icon" />
                )}
                <div className="setting-info">
                  <div className="setting-label">테마</div>
                  <div className="setting-description">
                    {theme === 'dark' ? '다크 모드' : '라이트 모드'}
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </section>

        {/* 알림 설정 */}
        <section className="settings-section">
          <h2 className="section-title">알림</h2>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-left">
                <Bell size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">푸시 알림</div>
                  <div className="setting-description">새로운 매칭 및 메시지 알림</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) =>
                    setNotifications({ ...notifications, push: e.target.checked })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-left">
                <Mail size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">이메일 알림</div>
                  <div className="setting-description">중요한 업데이트 수신</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({ ...notifications, email: e.target.checked })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-left">
                <Smartphone size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">SMS 알림</div>
                  <div className="setting-description">SMS로 알림 받기</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) =>
                    setNotifications({ ...notifications, sms: e.target.checked })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-left">
                <Bell size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">마케팅 알림</div>
                  <div className="setting-description">이벤트 및 프로모션</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.marketing}
                  onChange={(e) =>
                    setNotifications({ ...notifications, marketing: e.target.checked })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        {/* 개인정보 및 보안 */}
        <section className="settings-section">
          <h2 className="section-title">개인정보 및 보안</h2>
          <div className="settings-list">
            <button className="setting-item" onClick={() => navigate('/change-password')}>
              <div className="setting-left">
                <Lock size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">비밀번호 변경</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>

            <button className="setting-item" onClick={() => navigate('/privacy')}>
              <div className="setting-left">
                <Shield size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">개인정보 처리방침</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </section>

        {/* 앱 정보 */}
        <section className="settings-section">
          <h2 className="section-title">앱 정보</h2>
          <div className="settings-list">
            <button className="setting-item" onClick={() => navigate('/about')}>
              <div className="setting-left">
                <Info size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">앱 정보</div>
                  <div className="setting-description">버전 1.0.0</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>

            <button className="setting-item" onClick={() => navigate('/help')}>
              <div className="setting-left">
                <HelpCircle size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">도움말</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>

            <button className="setting-item" onClick={() => navigate('/terms')}>
              <div className="setting-left">
                <FileText size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">이용약관</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>

            <button className="setting-item" onClick={() => navigate('/licenses')}>
              <div className="setting-left">
                <FileText size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">오픈소스 라이선스</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </section>

        {/* 계정 관리 */}
        <section className="settings-section">
          <h2 className="section-title">계정 관리</h2>
          <div className="settings-list">
            <button className="setting-item logout-item" onClick={handleLogout}>
              <div className="setting-left">
                <LogOut size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">로그아웃</div>
                </div>
              </div>
            </button>

            <button className="setting-item danger-item" onClick={handleDeleteAccount}>
              <div className="setting-left">
                <Trash2 size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">계정 삭제</div>
                  <div className="setting-description">모든 데이터가 삭제됩니다</div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* User Info */}
        {userInfo && (
          <div className="user-info-section">
            <p className="user-info-text">
              {userInfo.email}
            </p>
            <p className="user-info-text secondary">
              가입일: {new Date().toLocaleDateString('ko-KR')}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default SettingsPage;
