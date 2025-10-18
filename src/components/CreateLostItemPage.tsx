import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  X,
  MapPin,
  Calendar as CalendarIcon,
  Upload,
  Loader2,
  ChevronLeft,
  Check,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { getUserInfo, getUserProfile, type UserInfo } from '../utils/auth';
import '../styles/create-lost-item.css';

interface FormData {
  itemType: 'lost' | 'found';
  itemName: string;
  category: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  rewardPoints: number;
  lostDate: string;
  photos: File[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const CATEGORIES = [
  { value: '휴대폰', icon: '📱', color: '#3b82f6' },
  { value: '지갑', icon: '💳', color: '#8b5cf6' },
  { value: '열쇠', icon: '🔑', color: '#f59e0b' },
  { value: '가방', icon: '🎒', color: '#10b981' },
  { value: '전자기기', icon: '💻', color: '#06b6d4' },
  { value: '액세서리', icon: '💍', color: '#ec4899' },
  { value: '문서', icon: '📄', color: '#6366f1' },
  { value: '기타', icon: '📦', color: '#64748b' },
];

export default function CreateLostItemPage() {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(getUserInfo());
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userPoints, setUserPoints] = useState(1000);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    itemType: 'lost',
    itemName: '',
    category: '',
    description: '',
    contactEmail: userInfo?.email || '',
    contactPhone: '',
    rewardPoints: 0,
    lostDate: new Date().toISOString().split('T')[0],
    photos: [],
    location: {
      latitude: 37.5665,
      longitude: 126.9780,
      address: '', // Will be set when user selects location
    },
  });

  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);

  // Calculate progress (필수 필드 기준)
  const calculateProgress = () => {
    let completed = 0;
    let total = 6; // 필수 필드 개수
    
    // 필수 필드
    if (formData.itemName) completed++;
    if (formData.category) completed++;
    if (formData.description.length >= 100) completed++;
    if (formData.contactEmail || formData.contactPhone) completed++;
    if (formData.lostDate) completed++;
    
    // 위치는 항상 완료 (기본 위치 포함)
    completed++;
    
    // 선택사항 (진행률에 포함하지만 100% 달성에 필수 아님)
    if (formData.photos.length > 0) {
      total++;
      completed++;
    }
    if (formData.rewardPoints > 0) {
      total++;
      completed++;
    }
    
    return (completed / total) * 100;
  };

  const progress = calculateProgress();

  // Check if form is valid (필수 필드만 체크)
  const isFormValid = () => {
    const valid = (
      formData.itemName &&
      formData.category &&
      formData.description.length >= 100 &&
      (formData.contactEmail || formData.contactPhone) &&
      formData.lostDate
    );
    
    // 디버깅용 로그
    console.log('Form Validation:', {
      itemName: formData.itemName,
      category: formData.category,
      descriptionLength: formData.description.length,
      hasContact: !!(formData.contactEmail || formData.contactPhone),
      lostDate: formData.lostDate,
      isValid: valid
    });
    
    return valid;
  };

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || map) return;

    const initMap = () => {
      const googleMap = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: formData.location.latitude, lng: formData.location.longitude },
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      const mapMarker = new (window as any).google.maps.Marker({
        position: { lat: formData.location.latitude, lng: formData.location.longitude },
        map: googleMap,
        draggable: true,
      });

      googleMap.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        mapMarker.setPosition({ lat, lng });
        updateLocation(lat, lng);
      });

      mapMarker.addListener('dragend', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updateLocation(lat, lng);
      });

      setMap(googleMap);
      setMarker(mapMarker);
    };

    if ((window as any).google?.maps) {
      initMap();
    } else {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      
      if (existingScript) {
        existingScript.addEventListener('load', initMap);
      } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBN5hX-FL_N57xUwRVVuY4ExZQuro5Ti2s&loading=async&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        // Set up callback
        (window as any).initGoogleMaps = () => {
          initMap();
          delete (window as any).initGoogleMaps;
        };
        
        script.onerror = () => {
          console.error('Google Maps failed to load');
          setError('지도를 불러올 수 없습니다. 나중에 다시 시도해주세요.');
        };
        
        document.head.appendChild(script);
      }
    }
  }, []);

  const updateLocation = async (lat: number, lng: number) => {
    // Update location without geocoding (API not authorized)
    // Just use coordinates and a simple address format
    const simpleAddress = `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`;
    
    setFormData((prev) => ({
      ...prev,
      location: {
        latitude: lat,
        longitude: lng,
        address: simpleAddress,
      },
    }));

    // Optional: Try geocoding if API is available, but don't fail if not
    try {
      if ((window as any).google?.maps?.Geocoder) {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            setFormData((prev) => ({
              ...prev,
              location: {
                latitude: lat,
                longitude: lng,
                address: results[0].formatted_address,
              },
            }));
          }
        });
      }
    } catch (error) {
      // Geocoding failed, but we already have coordinates
      console.log('Geocoding not available, using coordinates');
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('위치 정보를 사용할 수 없습니다. 지도에서 직접 선택해주세요.');
      return;
    }

    // 위치 권한 요청 안내
    alert('정확한 위치를 표시하기 위해 위치 권한이 필요합니다.\n다음 단계에서 "허용"을 선택해주세요.');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (map && marker) {
          map.setCenter({ lat, lng });
          marker.setPosition({ lat, lng });
          updateLocation(lat, lng);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = '위치 정보를 가져올 수 없습니다. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += '위치 권한을 허용해주세요.';
            alert('위치 권한이 거부되었습니다.\n\n브라우저 설정에서 위치 권한을 허용하거나,\n지도를 직접 클릭하여 위치를 선택해주세요.');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage += '요청 시간이 초과되었습니다.';
            break;
          default:
            errorMessage += '지도에서 직접 선택해주세요.';
        }
        
        setError(errorMessage);
        // Clear error after 5 seconds
        setTimeout(() => setError(''), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle image upload
  const handleImageChange = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - formData.photos.length);
    
    // Compress and resize images
    const compressedFiles = await Promise.all(
      newFiles.map((file) => compressImage(file))
    );

    const newPreviews = await Promise.all(
      compressedFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...compressedFiles],
    }));
    setPhotosPreviews((prev) => [...prev, ...newPreviews]);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e.dataTransfer.files);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.itemName) return '분실물 이름을 입력해주세요.';
    if (!formData.category) return '카테고리를 선택해주세요.';
    if (formData.description.length < 100) return '상세 설명을 100자 이상 입력해주세요.';
    if (!formData.contactEmail && !formData.contactPhone) return '연락처를 하나 이상 입력해주세요.';
    if (!formData.lostDate) return '분실 날짜를 선택해주세요.';
    // Location is always valid (기본 위치 포함)
    // 사용자가 위치를 선택하지 않으면 기본 위치(서울)가 사용됨
    return null;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== 폼 제출 시작 ===');
    console.log('Form Data:', formData);
    console.log('Is Valid:', isFormValid());
    
    const validationError = validateForm();
    if (validationError) {
      console.error('Validation Error:', validationError);
      setError(validationError);
      alert(`입력 오류: ${validationError}`);
      return;
    }

    console.log('✓ 유효성 검사 통과');
    setIsLoading(true);
    setError('');

    try {
      console.log('API 호출 시작...');
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('✓ API 호출 성공');
      // In production, send to API:
      // const formDataToSend = new FormData();
      // formDataToSend.append('itemType', formData.itemType);
      // formDataToSend.append('itemName', formData.itemName);
      // ... append all fields
      // formData.photos.forEach((photo) => {
      //   formDataToSend.append('photos', photo);
      // });

      setSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      console.error('API Error:', err);
      setError('등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('draft_lost_item', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('draft_lost_item');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData((prev) => ({ ...prev, ...parsed, photos: [] }));
      } catch (e) {
        console.error('Failed to load draft');
      }
    }
  }, []);

  if (success) {
    return (
      <div className="create-success">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="success-icon"
        >
          <Check style={{ width: '3rem', height: '3rem', color: 'white' }} />
        </motion.div>
        <h2>등록 완료!</h2>
        <p>분실물이 성공적으로 등록되었습니다.</p>
      </div>
    );
  }

  return (
    <div className="create-lost-item-page">
      {/* Header */}
      <header className="create-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>
        <h1>분실물 등록</h1>
        <div style={{ width: '2.5rem' }} />
      </header>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="progress-text">{Math.round(progress)}% 완료</p>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        {/* Item Type Selection */}
        <div className="form-section">
          <div className="label-with-check">
            <Label>분실물 종류 *</Label>
            {formData.itemType && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <div className="item-type-buttons">
            <button
              type="button"
              className={`type-btn ${formData.itemType === 'lost' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, itemType: 'lost' })}
            >
              <span className="type-icon">🔍</span>
              <span>분실물</span>
            </button>
            <button
              type="button"
              className={`type-btn ${formData.itemType === 'found' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, itemType: 'found' })}
            >
              <span className="type-icon">✨</span>
              <span>습득물</span>
            </button>
          </div>
        </div>

        {/* Item Name */}
        <div className="form-section">
          <div className="label-with-check">
            <Label htmlFor="itemName">분실물 이름 *</Label>
            {formData.itemName && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <Input
            id="itemName"
            type="text"
            placeholder="예: 검은색 가죽 지갑"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            className="form-input"
          />
        </div>

        {/* Category */}
        <div className="form-section">
          <div className="label-with-check">
            <Label>카테고리 선택 *</Label>
            {formData.category && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`category-btn ${formData.category === cat.value ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, category: cat.value })}
                style={{
                  '--category-color': cat.color,
                } as React.CSSProperties}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-label">{cat.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="form-section">
          <div className="label-with-check">
            <Label htmlFor="description">
              상세 설명 * ({formData.description.length}/100)
            </Label>
            {formData.description.length >= 100 && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <Textarea
            id="description"
            placeholder="분실물의 특징, 브랜드, 색상, 크기 등을 자세히 설명해주세요. (최소 100자)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-textarea"
            style={{ minHeight: '8rem' }}
          />
        </div>

        {/* Photo Upload */}
        <div className="form-section">
          <div className="label-with-check">
            <Label>사진 업로드 (최대 5장, 선택사항)</Label>
            {formData.photos.length > 0 && (
              <span className="field-check completed">✓ {formData.photos.length}장 업로드됨</span>
            )}
          </div>
          <div
            className={`photo-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
            <p className="upload-text">클릭하거나 드래그하여 이미지 업로드</p>
            <p className="upload-hint">PNG, JPG (최대 1MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageChange(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>

          {photosPreviews.length > 0 && (
            <div className="photos-preview">
              {photosPreviews.map((preview, index) => (
                <div key={index} className="photo-preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                  >
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="form-section">
          <div className="label-with-check">
            <Label>분실 위치 (선택사항)</Label>
            {formData.location.address && (
              <span className="field-check completed">✓ 위치 설정됨</span>
            )}
          </div>
          <p className="location-hint">
            지도를 클릭하거나 마커를 드래그하여 위치를 선택하세요. 선택하지 않으면 기본 위치가 사용됩니다.
          </p>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="location-btn"
          >
            <MapPin style={{ width: '1rem', height: '1rem' }} />
            현재 위치 사용
          </button>
          <div className="map-container" ref={mapRef} />
          {formData.location.address ? (
            <div className="location-address">
              <MapPin style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />
              <span>{formData.location.address}</span>
            </div>
          ) : (
            <div className="location-address default">
              <MapPin style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
              <span>기본 위치 (서울) - 지도에서 정확한 위치를 선택해주세요</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="form-section">
          <div className="label-with-check">
            <Label>연락처 정보 (하나 이상 필수)</Label>
            {(formData.contactEmail || formData.contactPhone) && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <div className="contact-fields">
            <Input
              type="email"
              placeholder="이메일"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="form-input"
            />
            <Input
              type="tel"
              placeholder="전화번호 (010-1234-5678)"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="form-input"
            />
          </div>
        </div>

        {/* Reward Points */}
        <div className="form-section">
          <div className="label-with-check">
            <Label>
              <Coins style={{ width: '1rem', height: '1rem' }} />
              리워드 포인트 (선택사항)
            </Label>
            {formData.rewardPoints > 0 && (
              <span className="field-check completed">✓ {formData.rewardPoints}P 설정됨</span>
            )}
          </div>
          {/* [MODIFIED] 사용자 이름과 보유 포인트를 API에서 가져온 정보로 표시 */}
          <p className="points-balance">
            {currentUser ? `${currentUser.nickname}님의 보유 포인트: ${currentUser.point}P` : '포인트 불러오는 중...'}
          </p>
          <input
            type="range"
            min="0"
            // [MODIFIED] max 값을 API에서 가져온 포인트로 설정
            max={currentUser?.point || 0}
            step="10"
            value={formData.rewardPoints}
            onChange={(e) => setFormData({ ...formData, rewardPoints: parseInt(e.target.value) })}
            className="points-slider"
          />
          <div className="points-labels">
            <span>0P</span>
            {/* [MODIFIED] 최대 포인트 라벨을 API에서 가져온 포인트로 설정 */}
            <span>{currentUser?.point || 0}P</span>
          </div>
        </div>
        
        {/* Lost Date */}
        <div className="form-section">
          <div className="label-with-check">
            <Label htmlFor="lostDate">
              <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
              분실 날짜 *
            </Label>
            {formData.lostDate && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <Input
            id="lostDate"
            type="date"
            value={formData.lostDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFormData({ ...formData, lostDate: e.target.value })}
            className="form-input"
          />
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="error-banner"
            >
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !isFormValid()}
          className="submit-btn"
          onClick={(e) => {
            console.log('버튼 클릭됨!');
            console.log('버튼 disabled 상태:', isLoading || !isFormValid());
            console.log('isLoading:', isLoading);
            console.log('isFormValid:', isFormValid());
            if (!isFormValid()) {
              e.preventDefault();
              alert('필수 항목을 모두 입력해주세요.\n\n아래 디버깅 정보를 확인하세요.');
            }
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />
              등록 중...
            </>
          ) : (
            '등록하기'
          )}
        </Button>

        {/* 디버깅 정보 */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>필수 필드 체크:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ color: formData.itemName ? '#10b981' : '#ef4444' }}>
              {formData.itemName ? '✓' : '✗'} 분실물 이름: {formData.itemName || '미입력'}
            </li>
            <li style={{ color: formData.category ? '#10b981' : '#ef4444' }}>
              {formData.category ? '✓' : '✗'} 카테고리: {formData.category || '미선택'}
            </li>
            <li style={{ color: formData.description.length >= 100 ? '#10b981' : '#ef4444' }}>
              {formData.description.length >= 100 ? '✓' : '✗'} 상세 설명: {formData.description.length}/100자
            </li>
            <li style={{ color: (formData.contactEmail || formData.contactPhone) ? '#10b981' : '#ef4444' }}>
              {(formData.contactEmail || formData.contactPhone) ? '✓' : '✗'} 연락처: {formData.contactEmail || formData.contactPhone || '미입력'}
            </li>
            <li style={{ color: formData.lostDate ? '#10b981' : '#ef4444' }}>
              {formData.lostDate ? '✓' : '✗'} 분실 날짜: {formData.lostDate || '미선택'}
            </li>
          </ul>
          <p style={{ marginTop: '0.5rem', fontWeight: 600, color: isFormValid() ? '#10b981' : '#ef4444' }}>
            버튼 상태: {isFormValid() ? '활성화 ✓' : '비활성화 ✗'}
          </p>
        </div>

        <p className="auto-save-hint">
          {progress > 0 && '작성 중인 내용이 자동으로 저장됩니다'}
        </p>
      </form>
    </div>
  );
}
