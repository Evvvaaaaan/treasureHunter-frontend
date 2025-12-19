// public/firebase-messaging-sw.js

// 서비스 워커에 Firebase 라이브러리 import (버전은 호환성에 맞게 조정)
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyAQ6IObd2vmW1FTsGzKxgN57vxiEYL0Afk", // 본인의 설정값 확인
  authDomain: "treasruehunter.firebaseapp.com",
  projectId: "treasruehunter",
  storageBucket: "treasruehunter.firebasestorage.app",
  messagingSenderId: "97393197228",
  appId: "1:97393197228:web:d8aefed3fb8fea18fc5f09",
};
// 백그라운드용 앱 초기화
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 핸들링 (옵션)
// 알림의 모양을 커스텀하거나 로직을 추가할 때 사용합니다.
messaging.onBackgroundMessage((payload) => {
  console.log("백그라운드 메시지 수신:", payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './placeholder.png', // 알림 아이콘 경로
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});