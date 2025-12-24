import { CapacitorHttp } from "@capacitor/core";

// [MODIFIED] Added API_BASE_URL constant
const API_BASE_URL = 'https://treasurehunter.seohamin.com';

// --- 상세 UserInfo 타입 정의 ---
// ... (Your existing interfaces: ReviewAuthor, ReceivedReview, MyReview, Post, BlockedUser, UserOauth2Account) ...
// 리뷰 작성자 정보
interface ReviewAuthor {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
}

// 받은 리뷰 정보
interface ReceivedReview {
  id: number;
  author?: ReviewAuthor; // 익명일 수 있음
  title: string;
  content: string;
  score: number;
  images: string[];
}

// 내가 쓴 리뷰 정보
interface MyReview {
  id: number;
  title: string;
  content: string;
  score: number;
  images: string[];
}

// 게시물 정보 (API 응답 기준, HomePage.tsx와 일치시킴)
interface Post {
  id: number;
  title: string;
  content: string;
  type: 'lost' | 'found';
  author?: ReviewAuthor; // API 응답에 author가 포함될 수 있음
  images: string[]; // HomePage.tsx에서 imageUrls 대신 images 사용
  setPoint: number;
  itemCategory: string; // HomePage.tsx 인터페이스와 일치
  lat: number;
  lon: number;
  lostAt: string;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  isCompleted: boolean;
}

// 차단한 유저 정보
interface BlockedUser {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
}

// 연동된 소셜 계정 정보
interface UserOauth2Account {
  id: number;
  userId: number;
  userRole: string;
  provider: string;
  providerUserId: string;
  email: string;
  name: string;
  profileImage: string;
  linkedAt: string;
}

// 메인 사용자 정보 타입 (export 추가)
export interface UserInfo {
  id: number; // number 타입으로 일관성 유지
  nickname: string;
  profileImage: string;
  name: string;
  email?: string; // Add email if available in user info
  phoneNumber: string | null;
  role: 'NOT_REGISTERED' | 'NOT_VERIFIED' | 'USER' | 'ADMIN';
  createdAt: string;
  point: number;
  returnedItemsCount: number;
  badgeCount: number;
  totalScore: number;
  totalReviews: number;
  receivedReviews: ReceivedReview[];
  reviews: MyReview[];
  posts: Post[];
  likedPosts: Post[];
  blockedUser: BlockedUser[];
  userOauth2Accounts: UserOauth2Account[];
}

// AuthTokens 인터페이스 (exprTime 추가 확인)
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string; // Optional based on API response
  exprTime?: number; // Expiry time in seconds from API
}

// 게시물 생성 시 API에 보낼 데이터 타입 (CreateLostItemPage.tsx와 일치)
export interface PostData {
  title: string;
  content: string;
  type: 'lost' | 'found' | 'LOST' | 'FOUND';
  images: string[]; // URLs after upload
  setPoint: number;
  itemCategory: string;
  lat: number;
  lon: number;
  lostAt: string; // ISO string format
  isAnonymous: boolean;
}


// --- 인증 관련 함수들 ---

// [MODIFIED] Save tokens and calculate expiration timestamp
export const saveTokens = (tokens: AuthTokens) => {
  if (tokens.accessToken) {
    localStorage.setItem('accessToken', tokens.accessToken);
  }
  if (tokens.refreshToken) {
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
  // Calculate and store the absolute expiration time (timestamp in milliseconds)
  if (tokens.exprTime) {
    // Add a small buffer (e.g., 10 seconds) before actual expiry
    const bufferSeconds = 10;
    const expiresInMilliseconds = (tokens.exprTime - bufferSeconds) * 1000;
    const expirationTimestamp = Date.now() + expiresInMilliseconds;
    localStorage.setItem('tokenExpiration', expirationTimestamp.toString());
    console.log(`Token expiration set to: ${new Date(expirationTimestamp).toLocaleString()}`);
  } else {
    // If exprTime is not provided, remove any old expiration time
    localStorage.removeItem('tokenExpiration');
    console.warn('exprTime not provided in token response. Cannot set auto-logout timer.');
  }
};

// [MODIFIED] Get tokens and expiration timestamp
export const getTokens = (): (AuthTokens & { expirationTimestamp?: number }) | null => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const expirationTimestampStr = localStorage.getItem('tokenExpiration');

  if (!accessToken || !refreshToken) {
    clearTokens(); // Ensure clean state if tokens are missing
    return null;
  }

  const expirationTimestamp = expirationTimestampStr ? parseInt(expirationTimestampStr, 10) : undefined;

  // Basic check if timestamp is valid
  if (expirationTimestamp && isNaN(expirationTimestamp)) {
    console.error("Invalid tokenExpiration found in localStorage.");
    localStorage.removeItem('tokenExpiration'); // Clean up invalid data
    return { accessToken, refreshToken }; // Return without expiration
  }


  return { accessToken, refreshToken, expirationTimestamp };
};

