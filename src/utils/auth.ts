const API_BASE_URL = 'https://treasurehunter.seohamin.com';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  exprTime?: number;
}

export type UserInfo = {
  id: string;
  nickname?: string;
  profileImage?: string;
  name?: string;
};

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

// 백엔드로부터 응답 본문의 토큰을 가져와 저장하는 함수
export const fetchAndStoreTokens = async (): Promise<AuthTokens | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Failed to fetch tokens. Status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.accessToken && data.refreshToken) {
      saveTokens(data.accessToken, data.refreshToken);

      console.log("✅ Tokens fetched successfully from response body:");
      console.log("🔑 Access Token:", data.accessToken);
      console.log("🔄 Refresh Token:", data.refreshToken);

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        exprTime: data.exprTime,
      };
    } else {
      console.error("Token data is missing in the response from /api/v1/auth/token");
      return null;
    }
  } catch (error) {
    console.error('Fetching tokens failed:', error);
    return null;
  }
};

/**
 * [FINAL] URL에서 얻은 userId를 사용하여 올바른 API로 사용자 정보를 가져오는 함수
 */
export const checkToken = async (userId: string): Promise<UserInfo | null> => {
  const tokens = getTokens();
  if (!tokens?.accessToken) {
    console.error("checkToken: No access token found in localStorage.");
    return null;
  }

  try {
    // 전달받은 userId를 사용해 올바른 API 경로로 요청합니다.
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
        console.error(`Failed to fetch user info. Status: ${response.status}`);
        if (response.status === 401) {
          const newTokens = await refreshAccessToken();
          if (newTokens) {
            return checkToken(userId); // 토큰 갱신 후 재시도
          }
        }
        return null;
    }

    const userInfo = await response.json();
    saveUserInfo(userInfo);
    console.log("✅ User info fetched and saved:", userInfo);
    return userInfo;
  } catch (error) {
    console.error('User info fetch failed:', error);
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

    if (!response.ok) {
      console.error('Token refresh request failed:', response.status);
      clearTokens();
      return null;
    }

    const data = await response.json();
    saveTokens(data.accessToken, data.refreshToken);
    console.log("✅ Tokens refreshed successfully.");

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
  console.log("UserID : nickname : profileImage", userId, nickname, profileImage);
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