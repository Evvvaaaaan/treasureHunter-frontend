// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.junsun.treasurehunter',
  appName: 'treasure',
  webDir: 'dist', // Vite의 기본 빌드 폴더명
  // server: {
  //   androidScheme: 'https',
  //   url: 'http://192.168.0.208:5173', 
  //   cleartext: true
  // }
};

export default config;