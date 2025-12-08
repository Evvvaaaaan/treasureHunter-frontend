// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'treasure',
  webDir: 'dist', // Vite의 기본 빌드 폴더명
  server: {
    androidScheme: 'https'
  }
};

export default config;