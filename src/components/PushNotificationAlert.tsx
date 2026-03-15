import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from '../config'; // API 기본 주소 임포트
import { getValidAuthToken } from '../utils/auth'; // 로그인 토큰 임포트
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"; 

interface PushNotificationAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted?: () => void;
}

const PushNotificationAlert = ({
  open,
  onOpenChange,
  onPermissionGranted
}: PushNotificationAlertProps) => {
  const [alertType, setAlertType] = useState<'request' | 'denied'>('request');
  const [isChecking, setIsChecking] = useState(false);

  // 권한 확인 함수
  const checkPermission = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const status = await PushNotifications.checkPermissions();
      
      if (status.receive === 'denied') {
        setAlertType('denied');
      } else {
        setAlertType('request');
      }
    } catch (error) {
      console.error("Permission check failed:", error);
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (open) {
      checkPermission();
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!Capacitor.isNativePlatform()) {
      if (onPermissionGranted) onPermissionGranted();
      onOpenChange(false);
      return;
    }

    if (isChecking) return;
    setIsChecking(true);

    try {
      if (alertType === 'denied') {
        alert("설정 > 앱 > Find X > 알림 권한을 켜주세요.");
        onOpenChange(false);
      } else {
        const result = await PushNotifications.requestPermissions();
        
        if (result.receive === 'granted') {
          // 🚨 [추가된 핵심 로직] 중복 등록 방지를 위해 기존 리스너 초기화
          await PushNotifications.removeAllListeners();

          // ✅ 1. 기기 등록 성공 시 FCM 토큰을 받아오는 리스너
          PushNotifications.addListener('registration', async (token) => {
            console.log('✅ 발급된 기기 FCM 토큰:', token.value);
            
            try {
              // 백엔드로 토큰 전송 (Spring Boot 연동)
              const authToken = await getValidAuthToken();
              if (authToken) {
                const response = await fetch(`${API_BASE_URL}/user/fcm-token`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                  },
                  // 백엔드 API 명세에 맞춰 JSON 키값을 전달해주세요.
                  body: JSON.stringify({ token: token.value }), 
                });
                
                if (response.ok) {
                  console.log('✅ FCM 토큰 백엔드 저장 완료');
                } else {
                  console.error('❌ FCM 토큰 저장 실패 (서버 에러)');
                }
              }
            } catch (error) {
              console.error('❌ 백엔드 전송 중 오류 발생:', error);
            }
          });

          // ❌ 2. 기기 등록 실패 시 에러 처리
          PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ 푸시 등록 에러:', error);
            alert('기기를 알림 서버에 등록하지 못했습니다.');
          });

          // 3. 리스너 세팅 후 최종적으로 기기 등록 실행!
          await PushNotifications.register();
          
          if (onPermissionGranted) onPermissionGranted();
        }
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Push Error:", error);
      alert("알림 설정 중 오류가 발생했습니다. 앱을 완전히 종료 후 다시 시도해주세요.");
      onOpenChange(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alertType === 'denied' ? '알림 권한 필요' : '알림 설정'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {alertType === 'denied'
              ? '중요한 정보를 받으려면 설정에서 알림 권한을 허용해야 합니다.'
              : '새로운 메시지와 매칭 정보를 놓치지 않도록 푸시 알림을 켜시겠습니까?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isChecking}>
            {isChecking ? '처리 중...' : (alertType === 'denied' ? '확인' : '허용')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PushNotificationAlert;