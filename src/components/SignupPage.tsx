// // src/components/SignupPage.tsx

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion } from 'motion/react';
// import { Camera, Loader2, MapPin } from 'lucide-react';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { Label } from './ui/label';
// // ✅ getValidAuthToken 추가
// import { Geolocation } from '@capacitor/geolocation';
// import { uploadImage } from '../utils/file';
// import { signupUser, saveUserInfo, getValidAuthToken } from '../utils/auth';
// import { ImageWithFallback } from './figma/ImageWithFallback';
// import '../styles/signup-page.css';
// import { Capacitor } from '@capacitor/core';

// export default function SignupPage() {
//   const navigate = useNavigate();
//   // const [searchParams] = useSearchParams(); // ❌ URL 파라미터 의존성 제거

//   // const [userId, setUserId] = useState<string | null>(null); // ❌ 불필요한 state 제거
//   const [nickname, setNickname] = useState('');
//   const [name, setName] = useState('');
//   const [profileImage, setProfileImage] = useState('');

//   // 위치 정보 상태
//   const [location, setLocation] = useState<{ lat: string; lon: string } | null>(null);
//   const [isLocationLoading, setIsLocationLoading] = useState(false);
//   const [locationError, setLocationError] = useState<string | null>(null);

//   const [isLoading, setIsLoading] = useState(false);
//   const [isImageUploading, setIsImageUploading] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(true);
//   const [error, setError] = useState('');
//   // ✅ [수정] 페이지 로드 시 토큰 검사 및 초기 데이터 세팅
//   useEffect(() => {
//     const initializePage = async () => {
//       try {
//         const token = await getValidAuthToken();
        
//         if (!token) {
//           alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
//           navigate('/login', { replace: true });
//           return;
//         }

//         // 기존에 저장된(소셜 로그인 등에서 온) 정보가 있다면 미리 채워주기
//         // const tempUserInfo = getUserInfo();
//         // if (tempUserInfo) {
//         //   if (!name) setName(tempUserInfo.name || '');
//         //   if (!nickname) setNickname(tempUserInfo.nickname || tempUserInfo.name || '');
//         //   if (!profileImage) setProfileImage(tempUserInfo.profileImage || '');
//         // }
//       } catch (err) {
//         console.error("Initialization error:", err);
//       } finally {
//         setIsInitializing(false);
//       }
//     };

//     initializePage();
//   }, [navigate]);

//   // 위치 정보 가져오기 핸들러
//   const handleGetLocation = async () => {
//     setIsLocationLoading(true);
//     setLocationError(null);

//     try {
//       // 1. 플랫폼이 웹이 아닌 경우(네이티브) 권한 체크 및 요청 수행
//       if (Capacitor.isNativePlatform()) {
//         const permissionStatus = await Geolocation.checkPermissions();

//         // 권한이 없거나 물어봐야 하는 상태라면 요청
//         if (permissionStatus.location !== 'granted') {
//           const requestStatus = await Geolocation.requestPermissions();
          
//           if (requestStatus.location !== 'granted') {
//             throw new Error("위치 권한이 거부되었습니다. 휴대폰 설정에서 앱의 위치 권한을 허용해주세요.");
//           }
//         }
//       }

//       // 2. 현재 위치 가져오기
//       const position = await Geolocation.getCurrentPosition({
//         enableHighAccuracy: true,
//         timeout: 10000,
//       });

//       const { latitude, longitude } = position.coords;
      
//       // 상태 업데이트 (문자열로 변환하여 저장)
//       setLocation({ 
//         lat: latitude.toString(), 
//         lon: longitude.toString() 
//       });
      
//       console.log(`위치 갱신 완료: ${latitude}, ${longitude}`);

//     } catch (err: any) {
//       console.error("위치 정보 에러:", err);
//       let msg = "위치 정보를 가져올 수 없습니다.";
      
//       if (err.message) {
//         msg = err.message;
//       } else if (err.code === 1) { // 웹 환경에서의 권한 거부 코드
//         msg = "위치 정보 권한이 거부되었습니다. 브라우저/설정에서 권한을 허용해주세요.";
//       }
      
//       setLocationError(msg);
//       alert(msg);
//     } finally {
//       setIsLocationLoading(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     if (!nickname.trim() || !name.trim()) {
//       setError('이름과 닉네임은 필수 항목입니다.');
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const defaultProfileImage = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png';
//       const finalProfileImage = profileImage || defaultProfileImage;

