import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Capacitor } from '@capacitor/core'; // [추가] 플랫폼 확인용
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Lock,
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
import { PushNotificationAlert } from './PushNotificationAlert'; // [추가] 알림 컴포넌트 임포트
import '../styles/settings-page.css';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const userInfo = getUserInfo();

  // 푸시 알림 Alert 표시 여부 상태
  const [showPushAlert, setShowPushAlert] = useState(false);

  const [notifications, setNotifications] = useState({
    push: false, // 초기값 false로 설정 (실제로는 로컬 스토리지나 설정값을 불러와야 함)
    email: true,
    sms: false,
    marketing: false
  });

  // [추가] 푸시 알림 토글 핸들러
  const handlePushToggle = (checked: boolean) => {
    // 1. 웹 브라우저 등 네이티브 앱이 아닌 경우 안내 메시지 표시
    if (checked && !Capacitor.isNativePlatform()) {
      alert("푸시 알림은 모바일 앱 환경에서만 설정할 수 있습니다.");
      return;
    }

    // 2. 켜는 경우: 권한 요청 Alert 띄우기
    if (checked) {
      setShowPushAlert(true);
    } else {
      // 3. 끄는 경우: 즉시 상태 변경 (실제 권한 해제는 OS 설정에서만 가능하므로 앱 내 상태만 변경)
      setNotifications({ ...notifications, push: false });
    }
  };

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃하시겠습니까?')) {
      clearTokens();
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // TODO: 실제 회원 탈퇴 API 호출 로직 추가 필요
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
            {/* 푸시 알림 (수정됨) */}
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
                  onChange={(e) => handlePushToggle(e.target.checked)} // 핸들러 연결
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

      {/* 푸시 알림 권한 요청 Alert 컴포넌트 */}
      <PushNotificationAlert 
        open={showPushAlert} 
        onOpenChange={setShowPushAlert}
        onPermissionGranted={() => setNotifications({ ...notifications, push: true })}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default SettingsPage;