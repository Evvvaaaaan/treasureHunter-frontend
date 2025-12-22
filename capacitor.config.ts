// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.junsun.treasurehunter',
  appName: 'treasure',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '272231760809-2o2f5jbkhvj9kcqor4mihkpch70gf87o.apps.googleusercontent.com', // Web Client ID
      iosClientId: '272231760809-2o2f5jbkhvj9kcqor4mihkpch70gf87o.apps.googleusercontent.com', // iOS Client ID (same as Client ID part)
      forceCodeForRefreshToken: true,
    },
  }, // Vite의 기본 빌드 폴더명
  // server: {
  //   androidScheme: 'https',
  //   url: 'http://192.168.0.208:5173', 
  //   cleartext: true
  // }
};

export default config;