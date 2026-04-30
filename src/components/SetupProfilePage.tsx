// src/components/SetupProfilePage.tsx
// NOT_REGISTERED 소셜 사용자가 홈 배너를 통해 진입하는 프로필 설정 페이지

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, Loader2, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Geolocation } from '@capacitor/geolocation';
import { uploadImage } from '../utils/file';
import { signupUser, saveUserInfo, getValidAuthToken } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import '../styles/signup-page.css';

export default function SetupProfilePage() {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // 위치 정보
  const [location, setLocation] = useState<{ lat: string; lon: string } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState('');

  // 토큰 유효성 확인
  useEffect(() => {
    const initializePage = async () => {
      try {
        const token = await getValidAuthToken();
        if (!token) {
          await Dialog.alert({ title: '알림', message: '로그인 정보가 없습니다. 다시 로그인해주세요.' });
          navigate('/login', { replace: true });
          return;
        }
      } catch (err) {
        console.error('SetupProfilePage init error:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    initializePage();
  }, [navigate]);

  // 위치 정보 가져오기
  const handleGetLocation = async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    try {
      if (Capacitor.isNativePlatform()) {
        const permissionStatus = await Geolocation.checkPermissions();
        if (permissionStatus.location !== 'granted') {
          const requestStatus = await Geolocation.requestPermissions();
          if (requestStatus.location !== 'granted') {
            throw new Error('위치 권한이 거부되었습니다. 휴대폰 설정에서 앱의 위치 권한을 허용해주세요.');
          }
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude.toString(), lon: longitude.toString() });
    } catch (err: any) {
      console.error('위치 정보 에러:', err);
      let msg = '위치 정보를 가져올 수 없습니다.';
      if (err.message) msg = err.message;
      else if (err.code === 1) msg = '위치 정보 권한이 거부되었습니다. 브라우저/설정에서 권한을 허용해주세요.';
      setLocationError(msg);
      await Dialog.alert({ title: '알림', message: msg });
    } finally {
      setIsLocationLoading(false);
    }
  };

  // 폼 제출 — 완료 후 홈으로 이동
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || !name.trim()) {
      setError('이름과 닉네임은 필수 항목입니다.');
      return;
    }

    setIsLoading(true);

    try {
      const defaultProfileImage =
        'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png';
      const finalProfileImage = profileImage || defaultProfileImage;

      const registeredUser = await signupUser(
        nickname,
        finalProfileImage,
        name,
        location?.lat ? Number(location.lat) : null,
        location?.lon ? Number(location.lon) : null,
      );

      if (registeredUser) {
        saveUserInfo(registeredUser);
        // 프로필 설정 완료 → 홈으로 복귀 (SignupPage와의 차이점)
        navigate('/home', { replace: true });
      } else {
        setError('프로필 설정 요청이 실패했습니다.');
      }
    } catch (err: any) {
      const errorMessage = err.message || '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('SetupProfile failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImageUploading(true);
      const uploadedUrl = await uploadImage(file);
      setProfileImage(uploadedUrl);
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      await Dialog.alert({ title: '알림', message: '이미지 업로드에 실패했습니다. 다시 시도해주세요.' });
      setProfileImage('');
    } finally {
      setIsImageUploading(false);
    }
  };

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
          {/* 헤더 */}
          <div className="signup-header" style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => navigate('/home')}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.25rem',
              }}
              aria-label="홈으로 돌아가기"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#111827' }}>
              프로필 설정
            </h1>
            <p style={{ color: '#4b5563' }}>닉네임과 프로필 사진을 설정해주세요</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            {/* 프로필 사진 */}
            <div className="profile-image-section">
              <div className="profile-image-wrapper">
                <div className="profile-image-container">
                  {isImageUploading ? (
                    <div className="profile-placeholder">
                      <Loader2 className="animate-spin text-primary" style={{ width: '2rem', height: '2rem' }} />
                    </div>
                  ) : profileImage ? (
                    <ImageWithFallback src={profileImage} alt="Profile" className="profile-img" />
                  ) : (
                    <div className="profile-placeholder">
                      <Camera style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
                    </div>
                  )}
                </div>
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

            {/* 이름 */}
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

            {/* 닉네임 */}
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

            {/* 위치 */}
            <div className="form-field">
              <Label>선호 위치 (선택)</Label>
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
                    width: '100%',
                  }}
                >
                  {isLocationLoading ? (
                    <><Loader2 className="animate-spin" size={18} /> 위치 확인 중...</>
                  ) : location ? (
                    <><MapPin size={18} /> 위치 등록 완료</>
                  ) : (
                    <><MapPin size={18} /> 현재 위치 등록하기</>
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

            {/* 에러 메시지 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message"
              >
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
              </motion.div>
            )}

            {/* 제출 버튼 */}
            <Button
              type="submit"
              disabled={isLoading || isImageUploading}
              style={{
                width: '100%',
                height: '3.5rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} className="spinner" />
                  설정 중...
                </>
              ) : isImageUploading ? (
                <>
                  <Loader2 style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} className="animate-spin" />
                  사진 올리는 중...
                </>
              ) : (
                '설정 완료'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
