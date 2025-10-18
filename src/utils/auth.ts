// // // const API_BASE_URL = 'https://treasurehunter.seohamin.com';

// // // // --- [MODIFIED] Detailed UserInfo Types ---

// // // // 리뷰 작성자 정보
// // // interface ReviewAuthor {
// // //   id: number;
// // //   nickname: string;
// // //   profileImage: string;
// // //   totalScore: number;
// // //   totalReviews: number;
// // // }

// // // // 받은 리뷰 정보
// // // interface ReceivedReview {
// // //   id: number;
// // //   author?: ReviewAuthor; // 익명일 수 있음
// // //   title: string;
// // //   content: string;
// // //   score: number;
// // //   images: string[];
// // // }

// // // // 내가 쓴 리뷰 정보
// // // interface MyReview {
// // //   id: number;
// // //   title: string;
// // //   content: string;
// // //   score: number;
// // //   images: string[];
// // // }

// // // // 게시물 정보
// // // interface Post {
// // //   id: number;
// // //   title: string;
// // //   content: string;
// // //   type: string;
// // //   imageUrls: string[];
// // //   setPoint: number;
// // //   lat: number;
// // //   lon: number;
// // //   isAnonymous: boolean;
// // //   isCompleted: boolean;
// // // }

// // // // 차단한 유저 정보
// // // interface BlockedUser {
// // //   id: number;
// // //   nickname: string;
// // //   profileImage: string;
// // //   totalScore: number; // 오타 수정: totalScore
// // //   totalReviews: number;
// // // }

// // // // 연동된 소셜 계정 정보
// // // interface UserOauth2Account {
// // //   id: number;
// // //   userId: number;
// // //   userRole: string;
// // //   provider: string;
// // //   providerUserId: string;
// // //   email: string;
// // //   name: string;
// // //   profileImage: string;
// // //   linkedAt: string;
// // // }

// // // // 메인 사용자 정보 타입 (export 추가)
// // // export interface UserInfo {
// // //   id: number;
// // //   nickname: string;
// // //   profileImage: string;
// // //   name: string;
// // //   phoneNumber: string | null;
// // //   role: 'NOT_REGISTERED' | 'NOT_VERIFIED' | 'USER' | 'ADMIN';
// // //   createdAt: string;
// // //   point: number;
// // //   returnedItemsCount: number;
// // //   badgeCount: number;
// // //   totalScore: number;
// // //   totalReviews: number;
// // //   receivedReviews: ReceivedReview[];
// // //   reviews: MyReview[];
// // //   posts: Post[];
// // //   likedPosts: Post[];
// // //   blockedUser: BlockedUser[];
// // //   userOauth2Accounts: UserOauth2Account[];
// // // }

// // // export interface AuthTokens {
// // //   accessToken: string;
// // //   refreshToken: string;
// // //   tokenType?: string;
// // //   exprTime?: number;
// // // }


// // // // --- 인증 관련 함수들 ---

// // // export const saveTokens = (accessToken: string, refreshToken: string) => {
// // //   localStorage.setItem('accessToken', accessToken);
// // //   localStorage.setItem('refreshToken', refreshToken);
// // // };

// // // export const getTokens = (): AuthTokens | null => {
// // //   const accessToken = localStorage.getItem('accessToken');
// // //   const refreshToken = localStorage.getItem('refreshToken');

// // //   if (!accessToken || !refreshToken) return null;

// // //   return { accessToken, refreshToken };
// // // };

// // // export const clearTokens = () => {
// // //   localStorage.removeItem('accessToken');
// // //   localStorage.removeItem('refreshToken');
// // //   localStorage.removeItem('userInfo');
// // // };

// // // export const saveUserInfo = (userInfo: UserInfo) => {
// // //   localStorage.setItem('userInfo', JSON.stringify(userInfo));
// // // };