// [NEW] Check if the access token is expired or close to expiring
export const isTokenExpired = (): boolean => {
  const tokens = getTokens();
  if (!tokens || !tokens.expirationTimestamp) {
    // If no expiration time is stored, assume it might be expired or treat as non-expiring
    // Depending on your strategy, you might want to return true here to force refresh/check
    console.log("isTokenExpired: No expiration timestamp found.");
    return false; // Assuming non-expiring for now, adjust if needed
  }

  // Check if current time is past the stored expiration time
  const isExpired = Date.now() >= tokens.expirationTimestamp;
  if (isExpired) {
    console.log(`Token expired at ${new Date(tokens.expirationTimestamp).toLocaleString()}. Current time: ${new Date().toLocaleString()}`);
  }
  return isExpired;
};


// Clear all authentication-related data
export const clearTokens = () => {
  console.log("Clearing all tokens and user info.");
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('tokenExpiration'); // Ensure expiration is cleared
};

// Save user info to localStorage
export const saveUserInfo = (userInfo: UserInfo) => {
  // Ensure ID is stored consistently, convert if needed (though API should provide number)
  const infoToSave = { ...userInfo, id: Number(userInfo.id) };
  localStorage.setItem('userInfo', JSON.stringify(infoToSave));
};

// Get user info from localStorage
export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return null;

  try {
    const userInfo: UserInfo = JSON.parse(userInfoStr);
    // Basic validation
    if (userInfo && typeof userInfo.id === 'number') {
      return userInfo;
    } else {
      console.error("Invalid user info found in localStorage:", userInfo);
      clearTokens(); // Clear invalid data
      return null;
    }
  } catch (error) {
    console.error("Failed to parse user info from localStorage:", error);
    clearTokens(); // Clear corrupted data
    return null;
  }
};

// Fetch initial tokens after OAuth callback (if using cookies/credentials)
export const fetchAndStoreTokens = async (): Promise<AuthTokens | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
      credentials: 'include', // Important if backend sets cookies
    });

    if (!response.ok) {
      console.error(`Failed to fetch tokens. Status: ${response.status}`);
      clearTokens();
      return null;
    }

    const data: AuthTokens = await response.json();

    if (data.accessToken && data.refreshToken && data.exprTime) {
      saveTokens(data); // Save received tokens and set expiration
      return data;
    } else {
      console.error("Token data (accessToken, refreshToken, exprTime) is missing in the response from /api/v1/auth/token");
      clearTokens();
      return null;
    }
  } catch (error) {
    console.error('Fetching initial tokens failed:', error);
    clearTokens();
    return null;
  }
};


// Refresh the access token using the refresh token
export const refreshAccessToken = async (): Promise<AuthTokens | null> => {
  console.log("Attempting to refresh access token...");
  const currentTokens = getTokens();
  if (!currentTokens?.refreshToken) {
    console.log("Refresh failed: No refresh token found.");
    clearTokens(); // Clear everything if refresh token is missing
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error(`Token refresh failed. Status: ${response.status}`, errorBody);
      clearTokens(); // Clear tokens if refresh fails
      return null;
    }

    const newTokens: AuthTokens = await response.json();
    if (newTokens.accessToken && newTokens.refreshToken && newTokens.exprTime) {
      console.log("Access token refreshed successfully.");
      saveTokens(newTokens); // Save the new tokens and update expiration
      return newTokens;
    } else {
      console.error("Refresh response missing required token data.");
      clearTokens(); // Clear if response is malformed
      return null;
    }
  } catch (error) {
    console.error('Token refresh request failed:', error);
    clearTokens(); // Clear tokens on network or other errors
    return null;
  }
};

// [NEW] Get a valid auth token, attempting refresh if expired
export const getValidAuthToken = async (): Promise<string | null> => {
  const tokens = getTokens();

  if (!tokens?.accessToken) {
    console.log("getValidAuthToken: No access token found initially.");
    return null; // No token exists
  }

  if (isTokenExpired()) {
    console.log("getValidAuthToken: Access token expired, attempting refresh...");
    const newTokens = await refreshAccessToken();
    if (newTokens) {
      console.log("getValidAuthToken: Refresh successful, returning new token.");
      return newTokens.accessToken;
    } else {
      console.log("getValidAuthToken: Refresh failed, no valid token available.");
      return null; // Refresh failed
    }
  } else {
    // console.log("getValidAuthToken: Current token is valid.");
    return tokens.accessToken; // Token is still valid
  }
};

