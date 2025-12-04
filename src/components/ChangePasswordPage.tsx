import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../utils/theme';
import '../styles/change-password-page.css';

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 비밀번호 유효성 검사
  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const validation = validatePassword(newPassword);
  const isPasswordValid = Object.values(validation).every(v => v);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 입력 검증
    if (!currentPassword) {
      setError('현재 비밀번호를 입력해주세요.');
      return;
    }

    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (!isPasswordValid) {
      setError('비밀번호가 요구사항을 충족하지 않습니다.');
      return;
    }

    if (!passwordsMatch) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 성공 시
      alert('비밀번호가 성공적으로 변경되었습니다.');
      navigate(-1);
    } catch (err) {
      setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className={`validation-item ${isValid ? 'valid' : ''}`}>
      {isValid ? (
        <CheckCircle2 size={16} className="validation-icon" />
      ) : (
        <XCircle size={16} className="validation-icon" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className={`change-password-page ${theme}`}>
      {/* Header */}
      <div className="change-password-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>비밀번호 변경</h1>
        <div style={{ width: '44px' }} />
      </div>

      <div className="change-password-content">
        {/* Info Banner */}
        <div className="info-banner">
          <AlertCircle size={20} />
          <div className="info-text">
            <strong>보안을 위해 정기적으로 비밀번호를 변경해주세요</strong>
            <span>안전한 비밀번호는 계정을 보호합니다</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="password-form">
          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="current-password">현재 비밀번호</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, current: true })}
                placeholder="현재 비밀번호를 입력하세요"
                className="password-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label="비밀번호 표시/숨김"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="new-password">새 비밀번호</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, new: true })}
                placeholder="새 비밀번호를 입력하세요"
                className="password-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label="비밀번호 표시/숨김"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Validation */}
            {touched.new && newPassword && (
              <div className="validation-list">
                <ValidationItem isValid={validation.minLength} text="8자 이상" />
                <ValidationItem isValid={validation.hasUpperCase} text="대문자 포함" />
                <ValidationItem isValid={validation.hasLowerCase} text="소문자 포함" />
                <ValidationItem isValid={validation.hasNumber} text="숫자 포함" />
                <ValidationItem isValid={validation.hasSpecialChar} text="특수문자 포함" />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirm-password">새 비밀번호 확인</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, confirm: true })}
                placeholder="새 비밀번호를 다시 입력하세요"
                className="password-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="비밀번호 표시/숨김"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {touched.confirm && confirmPassword && (
              <div className={`match-indicator ${passwordsMatch ? 'match' : 'no-match'}`}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>비밀번호가 일치합니다</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    <span>비밀번호가 일치하지 않습니다</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || !currentPassword || !isPasswordValid || !passwordsMatch}
          >
            {isLoading ? (
              <>
                <div className="button-spinner" />
                <span>변경 중...</span>
              </>
            ) : (
              <>
                <Lock size={20} />
                <span>비밀번호 변경</span>
              </>
            )}
          </button>
        </form>

        {/* Security Tips */}
        <div className="security-tips">
          <h3>💡 안전한 비밀번호 만들기 팁</h3>
          <ul>
            <li>개인정보(이름, 생년월일 등)를 포함하지 마세요</li>
            <li>다른 사이트와 동일한 비밀번호를 사용하지 마세요</li>
            <li>주기적으로 비밀번호를 변경하세요</li>
            <li>비밀번호를 다른 사람과 공유하지 마세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
