import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Image as ImageIcon,
  X,
  AlertCircle,
  Send,
  Loader2,
} from "lucide-react";
import { useTheme } from "../utils/theme";
import { getValidAuthToken, getUserInfo, getUserProfile } from "../utils/auth";
import { fetchChatRoomDetail } from "../utils/chat";
import { uploadImage } from "../utils/file";
import "../styles/review-page.css";

interface ReviewData {
  title: string;
  content: string;
  score: number;
  images: File[];
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const currentUser = getUserInfo();

  const [partner, setPartner] = useState<{ id: number; nickname: string; profileImage: string } | null>(null);
  const [postId, setPostId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reviewData, setReviewData] = useState<ReviewData>({
    title: "",
    content: "",
    score: 50,
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    score?: string;
  }>({});

  useEffect(() => {
    if (paramId && currentUser) {
      if (location.pathname.includes('/chat/')) {
        loadChatRoomInfo(paramId);
      } else {
        loadDirectUserInfo(paramId);
      }
    }
  }, [paramId, location.pathname]);

  // Case 1: 채팅방 ID로 정보 로드
  const loadChatRoomInfo = async (chatRoomId: string) => {
    setIsLoading(true);
    try {
      const roomData = await fetchChatRoomDetail(chatRoomId);
      const partnerInfo = roomData.participants.find(p => p.id !== Number(currentUser?.id));
      
      if (partnerInfo) {
        // [추가] 자기 자신 체크
        if (partnerInfo.id === Number(currentUser?.id)) {
            alert("자기 자신에게는 후기를 작성할 수 없습니다.");
            navigate(-1);
            return;
        }

        setPartner({
          id: partnerInfo.id,
          nickname: partnerInfo.nickname || "알 수 없음",
          profileImage: partnerInfo.profileImage || "https://via.placeholder.com/150?text=User"
        });
      } else {
        throw new Error("대화 상대방을 찾을 수 없습니다.");
      }

      if (roomData.post?.id) {
        setPostId(roomData.post.id);
      }

    } catch (error) {
      console.error("채팅방 정보 로드 실패:", error);
      alert("정보를 불러오는데 실패했습니다.");
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  // Case 2: 유저 ID로 정보 로드
  const loadDirectUserInfo = async (targetUserId: string) => {
    // [추가] 자기 자신 체크
    if (Number(targetUserId) === Number(currentUser?.id)) {
        alert("자기 자신에게는 후기를 작성할 수 없습니다.");
        navigate(-1);
        return;
    }

    setIsLoading(true);
    try {
      const userData = await getUserProfile(targetUserId);
      if (userData) {
         setPartner({
            id: userData.id,
            nickname: userData.nickname,
            profileImage: userData.profileImage || "https://via.placeholder.com/150?text=User"
         });
         setPostId(null); 
      } else {
          throw new Error("사용자 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
      alert("사용자 정보를 불러올 수 없습니다.");
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setReviewData({ ...reviewData, score: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (reviewData.images.length + files.length > 5) {
      alert("최대 5장까지만 업로드할 수 있습니다.");
      return;
    }
    const newImages = [...reviewData.images, ...files];
    setReviewData({ ...reviewData, images: newImages });

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = reviewData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]);
    setReviewData({ ...reviewData, images: newImages });
    setImagePreviews(newPreviews);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!reviewData.title.trim()) newErrors.title = "제목을 입력해주세요.";
    if (!reviewData.content.trim()) {
      newErrors.content = "후기 내용을 입력해주세요.";
    } else if (reviewData.content.length < 10) {
      newErrors.content = "최소 10자 이상 입력해주세요.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // [추가] 제출 전 다시 한번 자기 자신 체크
    if (partner?.id === Number(currentUser?.id)) {
        alert("자기 자신에게는 후기를 작성할 수 없습니다.");
        return;
    }

    if (!partner?.id) {
      alert("후기 대상 정보가 없어 작성할 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getValidAuthToken();
      if (!token) throw new Error("로그인이 필요합니다.");

      const imageUrls: string[] = [];
      if (reviewData.images.length > 0) {
        const uploadPromises = reviewData.images.map(file => uploadImage(file));
        const results = await Promise.all(uploadPromises);
        imageUrls.push(...results);
      }

      const payload = {
        title: reviewData.title,
        content: reviewData.content,
        score: reviewData.score,
        targetUserId: partner.id,
        images: imageUrls 
      };

      const response = await fetch(`${API_BASE_URL}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "후기 등록에 실패했습니다.");
      }

      if (postId) {
        try {
          await fetch(`${API_BASE_URL}/post/${postId}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        } catch (completeError) {
          console.warn("게시글 완료 처리 실패 (후기는 등록됨)", completeError);
        }
      }

      alert("후기가 소중하게 전달되었습니다!");
      navigate(-1); 

    } catch (error) {
      console.error("후기 등록 오류:", error);
      alert(`후기 등록 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI Helpers
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#fb923c";
    return "#ef4444";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "🌟";
    if (score >= 80) return "😄";
    if (score >= 70) return "😊";
    if (score >= 60) return "🙂";
    if (score >= 50) return "😐";
    if (score >= 40) return "😕";
    if (score >= 30) return "😞";
    return "😢";
  };

  if (isLoading) {
    return (
      <div className={`review-page ${theme} flex items-center justify-center min-h-screen`}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-gray-500">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className={`review-page ${theme} flex items-center justify-center min-h-screen`}>
        <div className="text-center p-6">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">상대방 정보를 찾을 수 없습니다</h3>
          <button onClick={() => navigate(-1)} className="back-button-error-review">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`review-page ${theme}`}>
      {/* Header */}
      <div className="review-header">
        <button
          className="back-btn-review"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          <ArrowLeft size={24} />
        </button>
        <h1>후기 작성</h1>
        <div className="header-spacer" />
      </div>

      {/* Content */}
      <div className="review-content">
        {/* User Info Card */}
        <div className="user-card-review">
          <img
            src={partner.profileImage}
            alt={partner.nickname}
            className="user-avatar-review"
          />
          <div className="user-info-review">
            <p className="user-nickname-review">{partner.nickname}</p>
            <p className="user-subtitle-review">님과의 거래는 어떠셨나요?</p>
          </div>
        </div>

        {/* Score Section */}
        <div className="score-section-review">
          <div className="score-header-review">
            <Star size={20} style={{ color: getScoreColor(reviewData.score) }} />
            <span>만족도 평가</span>
          </div>
          
          <div className="score-display-review">
            <span className="score-emoji">{getScoreEmoji(reviewData.score)}</span>
            <span className="score-number-review" style={{ color: getScoreColor(reviewData.score) }}>
              {reviewData.score}
            </span>
            <span className="score-max-review">점</span>
          </div>

          <input
            type="range"
            min="1"
            max="100"
            value={reviewData.score}
            onChange={handleScoreChange}
            className="score-slider-review"
            style={{
              background: `linear-gradient(to right, ${getScoreColor(reviewData.score)} 0%, ${getScoreColor(reviewData.score)} ${reviewData.score}%, #e5e7eb ${reviewData.score}%, #e5e7eb 100%)`,
            }}
          />

          <div className="score-labels-review">
            <span>아쉬워요</span>
            <span>보통이에요</span>
            <span>최고예요</span>
          </div>
        </div>

        {/* Title Input */}
        <div className="form-group-review">
          <label className="form-label-review">제목</label>
          <input
            type="text"
            placeholder="후기 제목을 입력해주세요"
            value={reviewData.title}
            onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
            className={`form-input-review ${errors.title ? "error" : ""}`}
            maxLength={50}
            disabled={isSubmitting}
          />
          {errors.title && <p className="error-message-review">{errors.title}</p>}
        </div>

        {/* Content Input */}
        <div className="form-group-review">
          <label className="form-label-review">상세 내용</label>
          <textarea
            placeholder="거래하며 좋았던 점이나 아쉬웠던 점을 솔직하게 적어주세요. (최소 10자)"
            value={reviewData.content}
            onChange={(e) => setReviewData({ ...reviewData, content: e.target.value })}
            className={`form-textarea-review ${errors.content ? "error" : ""}`}
            maxLength={500}
            rows={5}
            disabled={isSubmitting}
          />
          {errors.content && <p className="error-message-review">{errors.content}</p>}
          <p className="char-count-review">{reviewData.content.length}/500</p>
        </div>

        {/* Image Upload */}
        <div className="form-group-review">
          <label className="form-label-review">사진 첨부 (선택)</label>
          
          {imagePreviews.length > 0 && (
            <div className="image-preview-grid-review">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview-item-review">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    className="remove-image-btn-review"
                    onClick={() => removeImage(index)}
                    disabled={isSubmitting}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {imagePreviews.length < 5 && (
            <label className="image-upload-btn-review">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isSubmitting}
                style={{ display: "none" }}
              />
              <ImageIcon size={20} />
              <span>사진 추가 ({imagePreviews.length}/5)</span>
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          className="submit-btn-review"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              <span>등록 중...</span>
            </>
          ) : (
            <>
              <Send size={20} className="mr-2" />
              <span>후기 등록 완료</span>
            </>
          )}
        </button>

        <div className="info-message-review">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <p>후기는 수정할 수 없으며, 허위 사실 기재 시 이용이 제한될 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;