// [NEW] Checks authentication status, attempts refresh, returns boolean
export const checkAuthStatus = async (): Promise<boolean> => {
  const token = await getValidAuthToken();
  const hasValidToken = token !== null;
  // console.log("checkAuthStatus result:", hasValidToken);
  return hasValidToken;
};


// Check user info using a valid token (refreshes if needed)
export const checkToken = async (userId: string): Promise<UserInfo | null> => {
  // Use getValidAuthToken to ensure we use a fresh token if needed
  const token = await getValidAuthToken();
  if (!token) {
    console.error("checkToken: No valid access token available after checking/refreshing.");
    // No need to clearTokens here, getValidAuthToken handles it on refresh failure
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error(`Failed to fetch user info with token. Status: ${response.status}`, errorBody);
      // If it's 401 again even after attempting refresh, clear tokens
      if (response.status === 401 || response.status === 403) {
        clearTokens();
      }
      return null;
    }

    const userInfo: UserInfo = await response.json();
    console.log("[checkToken] User info fetched successfully:", userInfo);
    saveUserInfo(userInfo); // Save/update user info
    return userInfo;
  } catch (error) {
    console.error('Fetching user info failed:', error);
    return null;
  }
};


// Sign up a new user
// ... existing code ...

// Sign up a new user
export const signupUser = async (
  userId: string,
  nickname: string,
  profileImage: string,
  name: string,
  lat?: number | null,
  lon?: number | null
): Promise<boolean> => {
  // Use getValidAuthToken to ensure token validity
  const token = await getValidAuthToken();
  if (!token) {
    console.error('Signup failed: No valid token.');
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname, profileImage, name, lat, lon }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error(`Signup failed. Status: ${response.status}`, errorBody);

      // [MODIFIED] 서버에서 보낸 에러 메시지를 throw합니다.
      if (errorBody.message) {
        throw new Error(errorBody.message);
      }

      return false;
    }
    console.log("Signup successful.");
    return true; // Return true on successful signup (2xx status)

  } catch (error) {
    console.error('Signup request failed:', error);
    // [MODIFIED] 에러를 다시 던져서 컴포넌트에서 처리할 수 있게 합니다.
    throw error;
  }
};

// [NEW] Login with social token (native flow)
export interface SocialLoginResponse extends AuthTokens {
  role: 'USER' | 'NOT_REGISTERED';
}

// [NEW] Login with social token (native flow)
export const loginWithSocialToken = async (provider: string, code: string, name?: string): Promise<SocialLoginResponse | null> => {
  try {
    // fetch 대신 CapacitorHttp.post 사용
    const response = await CapacitorHttp.post({
      url: `${API_BASE_URL}/api/v1/auth/oauth2`,
      headers: { 'Content-Type': 'application/json' },
      data: { provider, code, name, redirect_uri: 'postmessage' },
    });

    // CapacitorHttp는 응답 데이터가 response.data에 담깁니다.
    console.log('CapacitorHttp Response Status:', response.status);
    console.log('CapacitorHttp Response Data:', JSON.stringify(response.data));

    if (response.status === 200 || response.status === 201) {
      const data = response.data;
      if (data.accessToken && data.refreshToken) {
        // role이 응답에 포함되어 있다고 가정
        return data as SocialLoginResponse;
      } else {
        console.error('Missing tokens in response data:', data);
      }
    } else {
      console.error('Unexpected status code:', response.status);
    }
    return null;
  } catch (error) {
    console.error('네이티브 통신 실패:', error);
    if (error instanceof TypeError && error.message === 'Load failed') {
      console.error('🚨 원인: 네트워크 차단 (CORS 문제이거나 인터넷 연결 없음)');
      console.error('👉 백엔드 개발자에게 "capacitor://localhost" 오리진을 허용해달라고 요청하세요.');
    } else if (error instanceof Error) {
      console.error('메시지:', error.message);
      console.error('스택:', error.stack);
    } else {
      console.error('알 수 없는 오류:', JSON.stringify(error));
    }
    return null;
  }
};
// 배포 시, 현재 주석된 코드 사용
// export const loginWithSocialToken = async (provider: string, code: string, name?: string): Promise<boolean> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth2`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ provider, code, name, access_type: 'offline' ,redirect_uri: 'postmessage'}),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`Social login failed. Status: ${response.status}, Body: ${errorText}`);
//       return false;
//     }

