import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}


// //로고 이미지 서버 등록 시, 사용 할 것.
// import React, { useState, useEffect } from 'react';
// import { getValidAuthToken } from '../../utils/auth'; // 토큰 가져오는 함수

// // [수정] 기본 로고 이미지 (업로드된 파일의 경로를 사용하거나 base64로 변환하여 사용)
// // 실제 환경에서는 public 폴더에 로고 이미지를 넣고 경로를 지정하는 것이 좋습니다.
// // 예: '/logo.png'
// // 여기서는 플레이스홀더용 이미지를 사용하지만, 실제 로고 이미지로 교체해야 합니다.
// const LOGO_PLACEHOLDER = 'https://raw.githubusercontent.com/Team-TreasureHunter/TreasureHunter/main/public/images/logo.png'; 
// // 또는 업로드된 이미지를 base64로 변환하여 사용하거나, import 해서 사용하세요.
// // import logoImg from '../../assets/logo.jpg'; 

// // API 기본 URL 설정 (환경 변수 사용 권장)
// const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

// interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
//   // 추가적인 props가 필요하면 여기에 정의
//   isUploadable?: boolean; // 업로드 기능 활성화 여부 (선택적)
//   onUploadSuccess?: (url: string) => void; // 업로드 성공 시 콜백
// }

// export function ImageWithFallback({ 
//   src, 
//   alt, 
//   className, 
//   style, 
//   isUploadable = false, 
//   onUploadSuccess,
//   ...rest 
// }: ImageWithFallbackProps) {
//   const [imgSrc, setImgSrc] = useState<string | undefined>(src);
//   const [isUploading, setIsUploading] = useState(false);

//   // props.src가 변경되면 imgSrc도 업데이트 (예: 리스트에서 아이템이 변경될 때)
//   useEffect(() => {
//       setImgSrc(src);
//   }, [src]);

//   const handleError = () => {
//     // 이미지 로드 실패 시 로고 이미지로 대체
//     // 실제 프로젝트에서는 로고 이미지 경로를 정확히 입력해주세요.
//     // 예: setImgSrc('/images/logo.jpg');
//     // 여기서는 외부 placeholder 이미지를 사용합니다.
//     setImgSrc('https://via.placeholder.com/400x300.png?text=TreasureHunter'); 
//   };

//   // 이미지 업로드 핸들러
//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setIsUploading(true);
//     try {
//       // 1. 인증 토큰 가져오기
//       const token = await getValidAuthToken();
//       if (!token) {
//         alert('로그인이 필요합니다.');
//         return;
//       }

//       // 2. FormData 생성
//       const formData = new FormData();
//       formData.append('file', file); // 서버에서 요구하는 필드명 확인 필요 ('file' 또는 'image' 등)

//       // 3. API 호출
//       const response = await fetch(`${API_BASE_URL}/file/image`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           // 'Content-Type': 'multipart/form-data', // fetch에서 FormData 사용 시 자동으로 설정됨 (수동 설정 X)
//         },
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error('이미지 업로드 실패');
//       }

//       const data = await response.json();
//       // 서버 응답 구조에 따라 URL 추출 (예: data.url, data.fileUrl 등)
//       const uploadedUrl = data.fileUrl || data.url; 

//       if (uploadedUrl) {
//         setImgSrc(uploadedUrl); // 화면에 즉시 반영
//         if (onUploadSuccess) {
//           onUploadSuccess(uploadedUrl); // 부모 컴포넌트에 URL 전달
//         }
//         alert('이미지가 성공적으로 변경되었습니다.');
//       } else {
//         throw new Error('이미지 URL을 받지 못했습니다.');
//       }

//     } catch (error) {
//       console.error('Upload error:', error);
//       alert('이미지 업로드 중 오류가 발생했습니다.');
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className={`relative ${className}`} style={style}>
//       <img 
//           src={imgSrc || 'https://via.placeholder.com/400x300.png?text=TreasureHunter'} 
//           alt={alt} 
//           className="w-full h-full object-cover" // Tailwind 클래스 예시 (필요에 따라 조정)
//           {...rest} 
//           onError={handleError} 
//       />
      
//       {/* 업로드 기능이 활성화된 경우에만 오버레이 버튼 표시 */}
//       {isUploadable && (
//         <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
//           <input 
//             type="file" 
//             className="hidden" 
//             accept="image/*"
//             onChange={handleImageUpload}
//             disabled={isUploading}
//           />
//           <div className="text-white text-center">
//             {isUploading ? (
//               <span>업로드 중...</span>
//             ) : (
//               <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
//                 이미지 변경
//               </span>
//             )}
//           </div>
//         </label>
//       )}
//     </div>
//   )
// }