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
} from "./ui/alert-dialog"; // 프로젝트의 UI 컴포넌트 경로

interface PushNotificationAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted?: () => void;
}

export function PushNotificationAlert({
  open,
  onOpenChange,
  onPermissionGranted
}: PushNotificationAlertProps) {
  const [alertType, setAlertType] = useState<'request' | 'denied'>('request');

  const checkPermission = async () => {
    if (!Capacitor.isNativePlatform()) return;

    const status = await PushNotifications.checkPermissions();
    if (status.receive === 'denied') {
      setAlertType('denied');
    } else {
      setAlertType('request');
    }
  };

  useEffect(() => {
    if (open) {
      checkPermission();
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!Capacitor.isNativePlatform()) {
      onOpenChange(false);
      return;
    }

    if (alertType === 'denied') {
      // 권한이 거부된 경우 설정 화면으로 이동 유도 (직접 이동은 OS 정책상 제한될 수 있음)
      // 안드로이드는 NativeSettings 플러그인 등이 필요할 수 있으나, 여기선 안내만 처리
      alert("휴대폰 설정 > 앱 > Find X > 알림에서 권한을 허용해주세요.");
      onOpenChange(false);
    } else {
      // 권한 요청
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        // 토큰 등록 등 후속 처리
        await PushNotifications.register();
        if (onPermissionGranted) onPermissionGranted();
      }
      onOpenChange(false);
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
              ? '중요한 소식을 받기 위해 알림 권한이 필요합니다. 설정에서 알림을 허용해주세요.'
              : '새로운 메시지와 매칭 정보를 놓치지 않도록 푸시 알림을 허용하시겠습니까?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {alertType === 'denied' ? '확인' : '허용'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}