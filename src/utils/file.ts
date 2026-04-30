import { getValidAuthToken } from './auth';
import { API_BASE_URL } from '../config'; 


export const uploadImage = async (file: File): Promise<string> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/file/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '이미지 업로드 실패');
  }

  const data = await response.json();
  if (!data.fileUrl || typeof data.fileUrl !== 'string') {
    throw new Error(`이미지 URL을 받지 못했습니다. 응답: ${JSON.stringify(data)}`);
  }
  return data.fileUrl;
};