// // // export const getUserInfo = (): UserInfo | null => {
// // //   const userInfoStr = localStorage.getItem('userInfo');
// // //   if (!userInfoStr) return null;

// // //   try {
// // //     return JSON.parse(userInfoStr);
// // //   } catch {
// // //     return null;
// // //   }
// // // };

// // // export const fetchAndStoreTokens = async (): Promise<AuthTokens | null> => {
// // //   try {
// // //     const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
// // //       credentials: 'include',
// // //     });

// // //     if (!response.ok) {
// // //       console.error(`Failed to fetch tokens. Status: ${response.status}`);
// // //       return null;
// // //     }

// // //     const data = await response.json();

// // //     if (data.accessToken && data.refreshToken) {
// // //       saveTokens(data.accessToken, data.refreshToken);
// // //       return data;
// // //     } else {
// // //       console.error("Token data is missing in the response from /api/v1/auth/token");
// // //       return null;
// // //     }
// // //   } catch (error) {
// // //     console.error('Fetching tokens failed:', error);
// // //     return null;
// // //   }
// // // };

// // // /**
// // //  * [MODIFIED] 사용자 정보를 받아온 직후 console.log로 응답 본문을 출력합니다.
// // //  */
// // // export const checkToken = async (userId: string): Promise<UserInfo | null> => {
// // //   const tokens = getTokens();
// // //   if (!tokens?.accessToken) {
// // //     console.error("checkToken: No access token found in localStorage.");
// // //     return null;
// // //   }

// // //   try {
// // //     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
// // //       headers: {
// // //         'Authorization': `Bearer ${tokens.accessToken}`,
// // //       },
// // //     });

// // //     if (!response.ok) {
// // //         console.error(`Failed to fetch user info. Status: ${response.status}`);
// // //         if (response.status === 401) {
// // //           const newTokens = await refreshAccessToken();
// // //           if (newTokens) {
// // //             return checkToken(userId);
// // //           }
// // //         }
// // //         return null;
// // //     }

// // //     const userInfo = await response.json();

// // //     console.log("[checkToken 응답 본문]:", userInfo);

// // //     saveUserInfo(userInfo);
// // //     return userInfo;
// // //   } catch (error) {
// // //     console.error('User info fetch failed:', error);
// // //     return null;
// // //   }
// // // };

// // // export const refreshAccessToken = async (): Promise<AuthTokens | null> => {
// // //   const tokens = getTokens();
// // //   if (!tokens?.refreshToken) return null;

// // //   try {
// // //     const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh`, {
// // //       method: 'POST',
// // //       headers: { 'Content-Type': 'application/json' },
// // //       body: JSON.stringify({ refreshToken: tokens.refreshToken }),
// // //     });

// // //     if (!response.ok) {
// // //       clearTokens();
// // //       return null;
// // //     }

// // //     const data = await response.json();
// // //     saveTokens(data.accessToken, data.refreshToken);
// // //     return data;
// // //   } catch (error) {
// // //     console.error('Token refresh failed:', error);
// // //     return null;
// // //   }
// // // };

// // // export const signupUser = async (
// // //   userId: string,
// // //   nickname: string,
// // //   profileImage: string,
// // //   name: string
// // // ): Promise<boolean> => {
// // //   const tokens = getTokens();
// // //   if (!tokens?.accessToken) return false;

// // //   try {
// // //     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
// // //       method: 'POST',
// // //       headers: {
// // //         'Content-Type': 'application/json',
// // //         Authorization: `Bearer ${tokens.accessToken}`,
// // //       },
// // //       body: JSON.stringify({ nickname, profileImage, name }),
// // //     });
// // //     return response.ok;
// // //   } catch (error) {
// // //     console.error('Signup failed:', error);
// // //     return false;
// // //   }
// // // };

// // // export const getOAuthUrl = (provider: 'google' | 'kakao' | 'naver'): string => {
// // //   return `${API_BASE_URL}/oauth2/authorization/${provider}`;
// // // };

