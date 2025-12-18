// 작성자 정보 타입
export interface PostAuthor {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore: number;
  totalReviews: number;
}

// 게시글(Post) 타입 정의
export interface Post {
  id: number;
  title: string;
  content: string;
  type: 'LOST' | 'FOUND'; // 게시글 유형
  author?: PostAuthor; // 익명이면 없을 수 있으므로 ?(optional) 처리
  images: string[]; // 이미지 URL 배열
  setPoint: number;
  itemCategory: string;
  lat: number;
  lon: number;
  lostAt: string; // ISO Date String
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  isCompleted: boolean;
}