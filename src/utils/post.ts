// src/utils/post.ts
import { getValidAuthToken } from './auth';
import { API_BASE_URL } from '../config'; 


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