import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
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
      // 1. 여기서 멈추면 플러그인 설치가 안 된 것
      const status = await PushNotifications.checkPermissions();
      
      if (status.receive === 'denied') {
        setAlertType('denied');
      } else {
        setAlertType('request');
      }
    } catch (error) {
      console.error("Permission check failed:", error);
      // 에러 발생 시 그냥 닫아버려서 앱 멈춤 방지
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
      // 웹에서는 그냥 성공 처리
      if (onPermissionGranted) onPermissionGranted();
      onOpenChange(false);
      return;
    }

    // 중복 클릭 방지
    if (isChecking) return;
    setIsChecking(true);

    try {
      if (alertType === 'denied') {
        alert("설정 > 앱 > Find X > 알림 권한을 켜주세요.");
        onOpenChange(false);
      } else {
        // 2. 여기서 멈추면 Xcode Capability 누락된 것
        const result = await PushNotifications.requestPermissions();
        
        if (result.receive === 'granted') {
          // 3. 여기서 멈추면 AppDelegate 설정 누락된 것
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