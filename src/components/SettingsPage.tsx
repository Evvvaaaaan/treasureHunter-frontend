import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app'; // 네이티브 설정창 이동 및 앱 상태 감지용
import { PushNotifications } from '@capacitor/push-notifications'; // 실제 푸시 권한 감지용
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Info,
  ChevronRight,
  Shield,
  HelpCircle,
  FileText,
  Trash2,
  LogOut
} from 'lucide-react';
import { useTheme } from '../utils/theme';
import { deleteUser, getUserInfo, clearTokens } from '../utils/auth';
import BottomNavigation from './BottomNavigation';
import PushNotificationAlert from './PushNotificationAlert'; 
import '../styles/settings-page.css';
import { Dialog } from "@capacitor/dialog";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [showPushAlert, setShowPushAlert] = useState(false);
  const [notifications, setNotifications] = useState({ push: false });

  // 현재 푸시 권한 상태를 기기에서 직접 체크하는 함수
  const checkPushPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await PushNotifications.checkPermissions();
        const isGranted = status.receive === 'granted';
        setNotifications({ push: isGranted });
        localStorage.setItem('setting_push', String(isGranted));
      } catch (e) {
        console.error('푸시 권한 상태 확인 오류:', e);
      }
    } else {
      const savedPush = localStorage.getItem('setting_push') === 'true';
      setNotifications({ push: savedPush });
    }
  };

  useEffect(() => {
    // 1. 처음 페이지 렌더링 시 권한 체크
    checkPushPermission();

    // 2. 유저가 '설정창'에 다녀왔을 때(앱이 다시 화면에 뜰 때) 권한 상태를 실시간으로 새로고침
    let appStateListener: any;
    if (Capacitor.isNativePlatform()) {
      appStateListener = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          checkPushPermission();
        }
      });
    }

    return () => {
      if (appStateListener) {
        appStateListener.then((listener: any) => listener.remove());
      }
    };
  }, []);

  // 설정 버튼을 눌렀을 때의 핸들러
  const handlePushToggle = async (checked: boolean) => {
    if (!Capacitor.isNativePlatform()) {
      await Dialog.alert({ title: '알림', message: "푸시 알림은 모바일 앱 환경에서만 설정할 수 있습니다." });
      return;
    }

    const status = await PushNotifications.checkPermissions();

    if (checked) {
      // 1. 알림을 켜려고 할 때
      if (status.receive === 'prompt') {
        setShowPushAlert(true);
      } else if (status.receive === 'denied') {
        if ((await Dialog.confirm({ title: '알림', message: "기기 설정에서 푸시 알림이 차단되어 있습니다. 설정 페이지로 이동하시겠습니까?" })).value) {
          // 🚨 수정된 부분: 기기별 설정창 열기
          await NativeSettings.open({
            optionAndroid: AndroidSettings.ApplicationDetails,
            optionIOS: IOSSettings.App
          });
        }
      }
    } else {
      // 2. 알림을 끄려고 할 때
      if ((await Dialog.confirm({ title: '알림', message: "푸시 알림을 끄려면 기기의 '설정'에서 직접 변경해야 합니다. 기기 설정으로 이동하시겠습니까?" })).value) {
        // 🚨 수정된 부분: 기기별 설정창 열기
        await NativeSettings.open({
          optionAndroid: AndroidSettings.ApplicationDetails,
          optionIOS: IOSSettings.App
        });
      }
    }
  };

  const updatePushState = (isEnabled: boolean) => {
    setNotifications({ push: isEnabled });
    localStorage.setItem('setting_push', String(isEnabled));
  };

  const handleLogout = async () => {
    if ((await Dialog.confirm({ title: '알림', message: '정말 로그아웃하시겠습니까?' })).value) {
      clearTokens();
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if ((await Dialog.confirm({ title: '알림', message: '정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.' })).value) {
      try {
        const userInfo = getUserInfo();
        if (!userInfo) {
          await Dialog.alert({ title: '알림', message: '사용자 정보를 찾을 수 없습니다.' });
          return;
        }

        const success = await deleteUser(String(userInfo.id));

        if (success) {
          await Dialog.alert({ title: '알림', message: '회원 탈퇴가 완료되었습니다.' });
          clearTokens();
          navigate('/login');
        } else {
          await Dialog.alert({ title: '알림', message: '회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.' });
        }
      } catch (error) {
        console.error('회원 탈퇴 중 오류 발생:', error);
        await Dialog.alert({ title: '알림', message: '알 수 없는 오류가 발생했습니다.' });
      }
    }
  };

  return (
    <div className={`settings-page ${theme}`}>
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
          <div style={{ width: '40px' }} />
        </div>
      </div>

      <div className="settings-content">
        {/* 외관 설정 */}
        <section className="settings-section">
          <h2 className="section-title">외관</h2>
          <div className="settings-list">
            <button className="setting-item" onClick={toggleTheme}>
              <div className="setting-left">
                {theme === 'dark' ? <Moon size={20} className="setting-icon" /> : <Sun size={20} className="setting-icon" />}
                <div className="setting-info">
                  <div className="setting-label">테마</div>
                  <div className="setting-description">{theme === 'dark' ? '다크 모드' : '라이트 모드'}</div>
                </div>
              </div>
              <ChevronRight size={20} className="chevron" />
            </button>
          </div>
        </section>

        {/* 알림 설정 (SMS 삭제 완료) */}
        <section className="settings-section">
          <h2 className="section-title">알림</h2>
          <div className="settings-list">
            <div className="setting-item" onClick={() => handlePushToggle(!notifications.push)} style={{ cursor: 'pointer' }}>
              <div className="setting-left">
                <Bell size={20} className="setting-icon" />
                <div className="setting-info">
                  <div className="setting-label">푸시 알림</div>
                  <div className="setting-description">중요한 알림 받기</div>
                </div>
              </div>
              <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => handlePushToggle(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        {/* 정보 및 보안 */}
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
                  <div className="setting-label">고객센터 / 도움말</div>
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