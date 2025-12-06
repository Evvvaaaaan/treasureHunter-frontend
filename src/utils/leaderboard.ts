import { getValidAuthToken } from './auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  nickname: string;
  profileImage: string;
  score: number; // 해당 카테고리의 점수 (포인트, 횟수 등)
  averageRating: number;
}

// 리더보드 타입 정의
export type LeaderboardType = 'returns' | 'points' | 'finds';

export const fetchLeaderboard = async (type: LeaderboardType): Promise<LeaderboardEntry[]> => {
  const token = await getValidAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // API 엔드포인트 예시: /api/v1/leaderboard?type=points
  // 백엔드 스펙에 맞춰 수정 가능
  const response = await fetch(`${API_BASE_URL}/leaderboard?type=${type}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('리더보드 정보를 불러오는데 실패했습니다.');
  }

  const data = await response.json();
  
  // [Fix] Ensure data is an array before mapping
  let listToMap: any[] = [];

  if (Array.isArray(data)) {
      listToMap = data;
  } else if (data && Array.isArray(data.rankingList)) {
      listToMap = data.rankingList;
  } else if (data && Array.isArray(data.data)) {
      listToMap = data.data;
  } else {
      console.warn("Leaderboard API returned unexpected format:", data);
      return []; // Return empty array to prevent crash
  }
  
  return listToMap.map((item: any, index: number) => ({
    id: item.userId?.toString() || item.id?.toString(),
    rank: item.rank || index + 1,
    nickname: item.nickname || '알 수 없음',
    profileImage: item.profileImage || 'https://via.placeholder.com/150?text=User',
    score: item.score || item.count || 0, // 타입에 따라 필드명이 다를 수 있음 처리
    averageRating: item.averageRating || 0,
  }));
};