// // // export const deleteUser = async (userId: string): Promise<boolean> => {
// // //   const tokens = getTokens();
// // //   if (!tokens?.accessToken) return false;

// // //   try {
// // //     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
// // //       method: 'DELETE',
// // //       headers: {
// // //         'Authorization': `Bearer ${tokens.accessToken}`,
// // //       },
// // //     });

// // //     if (response.ok) {
// // //       clearTokens();
// // //       return true;
// // //     }
// // //     return false;
// // //   } catch (error) {
// // //     console.error('User deletion failed:', error);
// // //     return false;
// // //   }
// // // };

// // // export const getUserProfile = async (userId: string): Promise<UserInfo | null> => {
// // //   const tokens = getTokens();
// // //   if (!tokens?.accessToken) {
// // //     console.error("getUserProfile: No access token found.");
// // //     return null;
// // //   }

// // //   try {
// // //     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
// // //       headers: {
// // //         'Authorization': `Bearer ${tokens.accessToken}`,
// // //       },
// // //     });

// // //     if (!response.ok) {
// // //       console.error(`Failed to fetch user profile. Status: ${response.status}`);
// // //        if (response.status === 401) {
// // //           const newTokens = await refreshAccessToken();
// // //           if (newTokens) {
// // //             return getUserProfile(userId);
// // //           }
// // //         }
// // //       return null;
// // //     }
    
// // //     return await response.json();
// // //   } catch (error) {
// // //     console.error('Fetching user profile failed:', error);
// // //     return null;
// // //   }
// // // };

// // const API_BASE_URL = 'https://treasurehunter.seohamin.com';

// // // --- [MODIFIED] Detailed UserInfo Types ---

// // // 리뷰 작성자 정보
// // interface ReviewAuthor {
// //   id: number;
// //   nickname: string;
// //   profileImage: string;
// //   totalScore: number;
// //   totalReviews: number;
// // }

// // // 받은 리뷰 정보
// // interface ReceivedReview {
// //   id: number;
// //   author?: ReviewAuthor; // 익명일 수 있음
// //   title: string;
// //   content: string;
// //   score: number;
// //   images: string[];
// // }

// // // 내가 쓴 리뷰 정보
// // interface MyReview {
// //   id: number;
// //   title: string;
// //   content: string;
// //   score: number;
// //   images: string[];
// // }

// // // 게시물 정보
// // interface Post {
// //   id: number;
// //   title: string;
// //   content: string;
// //   type: string;
// //   imageUrls: string[];
// //   setPoint: number;
// //   lat: number;
// //   lon: number;
// //   isAnonymous: boolean;
// //   isCompleted: boolean;
// // }

// // // 차단한 유저 정보
// // interface BlockedUser {
// //   id: number;
// //   nickname: string;
// //   profileImage: string;
// //   totalScore: number; 
// //   totalReviews: number;
// // }

// // // 연동된 소셜 계정 정보
// // interface UserOauth2Account {
// //   id: number;
// //   userId: number;
// //   userRole: string;
// //   provider: string;
// //   providerUserId: string;
// //   email: string;
// //   name: string;
// //   profileImage: string;
// //   linkedAt: string;
// // }

// // // 메인 사용자 정보 타입 (export 추가)
// // export interface UserInfo {
// //   id: number;
// //   nickname: string;
// //   profileImage: string;
// //   name: string;
// //   phoneNumber: string | null;
// //   role: 'NOT_REGISTERED' | 'NOT_VERIFIED' | 'USER' | 'ADMIN';
// //   createdAt: string;
// //   point: number;
// //   returnedItemsCount: number;
// //   badgeCount: number;
// //   totalScore: number;
// //   totalReviews: number;
// //   receivedReviews: ReceivedReview[];
// //   reviews: MyReview[];
// //   posts: Post[];
// //   likedPosts: Post[];
// //   blockedUser: BlockedUser[];
// //   userOauth2Accounts: UserOauth2Account[];
// // }