//       // ✅ [수정] signupUser 호출 (userId 인자 제거됨)
//       // auth.ts에서 내부적으로 토큰을 사용하여 요청을 보냅니다.
//       const registeredUser = await signupUser(
//         nickname,
//         finalProfileImage,
//         name,
//         location?.lat ? Number(location.lat) : null,
//         location?.lon ? Number(location.lon) : null,
//       );

//       if (registeredUser) {
//         console.log("회원가입 완료, 정보 저장:", registeredUser);
        
//         // 1. 반환된 최신 유저 정보 저장
//         saveUserInfo(registeredUser);
        
//         // 2. 페이지 이동
//         navigate('/verify-phone', { replace: true });
//       } else {
//         setError('회원가입 요청이 실패했습니다.');
//       }

//     } catch (err: any) {
//       const errorMessage = err.message || '알 수 없는 오류가 발생했습니다.';
//       setError(errorMessage);
//       console.error("Signup failed:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ... (handleImageUpload 함수 및 UI 렌더링 부분 기존 유지) ...
//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     try {
//       setIsImageUploading(true); // 업로드 시작 -> 버튼 비활성화

//       // 2. 실제 서버로 업로드
//       console.log("이미지 업로드 시작...");
//       const uploadedUrl = await uploadImage(file);
//       console.log("이미지 업로드 완료:", uploadedUrl);

//       // 3. 서버에서 받은 URL로 상태 업데이트
//       setProfileImage(uploadedUrl);
      
//     } catch (err) {
//       console.error("이미지 업로드 실패:", err);
//       alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
//       // 실패 시 이미지를 비우거나 기존 상태 유지
//       setProfileImage(''); 
//     } finally {
//       setIsImageUploading(false); // 업로드 종료
//     }
//   };

//   return (
//     <div className="signup-page">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="signup-container"
//       >
//         <div className="signup-card">
//           <div className="signup-header">
//             <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#111827' }}>프로필 설정</h1>
//             <p style={{ color: '#4b5563' }}>보물찾기를 시작하기 위한 정보를 입력해주세요</p>
//           </div>

//           <form onSubmit={handleSubmit} className="signup-form">
//             <div className="profile-image-section">
//               <div className="profile-image-wrapper">
//                 <div className="profile-image-container">
//                   {profileImage ? (
//                     <ImageWithFallback
//                       src={profileImage}
//                       alt="Profile"
//                       className="profile-img"
//                     />
//                   ) : (
//                     <div className="profile-placeholder">
//                       <Camera style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
//                     </div>
//                   )}
//                 </div>
//                 <label htmlFor="profile-image" className="profile-image-btn">
//                   <Camera style={{ width: '1rem', height: '1rem', color: 'white' }} />
//                   <input
//                     id="profile-image"
//                     type="file"
//                     accept="image/*"
//                     onChange={handleImageUpload}
//                     style={{ display: 'none' }}
//                   />
//                 </label>
//               </div>
//               <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.75rem' }}>프로필 사진 (선택)</p>
              
//             </div>

//             <div className="form-field">
//               <Label htmlFor="name">이름 *</Label>
//               <Input
//                 id="name"
//                 type="text"
//                 placeholder="홍길동"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 style={{ height: '3rem', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
//                 required
//               />
//             </div>

//             <div className="form-field">
//               <Label htmlFor="nickname">닉네임 *</Label>
//               <Input
//                 id="nickname"
//                 type="text"
//                 placeholder="보물사냥꾼"
//                 value={nickname}
//                 onChange={(e) => setNickname(e.target.value)}
//                 style={{ height: '3rem', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
//                 required
//               />
//               <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>다른 사용자에게 표시되는 이름입니다</p>
//             </div>
//             <div className="form-field">
//               <Label>선호 위치 *</Label>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
//                 <Button
//                   type="button"
//                   onClick={handleGetLocation}
//                   disabled={isLocationLoading}
//                   variant="outline"
//                   style={{
//                     height: '3rem',
//                     backgroundColor: location ? '#f0fdf4' : '#f9fafb',
//                     borderColor: location ? '#22c55e' : '#e5e7eb',
//                     color: location ? '#15803d' : '#374151',
//                     justifyContent: 'center',
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '0.5rem',
//                     width: '100%'
//                   }}
//                 >
//                   {isLocationLoading ? (
//                     <>
//                       <Loader2 className="animate-spin" size={18} /> 위치 확인 중...
//                     </>
//                   ) : location ? (
//                     <>
//                       <MapPin size={18} /> 위치 등록 완료
//                     </>
//                   ) : (
//                     <>
//                       <MapPin size={18} /> 현재 위치 등록하기
//                     </>
//                   )}
//                 </Button>
                
