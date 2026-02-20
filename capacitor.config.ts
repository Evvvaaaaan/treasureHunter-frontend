import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.junsun.treasurehunter',
  appName: 'Find X',
  // Firebase test 시, build, 이외 dist 사용. 
  webDir: 'dist',
  server: {
  //   url: 'http://192.168.0.208:51845',
  //   cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      
      // 👇 [중요 1] 여기에 "Web Client ID"를 넣어야 합니다. (e8i0...naq3)
      serverClientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com',

      // 👇 [중요 2] 여기에 "iOS Client ID"를 넣어야 합니다. (2o2f...gf87o)
      iosClientId: '272231760809-2o2f5jbkhvj9kcqor4mihkpch70gf87o.apps.googleusercontent.com',
      
      androidClientId: '272231760809-dersr8o6inp390l8d3n4fu3viga3nq5e.apps.googleusercontent.com',

      // ⭐ [가장 중요] 이 줄이 없으면 serverAuthCode가 절대 안 옵니다!
      forceCodeForRefreshToken: true, 
    },
  },
  ios: {
    allowsBackForwardNavigationGestures: true,
  } as any,
};

export default config;