// // export interface AuthTokens {
// //   accessToken: string;
// //   refreshToken: string;
// //   tokenType?: string;
// //   exprTime?: number;
// // }


// // // --- 인증 관련 함수들 ---

// // export const saveTokens = (accessToken: string, refreshToken: string) => {
// //   localStorage.setItem('accessToken', accessToken);
// //   localStorage.setItem('refreshToken', refreshToken);
// // };

// // export const getTokens = (): AuthTokens | null => {
// //   const accessToken = localStorage.getItem('accessToken');
// //   const refreshToken = localStorage.getItem('refreshToken');

// //   if (!accessToken || !refreshToken) return null;

// //   return { accessToken, refreshToken };
// // };

// // export const clearTokens = () => {
// //   localStorage.removeItem('accessToken');
// //   localStorage.removeItem('refreshToken');
// //   localStorage.removeItem('userInfo');
// // };

// // export const saveUserInfo = (userInfo: UserInfo) => {
// //   localStorage.setItem('userInfo', JSON.stringify(userInfo));
// // };

// // export const getUserInfo = (): UserInfo | null => {
// //   const userInfoStr = localStorage.getItem('userInfo');
// //   if (!userInfoStr) return null;

// //   try {
// //     return JSON.parse(userInfoStr);
// //   } catch {
// //     return null;
// //   }
// // };

// // export const fetchAndStoreTokens = async (): Promise<AuthTokens | null> => {
// //   try {
// //     const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
// //       credentials: 'include',
// //     });

// //     if (!response.ok) {
// //       console.error(`Failed to fetch tokens. Status: ${response.status}`);
// //       return null;
// //     }

// //     const data = await response.json();

// //     if (data.accessToken && data.refreshToken) {
// //       saveTokens(data.accessToken, data.refreshToken);
// //       return data;
// //     } else {
// //       console.error("Token data is missing in the response from /api/v1/auth/token");
// //       return null;
// //     }
// //   } catch (error) {
// //     console.error('Fetching tokens failed:', error);
// //     return null;
// //   }
// // };

// // export const checkToken = async (userId: string): Promise<UserInfo | null> => {
// //   const tokens = getTokens();
// //   if (!tokens?.accessToken) {
// //     return null;
// //   }

// //   try {
// //     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
// //       headers: {
// //         'Authorization': `Bearer ${tokens.accessToken}`,
// //       },
// //     });

// //     if (!response.ok) {
// //         if (response.status === 401) {
// //           const newTokens = await refreshAccessToken();
// //           if (newTokens) {
// //             return checkToken(userId);
// //           }
// //         }
// //         return null;
// //     }

// //     const userInfo = await response.json();

// //     console.log("[checkToken 응답 본문]:", userInfo);

// //     saveUserInfo(userInfo);
// //     return userInfo;
// //   } catch (error) {
// //     console.error('User info fetch failed:', error);
// //     return null;
// //   }
// // };

// // export const refreshAccessToken = async (): Promise<AuthTokens | null> => {
// //   const tokens = getTokens();
// //   if (!tokens?.refreshToken) return null;

// //   try {
// //     const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh`, {
// //       method: 'POST',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify({ refreshToken: tokens.refreshToken }),
// //     });

// //     if (!response.ok) {
// //       clearTokens();
// //       return null;
// //     }

// //     const data = await response.json();
// //     saveTokens(data.accessToken, data.refreshToken);
// //     return data;
// //   } catch (error) {
// //     console.error('Token refresh failed:', error);
// //     return null;
// //   }
// // };

// // export const signupUser = async (
// //   userId: string,
// //   nickname: string,
// //   profileImage: string,
// //   name: string
// // ): Promise<boolean> => {
// //   const tokens = getTokens();
// //   if (!tokens?.accessToken) return false;

