import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { signupUser, saveUserInfo } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/signup-page.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');

  const [formData, setFormData] = useState({
    nickname: '',
    profileImage: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('사용자 ID가 없습니다.');
      return;
    }

    if (!formData.nickname || !formData.name) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await signupUser(
        userId,
        formData.nickname,
        formData.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        formData.name
      );

      if (success) {
        saveUserInfo({
          id: userId,
          nickname: formData.nickname,
          profileImage: formData.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
          name: formData.name,
        });

        navigate('/home');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

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
            {/* Profile Image */}
            <div className="profile-image-section">
              <div className="profile-image-wrapper">
                <div className="profile-image-container">
                  {formData.profileImage ? (
                    <ImageWithFallback
                      src={formData.profileImage}
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

            {/* Name */}
            <div className="form-field">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ height: '3rem', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                required
              />
            </div>

            {/* Nickname */}
            <div className="form-field">
              <Label htmlFor="nickname">닉네임 *</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="보물사냥꾼"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                style={{ height: '3rem', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                required
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>다른 사용자에게 표시되는 이름입니다</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message"
              >
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
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
