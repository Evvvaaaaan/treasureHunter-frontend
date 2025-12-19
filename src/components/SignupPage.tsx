import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, Loader2, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { signupUser, saveUserInfo, getUserInfo, checkToken, clearTokens } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/signup-page.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // 위치 정보 상태
  const [location, setLocation] = useState<{ lat: string; lon: string } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const idFromUrl = searchParams.get('userId');
    const tempUserInfo = getUserInfo();

    if (!idFromUrl) {
      setError('잘못된 접근입니다. 세션을 초기화하고 로그인 페이지로 이동합니다.');
      clearTokens();
      setTimeout(() => navigate('/login', { replace: true }), 2000);
      return;
    }

    setUserId(idFromUrl);

    if (tempUserInfo) {
      setName(tempUserInfo.name || '');
      setNickname(tempUserInfo.name || '');
      setProfileImage(tempUserInfo.profileImage || '');
    }
  }, [navigate, searchParams]);

  // [수정됨] MapPage.tsx의 handleMyLocationClick 로직을 그대로 적용
  const handleGetLocation = () => {
    setIsLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("브라우저에서 위치 정보를 지원하지 않습니다.");
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // 성공 시 상태 업데이트
        setLocation({
          lat: latitude.toString(),
          lon: longitude.toString()
        });
        setIsLocationLoading(false);
      },
      (error) => {
        setIsLocationLoading(false);
        console.error("Error getting location:", error);
        
        // MapPage.tsx의 에러 메시지 처리 로직과 동일하게 구성
        let errorMessage = '위치 정보를 가져올 수 없습니다. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += '위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += '현재 위치를 확인할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage += '위치 정보를 가져오는 데 시간이 초과되었습니다.';
            break;
          default:
            errorMessage += '알 수 없는 오류가 발생했습니다.';
        }
        setLocationError(errorMessage);
      },
      {
        // MapPage.tsx와 동일한 옵션 사용
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('사용자 ID가 유효하지 않습니다. 다시 로그인 해주세요.');
      return;
    }

    if (!nickname.trim() || !name.trim()) {
      setError('이름과 닉네임은 필수 항목입니다.');
      return;
    }



    setIsLoading(true);

    try {
      const defaultProfileImage = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
      const finalProfileImage = profileImage || defaultProfileImage;

      const success = await signupUser(
        userId,
        nickname,
        finalProfileImage,
        name,
        location?.lat || null,
        location?.lon || null,
      );

      if (success) {
        const updatedUserInfo = await checkToken(userId);

        if (updatedUserInfo) {
          saveUserInfo(updatedUserInfo);
          navigate('/verify-phone');
        } else {
          setError('회원가입은 되었으나 정보 갱신에 실패했습니다. 다시 로그인해주세요.');
          setTimeout(() => navigate('/login'), 2000);
        }

      } else {
        setError('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (err: any) {
      const errorMessage = err.message;
      setError(errorMessage);
      console.error("Signup failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!userId && !error) {
    return (
      <div className="signup-page">
        <div className="flex flex-col items-center">
          <Loader2 className="spinner h-12 w-12 text-primary" />
          <p className="mt-4 text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
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
                  {profileImage ? (
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
                <label htmlFor="profile-image" className="profile-image-btn">
                  <Camera style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.75rem' }}>프로필 사진 (선택)</p>
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

            {/* 위치 등록 섹션 */}
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
              disabled={isLoading}
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