// //   try {
// //     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //         Authorization: `Bearer ${tokens.accessToken}`,
// //       },
// //       body: JSON.stringify({ nickname, profileImage, name }),
// //     });
// //     return response.ok;
// //   } catch (error) {
// //     console.error('Signup failed:', error);
// //     return false;
// //   }
// // };

// // export const getOAuthUrl = (provider: 'google' | 'kakao' | 'naver'): string => {
// //   return `${API_BASE_URL}/oauth2/authorization/${provider}`;
// // };

// // export const deleteUser = async (userId: string): Promise<boolean> => {
// //   const tokens = getTokens();
// //   if (!tokens?.accessToken) return false;

// //   try {
// //     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
// //       method: 'DELETE',
// //       headers: {
// //         'Authorization': `Bearer ${tokens.accessToken}`,
// //       },
// //     });

// //     if (response.ok) {
// //       clearTokens();
// //       return true;
// //     }
// //     return false;
// //   } catch (error) {
// //     console.error('User deletion failed:', error);
// //     return false;
// //   }
// // };

// // export const getUserProfile = async (userId: string): Promise<UserInfo | null> => {
// //   const tokens = getTokens();
// //   if (!tokens?.accessToken) {
// //     console.error("getUserProfile: No access token found.");
// //     return null;
// //   }

// //   try {
// //     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
// //       headers: {
// //         'Authorization': `Bearer ${tokens.accessToken}`,
// //       },
// //     });

// //     if (!response.ok) {
// //       console.error(`Failed to fetch user profile. Status: ${response.status}`);
// //        if (response.status === 401) {
// //           const newTokens = await refreshAccessToken();
// //           if (newTokens) {
// //             return getUserProfile(userId);
// //           }
// //         }
// //       return null;
// //     }
    
// //     return await response.json();
// //   } catch (error) {
// //     console.error('Fetching user profile failed:', error);
// //     return null;
// //   }
// // };


// const API_BASE_URL = 'https://treasurehunter.seohamin.com';

// // --- [MODIFIED] Detailed UserInfo Types ---

// // 리뷰 작성자 정보
// interface ReviewAuthor {
//   id: number;
//   nickname: string;
//   profileImage: string;
//   totalScore: number;
//   totalReviews: number;
// }

// // 받은 리뷰 정보
// interface ReceivedReview {
//   id: number;
//   author?: ReviewAuthor; // 익명일 수 있음
//   title: string;
//   content: string;
//   score: number;
//   images: string[];
// }

// // 내가 쓴 리뷰 정보
// interface MyReview {
//   id: number;
//   title: string;
//   content: string;
//   score: number;
//   images: string[];
// }

// // 게시물 정보
// interface Post {
//   id: number;
//   title: string;
//   content: string;
//   type: string;
//   imageUrls: string[];
//   setPoint: number;
//   lat: number;
//   lon: number;
//   isAnonymous: boolean;
//   isCompleted: boolean;
// }

// // 차단한 유저 정보
// interface BlockedUser {
//   id: number;
//   nickname: string;
//   profileImage: string;
//   totalScore: number; 
//   totalReviews: number;
// }

// // 연동된 소셜 계정 정보
// interface UserOauth2Account {
//   id: number;
//   userId: number;
//   userRole: string;
//   provider: string;
//   providerUserId: string;
//   email: string;
//   name: string;
//   profileImage: string;
//   linkedAt: string;
// }

// // 메인 사용자 정보 타입 (export 추가)
// export interface UserInfo {
//   id: number;
//   nickname: string;
//   profileImage: string;
//   name: string;
//   phoneNumber: string | null;
//   role: 'NOT_REGISTERED' | 'NOT_VERIFIED' | 'USER' | 'ADMIN';
//   createdAt: string;
//   point: number;
//   returnedItemsCount: number;
//   badgeCount: number;
//   totalScore: number;
//   totalReviews: number;
//   receivedReviews: ReceivedReview[];
//   reviews: MyReview[];
//   posts: Post[];
//   likedPosts: Post[];
//   blockedUser: BlockedUser[];
//   userOauth2Accounts: UserOauth2Account[];
// }

