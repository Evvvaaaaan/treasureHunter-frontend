import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
// import { Capacitor } from '@capacitor/core';
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Info,
  ChevronRight,
  Smartphone,
  Shield,
  HelpCircle,
  FileText,
  Trash2,
  LogOut
} from 'lucide-react';
import { useTheme } from '../utils/theme';
import { clearTokens } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
// 👇 이 컴포넌트가 반드시 같은 폴더(src/components/)에 있어야 합니다.
import PushNotificationAlert from './PushNotificationAlert'; 
import '../styles/settings-page.css';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // 푸시 알림 권한 요청 팝업 상태
  const [showPushAlert, setShowPushAlert] = useState(false);

  // 알림 설정 상태 (실제 앱에서는 로컬 스토리지나 서버에서 불러와야 함)
  const [notifications, setNotifications] = useState({
    push: false,
    sms: false,
    marketing: false
  });

  // 로컬 스토리지에서 초기 설정 불러오기 (예시)
  useEffect(() => {
    const savedPush = localStorage.getItem('setting_push') === 'true';
    setNotifications(prev => ({ ...prev, push: savedPush }));
  }, []);

  // 푸시 알림 토글 핸들러
  // const handlePushToggle = (checked: boolean) => {
  //   // 1. 웹 브라우저 등 네이티브 앱이 아닌 경우 안내
  //   if (checked && !Capacitor.isNativePlatform()) {
  //     alert("푸시 알림은 모바일 앱 환경에서만 설정할 수 있습니다.");
  //     return;
  //   }

  //   // 2. 켜는 경우: 권한 요청 팝업 띄우기 (여기서 오류가 발생하지 않도록 showPushAlert true 설정)
  //   if (checked) {
  //     setShowPushAlert(true);
  //   } else {
  //     // 3. 끄는 경우: 즉시 상태 변경
  //     updatePushState(false);
  //   }
  // };

  // 상태 업데이트 및 로컬 스토리지 저장 헬퍼 함수
  const updatePushState = (isEnabled: boolean) => {
    setNotifications(prev => ({ ...prev, push: isEnabled }));
    localStorage.setItem('setting_push', String(isEnabled));
  };

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃하시겠습니까?')) {
      clearTokens();
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // TODO: 서버에 회원 탈퇴 API 호출 필요
      clearTokens();
      navigate('/login');
    }
  };

  return (
    <div className={`settings-page ${theme}`}>
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
          <div style={{ width: '40px' }} /> {/* 중앙 정렬을 위한 Spacer */}
        </div>
      </div>

      <div className="settings-content">
        {/* 1. 외관 설정 */}
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

        {/* 2. 알림 설정 */}
        <section className="settings-section">
          <h2 className="section-title">알림</h2>
          <div className="settings-list">
            {/* 푸시 알림 */}
            <div className="setting-item">
              <div className="setting-left">
                <Bell size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">푸시 알림</div>
                  <div className="setting-description">중요한 알림 받기</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  // onChange={(e) => handlePushToggle(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* SMS 알림 */}
            <div className="setting-item">
              <div className="setting-left">
                <Smartphone size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">SMS 알림</div>
                  <div className="setting-description">문자 메시지로 받기</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        {/* 3. 정보 및 보안 */}
        <section className="settings-section">
          <h2 className="section-title">정보 및 보안</h2>
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

            <button className="setting-item" onClick={() => navigate('/terms')}>
              <div className="setting-left">
                <FileText size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">이용약관</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </section>

        {/* 4. 앱 정보 */}
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
                  <div className="setting-label">고객센터 / 도움말</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </section>

        {/* 5. 계정 관리 */}
        <section className="settings-section">
          <h2 className="section-title">계정 관리</h2>
          <div className="settings-list">
            <button className="setting-item logout-item" onClick={handleLogout}>
              <div className="setting-left">
                <LogOut size={20} className="setting-icon" />
                <span className="setting-label">로그아웃</span>
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
      </div>

      {/* ✅ [핵심] 푸시 알림 권한 요청 Alert 
        이 컴포넌트가 없으면 앱이 멈춥니다. 
      */}
      <PushNotificationAlert
        open={showPushAlert}
        onOpenChange={setShowPushAlert}
        onPermissionGranted={() => updatePushState(true)}
      />

      <BottomNavigation />
    </div>
  );
};

export default SettingsPage;