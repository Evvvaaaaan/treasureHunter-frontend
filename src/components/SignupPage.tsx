import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
// [MODIFIED] clearTokens 및 checkToken을 import에 추가합니다.
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const idFromUrl = searchParams.get('userId');
    const tempUserInfo = getUserInfo();

    if (!idFromUrl) {
      // [MODIFIED] 비정상 접근 시, 세션을 강제로 클리어하고 /login으로 보냅니다.
      setError('잘못된 접근입니다. 세션을 초기화하고 로그인 페이지로 이동합니다.');
      clearTokens(); // <-- 이 코드가 핵심입니다.
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

      // [MODIFIED] signupUser 함수는 이제 에러 발생 시 throw하므로, 결과를 받아서 처리합니다.
      const success = await signupUser(
        userId,
        nickname,
        finalProfileImage,
        name
      );

      if (success) {
        // [MODIFIED] 회원가입 성공 시, 최신 유저 정보(role 포함)를 다시 가져옵니다.
        const updatedUserInfo = await checkToken(userId);

        if (updatedUserInfo) {
          // 업데이트된 최신 정보를 로컬 스토리지에 저장합니다.
          saveUserInfo(updatedUserInfo);

          // [MODIFIED] '/home' 대신 '/verify-phone'으로 이동합니다.
          navigate('/verify-phone');
        } else {
          // 혹시 모를 예외 처리
          setError('회원가입은 되었으나 정보 갱신에 실패했습니다. 다시 로그인해주세요.');
          setTimeout(() => navigate('/login'), 2000);
        }

      } else {
        // signupUser가 false를 반환하는 경우 (일반적인 실패)
        setError('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (err: any) {
      // [MODIFIED] 백엔드에서 전달된 에러 메시지를 표시합니다.
      // err 객체가 Error 타입이거나 메시지를 가지고 있다면 그 메시지를 사용합니다.
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
                    // 2. 'ImageWithFallback' 컴포넌트의 속성에서 'fallbackSrc'를 제거하여 ts(2322) 오류를 해결합니다.
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