//     const data: AuthTokens = await response.json();
//     if (data.accessToken && data.refreshToken) {
//       saveTokens(data);
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Social login request failed. Error details:', error);
//     if (error instanceof TypeError && error.message === 'Load failed') {
//       console.error('🚨 원인: 네트워크 차단 (CORS 문제이거나 인터넷 연결 없음)');
//       console.error('👉 백엔드 개발자에게 "capacitor://localhost" 오리진을 허용해달라고 요청하세요.');
//     } else if (error instanceof Error) {
//       console.error('메시지:', error.message);
//       console.error('스택:', error.stack);
//     } else {
//       console.error('알 수 없는 오류:', JSON.stringify(error));
//     }
//     return false;
//   }
// };

// Get OAuth URL for a provider
export const getOAuthUrl = (provider: 'google' | 'kakao' | 'naver' | 'apple'): string => {
  return `${API_BASE_URL}/oauth2/authorization/${provider}`;
};

// Delete user account
export const deleteUser = async (userId: string): Promise<boolean> => {
  // Use getValidAuthToken to ensure token validity
  const token = await getValidAuthToken();
  if (!token) {
    console.error('User deletion failed: No valid token.');
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log("User deleted successfully.");
      clearTokens(); // Clear local data after successful deletion
      return true;
    } else {
      const errorBody = await response.json().catch(() => ({}));
      console.error(`User deletion failed. Status: ${response.status}`, errorBody);
      return false;
    }
  } catch (error) {
    console.error('User deletion request failed:', error);
    return false;
  }
};

// Get user profile (similar to checkToken but might be used differently)
export const getUserProfile = async (userId: string): Promise<UserInfo | null> => {
  // Use getValidAuthToken to ensure token validity
  const token = await getValidAuthToken();
  if (!token) {
    console.error("getUserProfile: No valid access token found.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error(`Failed to fetch user profile. Status: ${response.status}`, errorBody);
      // If it's 401/403, potentially clear tokens as access is denied
      if (response.status === 401 || response.status === 403) {
        // clearTokens(); // 다른 사람 프로필 조회 실패가 내 로그아웃을 유발하면 안 될 수도 있음 (상황에 따라 결정)
      }
      return null;
    }

    const userInfo: UserInfo = await response.json();
    // [FIXED] Don't overwrite local user info when viewing other profiles
    // saveUserInfo(userInfo); 
    return userInfo;

  } catch (error) {
    console.error('Fetching user profile failed:', error);
    return null;
  }
};

// Create a post
export const createPost = async (postData: PostData): Promise<Post | null> => { // Return type matches API response for a single post
  const token = await getValidAuthToken();
  if (!token) {
    console.error("createPost: No valid access token found.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error(`Failed to create post. Status: ${response.status}`, errorBody);
      // Consider specific error handling based on status code if needed
      return null;
    }

    const createdPost: Post = await response.json();
    console.log("Post created successfully:", createdPost);
    return createdPost;

  } catch (error) {
    console.error('Creating post failed:', error);
    return null;
  }
};

// [NEW - Optional] Simple function to just get the access token string synchronously
// Useful for cases where immediate token value is needed without async check/refresh
// **Warning:** This token might be expired. Use getValidAuthToken for API calls.
export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

// ... (기존 코드 유지)

// [추가] 채팅방 생성 요청 DTO
// interface ChatRoomRequestDto {
//   name: string;
//   postId: number;
//   isAnonymous: boolean;
// }

// [추가] 채팅방 응답 DTO (필요한 부분만 정의)
interface ChatRoomResponseDto {
  roomId: string;
  name: string;
  // ... other fields
}

// [추가] 채팅방 생성 함수
export const createChatRoom = async (
  postId: number,
  name: string,
  isAnonymous: boolean = false
): Promise<string | null> => {
  const token = await getValidAuthToken();
  if (!token) {
    console.error("createChatRoom: No valid token.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        postId,
        name,
        isAnonymous
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));

      // 이미 존재하는 채팅방인 경우 (백엔드 에러코드 확인 필요, 보통 400 Bad Request)
      if (errorBody.code === 'CHAT_ROOM_ALREADY_EXIST') {
        alert("이미 존재하는 채팅방입니다. 채팅 목록을 확인해주세요.");
        // TODO: 기획에 따라 기존 채팅방 ID를 조회해서 이동시키는 로직이 필요할 수 있음
        return null;
      }

      if (errorBody.code === 'CHAT_WITH_SELF_NOT_ALLOWED') {
        alert("자기 자신과는 채팅할 수 없습니다.");
        return null;
      }

      console.error(`Failed to create chat room. Status: ${response.status}`, errorBody);
      throw new Error(errorBody.message || "채팅방 생성 실패");
    }

    const data: ChatRoomResponseDto = await response.json();
    return data.roomId;

  } catch (error) {
    console.error('Error creating chat room:', error);
    alert(error instanceof Error ? error.message : "채팅방을 만들 수 없습니다.");
    return null;
  }
};