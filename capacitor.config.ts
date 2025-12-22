// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.junsun.treasurehunter',
  appName: 'Treasure Hunter',
  webDir: 'dist',
  plugins: {
    SocialLogin: {
      google: {
        webClientId: '272231760809-e8i08dnkevi90oo457mh7vapa2l1naq3.apps.googleusercontent.com',
        iosClientId: '272231760809-2o2f5jbkhvj9kcqor4mihkpch70gf87o.apps.googleusercontent.com',
        forceCodeForRefreshToken: true,
      },
    },
    CapacitorHttp: {
      enabled: true,
    },
  }, // Vite의 기본 빌드 폴더명
  // server: {
  //   androidScheme: 'https',
  //   url: 'http://192.168.0.208:5173', 
  //   cleartext: true
  // }
};

export default config;

