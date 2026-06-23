/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_CLAUDE_API_KEY: string;
  readonly VITE_GROQ_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google: typeof google;
}

// [추가] Web OTP API 전역 타입 선언
interface CredentialRequestOptions {
  otp?: {
    transport: string[];
  };
}

// [추가] OTPCredential 인터페이스 정의
interface OTPCredential extends Credential {
  code: string;
}