import { getValidAuthToken } from './auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

export interface LeaderboardEntry {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
  // [추가] 오류 해결을 위한 속성 추가
  point: number;
  returnedItemsCount: number;
  foundCount?: number; 
}

export type LeaderboardType = 'returns' | 'points' | 'finds';

export const fetchLeaderboard = async (type: LeaderboardType): Promise<LeaderboardEntry[]> => {
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