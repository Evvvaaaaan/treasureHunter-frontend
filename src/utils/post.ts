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

// 검색 결과 응답 타입
export interface SearchResponse {
  hasNext: boolean;
  posts: Post[];
}

/**
 * 게시글 텍스트 검색 API
 * @param query 검색어 (공백 제외 3~100자, 한글/영문/숫자만 허용)
 * @param type 게시글 유형 (LOST | FOUND | ''(전체))
 * @param page 페이지 번호
 * @param size 페이지 당 개수
 */
export const searchPostsByText = async (
  query: string,
  type: 'LOST' | 'FOUND' | '' = '',
  page: number = 0,
  size: number = 20
): Promise<SearchResponse> => {
  
  // 1. 유효성 검사 (API 호출 전 클라이언트단 방어)
  const cleanQuery = query.replace(/\s+/g, ''); // 공백/줄바꿈 제거
  
  // 길이 검사 (3 ~ 100자)
  if (cleanQuery.length < 3 || cleanQuery.length > 100) {
    throw new Error('검색어는 공백을 제외하고 3글자 이상, 100글자 이하이어야 합니다.');
  }

  // 특수문자 검사 (한글, 영어, 숫자만 가능)
  // 정규식: ^[a-zA-Z0-9가-힣\s]*$ (원본 query에는 공백이 있을 수 있으므로 \s 허용)
  if (!/^[a-zA-Z0-9가-힣\s]+$/.test(query)) {
    throw new Error('검색어는 한글, 영어, 숫자만 입력 가능합니다.');
  }

  const token = await getValidAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  // 2. 쿼리 파라미터 구성
  const queryParams = new URLSearchParams({
    searchType: 'text',
    query: query, // 원본 쿼리 전송 (서버에서 공백 처리 방식에 따라 cleanQuery를 보낼 수도 있음)
    size: size.toString(),
    page: page.toString(),
  });

  if (type) {
    queryParams.append('postType', type);
  }

  // 3. API 호출
  const response = await fetch(`${API_BASE_URL}/api/v1/posts?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '검색에 실패했습니다.');
  }

  return response.json();
};

export interface PostListResponse {
  hasNext: boolean;
  posts: Post[];
}

/**
 * 게시글 최신순 조회 API
 * @param type 'LOST' | 'FOUND' | 'ALL'
 * @param page 페이지 번호 (0부터 시작)
 * @param size 페이지 당 개수 (기본 20)
 */
export const fetchLatestPosts = async (
  type: 'LOST' | 'FOUND' | 'ALL',
  page: number,
  size: number = 20
): Promise<PostListResponse> => {
  const token = await getValidAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 쿼리 파라미터 구성
  const queryParams = new URLSearchParams({
    size: size.toString(),
    page: page.toString(),
  });

  // 'ALL'이 아닐 때만 postType 파라미터 추가
  if (type !== 'ALL') {
    queryParams.append('postType', type);
  }

  // API 호출 (GET /api/v1/posts?size=20&page=0&postType=LOST)
  const response = await fetch(`${API_BASE_URL}/api/v1/posts?${queryParams.toString()}`, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};