// export interface AuthTokens {
//   accessToken: string;
//   refreshToken: string;
//   tokenType?: string;
//   exprTime?: number;
// }


// // --- 인증 관련 함수들 ---

// export const saveTokens = (accessToken: string, refreshToken: string) => {
//   localStorage.setItem('accessToken', accessToken);
//   localStorage.setItem('refreshToken', refreshToken);
// };

// export const getTokens = (): AuthTokens | null => {
//   const accessToken = localStorage.getItem('accessToken');
//   const refreshToken = localStorage.getItem('refreshToken');

//   if (!accessToken || !refreshToken) return null;

//   return { accessToken, refreshToken };
// };

// export const clearTokens = () => {
//   localStorage.removeItem('accessToken');
//   localStorage.removeItem('refreshToken');
//   localStorage.removeItem('userInfo');
// };

// export const saveUserInfo = (userInfo: UserInfo) => {
//   localStorage.setItem('userInfo', JSON.stringify(userInfo));
// };

// export const getUserInfo = (): UserInfo | null => {
//   const userInfoStr = localStorage.getItem('userInfo');
//   if (!userInfoStr) return null;

//   try {
//     return JSON.parse(userInfoStr);
//   } catch {
//     return null;
//   }
// };

// export const fetchAndStoreTokens = async (): Promise<AuthTokens | null> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       console.error(`Failed to fetch tokens. Status: ${response.status}`);
//       return null;
//     }

//     const data = await response.json();

//     if (data.accessToken && data.refreshToken) {
//       saveTokens(data.accessToken, data.refreshToken);
//       return data;
//     } else {
//       console.error("Token data is missing in the response from /api/v1/auth/token");
//       return null;
//     }
//   } catch (error) {
//     console.error('Fetching tokens failed:', error);
//     return null;
//   }
// };

// export const checkToken = async (userId: string): Promise<UserInfo | null> => {
//   const tokens = getTokens();
//   if (!tokens?.accessToken) {
//     return null;
//   }

//   try {
//     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
//       headers: {
//         'Authorization': `Bearer ${tokens.accessToken}`,
//       },
//     });

//     if (!response.ok) {
//         if (response.status === 401) {
//           const newTokens = await refreshAccessToken();
//           if (newTokens) {
//             return checkToken(userId);
//           }
//         }
//         return null;
//     }

//     const userInfo = await response.json();

//     console.log("[checkToken 응답 본문]:", userInfo);

//     saveUserInfo(userInfo);
//     return userInfo;
//   } catch (error) {
//     console.error('User info fetch failed:', error);
//     return null;
//   }
// };

// export const refreshAccessToken = async (): Promise<AuthTokens | null> => {
//   const tokens = getTokens();
//   if (!tokens?.refreshToken) return null;

//   try {
//     const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ refreshToken: tokens.refreshToken }),
//     });

//     if (!response.ok) {
//       clearTokens();
//       return null;
//     }

//     const data = await response.json();
//     saveTokens(data.accessToken, data.refreshToken);
//     return data;
//   } catch (error) {
//     console.error('Token refresh failed:', error);
//     return null;
//   }
// };

// export const signupUser = async (
//   userId: string,
//   nickname: string,
//   profileImage: string,
//   name: string
// ): Promise<boolean> => {
//   const tokens = getTokens();
//   if (!tokens?.accessToken) return false;

//   try {
//     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${tokens.accessToken}`,
//       },
//       body: JSON.stringify({ nickname, profileImage, name }),
//     });
//     return response.ok;
//   } catch (error) {
//     console.error('Signup failed:', error);
//     return false;
//   }
// };

// export const getOAuthUrl = (provider: 'google' | 'kakao' | 'naver'): string => {
//   return `${API_BASE_URL}/oauth2/authorization/${provider}`;
// };

