import { getValidAuthToken } from './auth';
import { API_BASE_URL } from '../config'; 


export interface LeaderboardEntry {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
  // [추가] 누락된 속성 추가
  point: number;
  returnedItemsCount: number;
  foundCount?: number; // 'finds' 탭에서 사용 (API 확인 필요, 임시 추가)
}

export type LeaderboardType = 'returns' | 'points' | 'finds';

export const fetchLeaderboard = async (type: LeaderboardType): Promise<LeaderboardEntry[]> => {
  // ... (기존 코드 유지)
  const token = await getValidAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/leaderboard?rankingType=${type}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('리더보드 정보를 불러오는데 실패했습니다.');
  }

  const data = await response.json();
  
  if (data && Array.isArray(data.leaderboard)) {
      return data.leaderboard;
  } else if (Array.isArray(data)) {
      return data;
  }
  
  return [];
};