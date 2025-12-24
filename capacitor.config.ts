import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.junsun.treasurehunter',
  appName: 'Treasure Hunter',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      
      // 👇 [중요 1] 여기에 "Web Client ID"를 넣어야 합니다. (e8i0...naq3)
      serverClientId: '272231760809-e8i08dnkevi90oo457mh7vapa2l1naq3.apps.googleusercontent.com',
      
      // 👇 [중요 2] 여기에 "iOS Client ID"를 넣어야 합니다. (2o2f...gf87o)
      iosClientId: '272231760809-2o2f5jbkhvj9kcqor4mihkpch70gf87o.apps.googleusercontent.com',
      
      // ⭐ [가장 중요] 이 줄이 없으면 serverAuthCode가 절대 안 옵니다!
      forceCodeForRefreshToken: true, 
    },
  },
};

export default config;