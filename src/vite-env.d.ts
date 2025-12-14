/// <reference types="vite/client" />

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