// src/utils/post.ts
import { getValidAuthToken } from './auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

export const fetchPostDetail = async (postId: string | number) => {
  const token = await getValidAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // [수정됨] /posts -> /post (백엔드 API 명세에 맞춤)
  const response = await fetch(`${API_BASE_URL}/post/${postId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('게시글 정보를 불러오는데 실패했습니다.');
  }

  return await response.json();
};