// export const deleteUser = async (userId: string): Promise<boolean> => {
//   const tokens = getTokens();
//   if (!tokens?.accessToken) return false;

//   try {
//     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
//       method: 'DELETE',
//       headers: {
//         'Authorization': `Bearer ${tokens.accessToken}`,
//       },
//     });

//     if (response.ok) {
//       clearTokens();
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('User deletion failed:', error);
//     return false;
//   }
// };

// export const getUserProfile = async (userId: string): Promise<UserInfo | null> => {
//   const tokens = getTokens();
//   if (!tokens?.accessToken) {
//     console.error("getUserProfile: No access token found.");
//     return null;
//   }

//   try {
//     const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
//       headers: {
//         'Authorization': `Bearer ${tokens.accessToken}`,
//       },
//     });

//     if (!response.ok) {
//       console.error(`Failed to fetch user profile. Status: ${response.status}`);
//        if (response.status === 401) {
//           const newTokens = await refreshAccessToken();
//           if (newTokens) {
//             return getUserProfile(userId);
//           }
//         }
//       return null;
//     }
    
//     return await response.json();
//   } catch (error) {
//     console.error('Fetching user profile failed:', error);
//     return null;
//   }
// };

const API_BASE_URL = 'https://treasurehunter.seohamin.com';

// --- 상세 UserInfo 타입 정의 ---

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

// 게시물 정보
interface Post {
  id: number;
  title: string;
  content: string;
  type: string;
  imageUrls: string[];
  setPoint: number;
  lat: number;
  lon: number;
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
  id: number;
  nickname: string;
  profileImage: string;
  name: string;
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  exprTime?: number;
}


// --- 인증 관련 함수들 ---

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const getTokens = (): AuthTokens | null => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
};

export const saveUserInfo = (userInfo: UserInfo) => {
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
};

export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return null;

  try {
    return JSON.parse(userInfoStr);
  } catch {
    return null;
  }
};

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
      return data;
    } else {
      console.error("Token data is missing in the response from /api/v1/auth/token");
      return null;
    }
  } catch (error) {
    console.error('Fetching tokens failed:', error);
    return null;
  }
};

export const checkToken = async (userId: string): Promise<UserInfo | null> => {
  const tokens = getTokens();
  if (!tokens?.accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
        if (response.status === 401) {
          const newTokens = await refreshAccessToken();
          if (newTokens) {
            return checkToken(userId);
          }
        }
        return null;
    }

    const userInfo = await response.json();

    console.log("[checkToken 응답 본문]:", userInfo);

    saveUserInfo(userInfo);
    return userInfo;
  } catch (error) {
    console.error('User info fetch failed:', error);
    return null;
  }
};

export const refreshAccessToken = async (): Promise<AuthTokens | null> => {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    saveTokens(data.accessToken, data.refreshToken);
    return data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

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
      body: JSON.stringify({ nickname, profileImage, name }),
    });
    return response.ok;
  } catch (error) {
    console.error('Signup failed:', error);
    return false;
  }
};

export const getOAuthUrl = (provider: 'google' | 'kakao' | 'naver'): string => {
  return `${API_BASE_URL}/oauth2/authorization/${provider}`;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const tokens = getTokens();
  if (!tokens?.accessToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    if (response.ok) {
      clearTokens();
      return true;
    }
    return false;
  } catch (error) {
    console.error('User deletion failed:', error);
    return false;
  }
};

export const getUserProfile = async (userId: string): Promise<UserInfo | null> => {
  const tokens = getTokens();
  if (!tokens?.accessToken) {
    console.error("getUserProfile: No access token found.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch user profile. Status: ${response.status}`);
       if (response.status === 401) {
          const newTokens = await refreshAccessToken();
          if (newTokens) {
            return getUserProfile(userId);
          }
        }
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetching user profile failed:', error);
    return null;
  }
};

