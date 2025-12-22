// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: "AIzaSyAQ6IObd2vmW1FTsGzKxgN57vxiEYL0Afk",
  authDomain: "treasruehunter.firebaseapp.com",
  projectId: "treasruehunter",
  storageBucket: "treasruehunter.firebasestorage.app",
  messagingSenderId: "97393197228",
  appId: "1:97393197228:web:d8aefed3fb8fea18fc5f09",
  measurementId: "G-KF66R16650"
};

// 1. Firebase 앱 초기화 & 내보내기 (export)
export const firebaseApp = initializeApp(firebaseConfig);
export const analytics = getAnalytics(firebaseApp);

// 2. 메시징(FCM) 객체 초기화 & 내보내기
// Native(iOS/Android) 환경에서는 JS SDK Messaging(Service Worker 의존)을 사용하지 않도록 예외 처리
let messagingInstance: any = null;

try {
  // Capacitor Native 플랫폼이 아닌 경우에만 Firebase Messaging 초기화 시도
  if (!Capacitor.isNativePlatform()) {
    messagingInstance = getMessaging(firebaseApp);
  }
} catch (err) {
  console.warn("Firebase Messaging initialization skipped or failed:", err);
}

export const messaging = messagingInstance;

// 3. 알림 권한 요청 및 토큰 획득 함수
export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // 주의: VAPID Key는 Firebase Console -> 프로젝트 설정 -> 클라우드 메시징 -> 웹 구성에서 발급받은 키 쌍을 넣어야 합니다.
      if (messaging) {
        const token = await getToken(messaging, {
          vapidKey: "BHqbTetpyaeTZWd0e-qLkuuAqzi0sC-i7VDLJaVVSlHvspJthcQsj9DGIYvzNVR-u40a91H6umQbUooRZJ5b5pw"
        });
        console.log("FCM Token:", token);
        return token;
      }
      return null;
    } else {
      console.log("알림 권한 거부됨");
      return null;
    }
  } catch (error) {
    console.error("FCM 토큰 발급 에러:", error);
    return null;
  }
};

// 4. 포그라운드 메시지 수신 리스너
export const onMessageListener = () =>
  new Promise<MessagePayload>((resolve) => { // 👈 여기가 핵심입니다!
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("메시지 수신:", payload);
        resolve(payload);
      });
    }
  });