//                 {locationError && (
//                   <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{locationError}</p>
//                 )}
//                 {location && (
//                   <p style={{ fontSize: '0.875rem', color: '#16a34a' }}>
//                     위도: {parseFloat(location.lat).toFixed(4)}, 경도: {parseFloat(location.lon).toFixed(4)}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {error && (
//               <motion.div
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="error-message"
//               >
//                 <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
//               </motion.div>
//             )}

//             <Button
//               type="submit"
//               disabled={isLoading}
//               style={{
//                 width: '100%',
//                 height: '3.5rem',
//                 backgroundColor: 'var(--primary)',
//                 color: 'white',
//                 boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
//               }}
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} className="spinner" />
//                   가입 중...
//                 </>
//               ) : (
//                 '시작하기'
//               )}
//             </Button>
//           </form>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// src/components/SignupPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, Loader2, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Geolocation } from '@capacitor/geolocation';
import { uploadImage } from '../utils/file';
import { signupUser, saveUserInfo, getValidAuthToken } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/signup-page.css';
import { Capacitor } from '@capacitor/core';
import { Dialog } from "@capacitor/dialog";

export default function SignupPage() {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // 위치 정보 상태
  const [location, setLocation] = useState<{ lat: string; lon: string } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState('');

  // ✅ [수정] 페이지 로드 시 토큰 검사 및 초기 데이터 세팅
  useEffect(() => {
    const initializePage = async () => {
      try {
        const token = await getValidAuthToken();
        
        if (!token) {
          await Dialog.alert({ title: '알림', message: "로그인 정보가 없습니다. 다시 로그인해주세요." });
          navigate('/login', { replace: true });
          return;
        }

        // 기존에 저장된(소셜 로그인 등에서 온) 정보가 있다면 미리 채워주기
        // const tempUserInfo = getUserInfo();
        // if (tempUserInfo) {
        //   if (!name) setName(tempUserInfo.name || '');
        //   if (!nickname) setNickname(tempUserInfo.nickname || tempUserInfo.name || '');
        //   if (!profileImage) setProfileImage(tempUserInfo.profileImage || '');
        // }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializePage();
  }, [navigate]);

  // 위치 정보 가져오기 핸들러
  const handleGetLocation = async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    try {
      // 1. 플랫폼이 웹이 아닌 경우(네이티브) 권한 체크 및 요청 수행
      if (Capacitor.isNativePlatform()) {
        const permissionStatus = await Geolocation.checkPermissions();

        // 권한이 없거나 물어봐야 하는 상태라면 요청
        if (permissionStatus.location !== 'granted') {
          const requestStatus = await Geolocation.requestPermissions();
          
          if (requestStatus.location !== 'granted') {
            throw new Error("위치 권한이 거부되었습니다. 휴대폰 설정에서 앱의 위치 권한을 허용해주세요.");
          }
        }
      }

      // 2. 현재 위치 가져오기
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const { latitude, longitude } = position.coords;
      
      // 상태 업데이트 (문자열로 변환하여 저장)
      setLocation({ 
        lat: latitude.toString(), 
        lon: longitude.toString() 
      });
      
      console.log(`위치 갱신 완료: ${latitude}, ${longitude}`);

    } catch (err: any) {
      console.error("위치 정보 에러:", err);
      let msg = "위치 정보를 가져올 수 없습니다.";
      
      if (err.message) {
        msg = err.message;
      } else if (err.code === 1) { // 웹 환경에서의 권한 거부 코드
        msg = "위치 정보 권한이 거부되었습니다. 브라우저/설정에서 권한을 허용해주세요.";
      }
      
      setLocationError(msg);
      await Dialog.alert({ title: '알림', message: msg });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || !name.trim()) {
      setError('이름과 닉네임은 필수 항목입니다.');
      return;
    }

    setIsLoading(true);

    try {
      const defaultProfileImage = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png';
      const finalProfileImage = profileImage || defaultProfileImage;

      // ✅ [수정] signupUser 호출 (userId 인자 제거됨)
      // auth.ts에서 내부적으로 토큰을 사용하여 요청을 보냅니다.
      const registeredUser = await signupUser(
        nickname,
        finalProfileImage,
        name,
        location?.lat ? Number(location.lat) : null,
        location?.lon ? Number(location.lon) : null,
      );

      if (registeredUser) {
        console.log("회원가입 완료, 정보 저장:", registeredUser);
        
        // 1. 반환된 최신 유저 정보 저장
        saveUserInfo(registeredUser);
        
        // 2. 페이지 이동
        navigate('/verify-phone', { replace: true });
      } else {
        setError('회원가입 요청이 실패했습니다.');
      }

    } catch (err: any) {
      const errorMessage = err.message || '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error("Signup failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ [수정] 이미지 업로드 핸들러 (API 연결 및 async 적용)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImageUploading(true); // 업로드 시작 -> 버튼 비활성화

      // 2. 실제 서버로 업로드
      console.log("이미지 업로드 시작...");
      const uploadedUrl = await uploadImage(file);
      console.log("이미지 업로드 완료:", uploadedUrl);

      // 3. 서버에서 받은 URL로 상태 업데이트
      setProfileImage(uploadedUrl);
      
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      await Dialog.alert({ title: '알림', message: "이미지 업로드에 실패했습니다. 다시 시도해주세요." });
      // 실패 시 이미지를 비우거나 기존 상태 유지
      setProfileImage(''); 
    } finally {
      setIsImageUploading(false); // 업로드 종료
    }
  };

  // ✅ [추가] 초기화 중일 때 로딩 화면 보여주기 (isInitializing 사용)
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="signup-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="signup-container"
      >
        <div className="signup-card">
          <div className="signup-header">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#111827' }}>프로필 설정</h1>
            <p style={{ color: '#4b5563' }}>보물찾기를 시작하기 위한 정보를 입력해주세요</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="profile-image-section">
              <div className="profile-image-wrapper">
                <div className="profile-image-container">
                  {/* ✅ [수정] 업로드 중일 때 로딩 표시 */}
                  {isImageUploading ? (
                    <div className="profile-placeholder">
                       <Loader2 className="animate-spin text-primary" style={{ width: '2rem', height: '2rem' }} />
                    </div>
                  ) : profileImage ? (
                    <ImageWithFallback
                      src={profileImage}
                      alt="Profile"
                      className="profile-img"
                    />
                  ) : (
                    <div className="profile-placeholder">
                      <Camera style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
                    </div>
                  )}
                </div>
                {/* ✅ [수정] 업로드 중일 때 버튼 비활성화 */}
                <label 
                  htmlFor="profile-image" 
                  className={`profile-image-btn ${isImageUploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <Camera style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={isImageUploading}
                  />
                </label>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.75rem' }}>
                {isImageUploading ? '사진 올리는 중...' : '프로필 사진 (선택)'}
              </p>
            </div>

            <div className="form-field">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ height: '3rem', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                required
              />
            </div>

            <div className="form-field">
              <Label htmlFor="nickname">닉네임 *</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="보물사냥꾼"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={{ height: '3rem', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                required
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>다른 사용자에게 표시되는 이름입니다</p>
            </div>
            <div className="form-field">
              <Label>선호 위치 *</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocationLoading}
                  variant="outline"
                  style={{
                    height: '3rem',
                    backgroundColor: location ? '#f0fdf4' : '#f9fafb',
                    borderColor: location ? '#22c55e' : '#e5e7eb',
                    color: location ? '#15803d' : '#374151',
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%'
                  }}
                >
                  {isLocationLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> 위치 확인 중...
                    </>
                  ) : location ? (
                    <>
                      <MapPin size={18} /> 위치 등록 완료
                    </>
                  ) : (
                    <>
                      <MapPin size={18} /> 현재 위치 등록하기
                    </>
                  )}
                </Button>
                
                {locationError && (
                  <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{locationError}</p>
                )}
                {location && (
                  <p style={{ fontSize: '0.875rem', color: '#16a34a' }}>
                    위도: {parseFloat(location.lat).toFixed(4)}, 경도: {parseFloat(location.lon).toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message"
              >
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              // ✅ [수정] 로딩 중이거나 이미지 업로드 중이면 버튼 비활성화
              disabled={isLoading || isImageUploading}
              style={{
                width: '100%',
                height: '3.5rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} className="spinner" />
                  가입 중...
                </>
              ) : isImageUploading ? (
                <>
                  <Loader2 style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} className="animate-spin" />
                  사진 올리는 중...
                </>
              ) : (
                '시작하기'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}