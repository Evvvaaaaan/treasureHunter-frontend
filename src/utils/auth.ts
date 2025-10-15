const API_BASE_URL = 'https://treasurehunter.seohamin.com';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  exprTime?: number;
}

export interface UserInfo {
  id: string;
  nickname?: string;
  profileImage?: string;
  name?: string;
}

// 토큰을 로컬 스토리지에 저장
export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// 토큰을 로컬 스토리지에서 가져오기
export const getTokens = (): AuthTokens | null => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken || !refreshToken) return null;
  
  return { accessToken, refreshToken };
};

// 토큰 삭제
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
};

// 사용자 정보 저장
export const saveUserInfo = (userInfo: UserInfo) => {
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
};

// 사용자 정보 가져오기
export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return null;
  
  try {
    return JSON.parse(userInfoStr);
  } catch {
    return null;
  }
};

// 토큰 확인 API 호출
export const checkToken = async (): Promise<UserInfo | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
      credentials: 'include',
    });
    
    if (!response.ok) return null;
    
    const userInfo = await response.json();
    saveUserInfo(userInfo);
    return userInfo;
  } catch (error) {
    console.error('Token check failed:', error);
    return null;
  }
};

// 토큰 갱신 API 호출
export const refreshAccessToken = async (): Promise<AuthTokens | null> => {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: tokens.refreshToken,
      }),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    saveTokens(data.accessToken, data.refreshToken);
    
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      exprTime: data.exprTime,
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

// 회원가입 API 호출
export const signupUser = async (
  userId: string,
  nickname: string,
  profileImage: string,
  name: string
): Promise<boolean> => {
  const tokens = getTokens();
  if (!tokens?.accessToken) return false;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({
        nickname,
        profileImage,
        name,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Signup failed:', error);
    return false;
  }
};

// OAuth 로그인 URL
export const getOAuthUrl = (provider: 'google' | 'kakao' | 'naver'): string => {
  return `${API_BASE_URL}/oauth2/authorization/${provider}`;
};

// 쿠키에서 토큰 파싱 (OAuth 리다이렉트 후)
export const parseTokensFromCookies = (): AuthTokens | null => {
  const cookies = document.cookie.split(';');
  let accessToken = '';
  let refreshToken = '';
  
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'ACCESS_TOKEN') {
      accessToken = value;
    } else if (key === 'REFRESH_TOKEN') {
      refreshToken = value;
    }
  }
  
  if (accessToken && refreshToken) {
    saveTokens(accessToken, refreshToken);
    // 쿠키 삭제
    document.cookie = 'ACCESS_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'REFRESH_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    return { accessToken, refreshToken };
  }
  
  return null;
};
