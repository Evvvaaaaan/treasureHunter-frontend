// src/utils/post.ts
import { getValidAuthToken } from './auth';
import { API_BASE_URL } from '../config'; 
import type { Post } from '../types/post';


export const fetchPostDetail = async (postId: string | number) => {
  const token = await getValidAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // [중요] 백엔드 엔드포인트 확인: /post/{postId} (단수형)
  const response = await fetch(`${API_BASE_URL}/post/${postId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    // 에러 상세 내용을 확인하기 위해 로그 추가
    console.error(`게시글(${postId}) 조회 실패: ${response.status}`);
    throw new Error('게시글 정보를 불러오는데 실패했습니다.');
  }

  return await response.json();
};

export interface BoundSearchResponse {
  clientMinLat: string;
  clientMinLon: string;
  clientMaxLat: string;
  clientMaxLon: string;
  hasNext: boolean;
  posts: Post[]; // 기존 Post 타입 사용
}

// 지도 영역 기반 게시글 조회 함수
export const fetchPostsByBounds = async (
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number,
  type: 'LOST' | 'FOUND' | '' = '',
  size: number = 100, // 화면에 너무 많이 뿌리면 느리므로 100~200개 제한 권장
  page: number = 0
): Promise<BoundSearchResponse> => {
  const token = await getValidAuthToken();
  
  // 쿼리 파라미터 구성
  const queryParams = new URLSearchParams({
    searchType: 'bounds',
    minLat: minLat.toString(),
    minLon: minLon.toString(),
    maxLat: maxLat.toString(),
    maxLon: maxLon.toString(),
    size: size.toString(),
    page: page.toString(),
  });

  if (type) {
    queryParams.append('postType', type);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/posts?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('게시글을 불러오는데 실패했습니다.');
  }

  return response.json();
};