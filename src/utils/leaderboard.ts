import { getValidAuthToken } from './auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

export interface LeaderboardEntry {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
  // 랭킹은 클라이언트에서 계산하거나, 백엔드에서 준다면 추가
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
  
  // 응답 데이터 구조에 맞게 처리
  if (data && Array.isArray(data.leaderboard)) {
      return data.leaderboard;
  } else if (Array.isArray(data)) {
      return data;
  }
  
  console.warn("Unexpected leaderboard data format:", data);
  return [];
};