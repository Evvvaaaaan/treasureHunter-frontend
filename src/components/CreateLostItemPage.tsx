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
import { getUserInfo, type UserInfo } from '../utils/auth'; // UserInfo는 타입으로 가져옵니다.
import '../styles/create-lost-item.css';


// --- Google Maps 타입 정의 ---
// "Cannot find namespace 'google'" 오류를 해결하기 위해
// Google Maps API의 최소한의 타입을 직접 선언합니다.
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  interface MapMouseEvent {
    latLng: LatLng | null;
  }

  interface MapOptions {
    center?: LatLng | { lat: number; lng: number };
    zoom?: number;
    styles?: any[];
  }

  class Map {
    constructor(mapDiv: HTMLElement, opts?: MapOptions);
    setCenter(latLng: LatLng | { lat: number; lng: number }): void;
    addListener(eventName: string, handler: (...args: any[]) => void): google.maps.MapsEventListener;
  }

  interface MarkerOptions {
    position?: LatLng | { lat: number; lng: number };
    map?: Map;
    draggable?: boolean;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setPosition(latLng: LatLng | { lat: number; lng: number }): void;
    addListener(eventName: string, handler: (...args: any[]) => void): google.maps.MapsEventListener;
  }

  class Geocoder {
    geocode(
      request: { location: LatLng | { lat: number; lng: number } },
      callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
    ): void;
  }

  interface GeocoderResult {
    formatted_address: string;
  }

  type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';

  // 빈 인터페이스 대신 'object' 타입을 사용하여 린트 오류를 해결합니다.
  type MapsEventListener = object;
}


// window 객체에 google 속성을 추가하기 위한 타입 확장
declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}
// --- 타입 정의 끝 ---


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
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userPoints, setUserPoints] = useState(1000);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  const [formData, setFormData] = useState<FormData>({
    itemType: 'lost',
    itemName: '',
    category: '',
    description: '',
    contactEmail: (userInfo as UserInfo & { email?: string })?.email || '',
    contactPhone: '',
    rewardPoints: 0,
    lostDate: new Date().toISOString().split('T')[0],
    photos: [],
    location: {
      latitude: 37.5665,
      longitude: 126.9780,
      address: '',
    },
  });

  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);

  const calculateProgress = () => {
    let completed = 0;
    const totalRequired = 5; // itemName, category, description, contact, lostDate
    
    if (formData.itemName) completed++;
    if (formData.category) completed++;
    if (formData.description.length >= 100) completed++;
    if (formData.contactEmail || formData.contactPhone) completed++;
    if (formData.lostDate) completed++;
    
    return (completed / totalRequired) * 100;
  };

  const progress = calculateProgress();

  const isFormValid = () => {
    return (
      formData.itemName.trim() !== '' &&
      formData.category.trim() !== '' &&
      formData.description.length >= 100 &&
      (formData.contactEmail.trim() !== '' || formData.contactPhone.trim() !== '') &&
      formData.lostDate.trim() !== ''
    );
  };

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) {
        console.error("지도 컨테이너(ref)가 준비되지 않았습니다.");
        return;
      }

      console.log("지도 초기화를 시작합니다...");
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: formData.location.latitude, lng: formData.location.longitude },
        zoom: 15,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      });

      const mapMarker = new window.google.maps.Marker({
        position: { lat: formData.location.latitude, lng: formData.location.longitude },
        map: googleMap,
        draggable: true,
      });

      googleMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          mapMarker.setPosition({ lat, lng });
          updateLocation(lat, lng);
        }
      });

      mapMarker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          updateLocation(lat, lng);
        }
      });

      setMap(googleMap);
      setMarker(mapMarker);
      console.log("✓ 지도 초기화가 완료되었습니다.");
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const scriptId = 'google-maps-script';
      if (document.getElementById(scriptId)) return;

      const script = document.createElement('script');
      script.id = scriptId;
      // ❗ 중요: 'YOUR_GOOGLE_MAPS_API_KEY' 부분을 실제 Google Maps API 키로 교체해야 합니다.
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBN5hX-FL_N57xUwRVVuY4ExZQuro5Ti2s`;
      script.async = true;
      script.defer = true;
      
      // 전역 콜백 대신 script.onload 이벤트를 직접 사용합니다.
      script.onload = initMap;
      
      script.onerror = () => {
        setError('지도를 불러올 수 없습니다. API 키나 네트워크 연결을 확인해주세요.');
      };
      
      document.head.appendChild(script);
    }
    
    // 클린업 함수는 스크립트 태그만 제거하도록 단순화합니다.
    return () => {
        const script = document.getElementById('google-maps-script');
        if (script) {
            script.remove();
        }
    }
  }, []); // 의존성 배열을 비워 최초 1회만 실행되도록 합니다.

  const updateLocation = (lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
      let address = `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`;
      if (status === 'OK' && results && results[0]) {
        address = results[0].formatted_address;
      }
      setFormData((prev) => ({
        ...prev,
        location: { latitude: lat, longitude: lng, address },
      }));
    });
  };
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('위치 정보를 사용할 수 없습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (map && marker) {
          const newPos: google.maps.LatLng = new window.google.maps.LatLng(lat, lng);
          map.setCenter(newPos);
          marker.setPosition(newPos);
          updateLocation(lat, lng);
        }
      },
      () => {
        setError('위치 정보를 가져올 수 없습니다. 브라우저 설정을 확인해주세요.');
      }
    );
  };
  
    const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

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
          if (!ctx) {
            return reject(new Error('Failed to get canvas context'));
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => reject(new Error('Image loading error'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).slice(0, 5 - formData.photos.length);
    if (newFiles.length === 0) return;

    try {
      const compressedFiles = await Promise.all(newFiles.map(compressImage));
      const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));

      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...compressedFiles] }));
      setPhotosPreviews(prev => [...prev, ...newPreviews]);
    } catch (e) {
      console.error("Image processing failed:", e);
      setError("이미지 처리 중 오류가 발생했습니다.");
    }
  };


  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photosPreviews[index]);
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e.dataTransfer.files);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('필수 항목을 모두 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess(true);
      setTimeout(() => navigate('/home'), 2000);
    } catch (err) {
      setError('등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const draft = localStorage.getItem('draft_lost_item');
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as Partial<FormData>;
        setFormData(prev => ({ ...prev, ...parsed, photos: [] }));
      } catch (e) { console.error('Failed to load draft'); }
    }
  }, []);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('draft_lost_item', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(handler);
  }, [formData]);

  if (success) {
    return (
      <div className="create-success">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="success-icon">
          <Check style={{ width: '3rem', height: '3rem', color: 'white' }} />
        </motion.div>
        <h2>등록 완료!</h2>
        <p>분실물이 성공적으로 등록되었습니다.</p>
      </div>
    );
  }

  return (
    <div className="create-lost-item-page">
      <header className="create-header">
        <button onClick={() => navigate(-1)} className="back-btn"><ChevronLeft size={24} /></button>
        <h1>분실물 / 습득물 등록</h1>
        <div style={{ width: 24 }} />
      </header>

      <div className="progress-container">
        <div className="progress-bar">
          <motion.div className="progress-fill" animate={{ width: `${progress}%` }} />
        </div>
        <p className="progress-text">{Math.round(progress)}% 완료</p>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-section">
          <Label>분실물 / 습득물 종류  *</Label>
          <div className="item-type-buttons">
            <button type="button" className={`type-btn ${formData.itemType === 'lost' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, itemType: 'lost' })}>
              <span className="type-icon">🔍</span><span>분실물</span>
            </button>
            <button type="button" className={`type-btn ${formData.itemType === 'found' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, itemType: 'found' })}>
              <span className="type-icon">✨</span><span>습득물</span>
            </button>
          </div>
        </div>

        <div className="form-section">
          <Label htmlFor="itemName">분실물 / 습득물 이름 *</Label>
          <Input id="itemName" placeholder="예: 검은색 가죽 지갑" value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} className="form-input" />
        </div>

        <div className="form-section">
          <Label>카테고리 선택 *</Label>
          <div className="category-grid">
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" className={`category-btn ${formData.category === cat.value ? 'active' : ''}`} onClick={() => setFormData({ ...formData, category: cat.value })} style={{ '--category-color': cat.color } as React.CSSProperties}>
                <span className="category-icon">{cat.icon}</span>
                <span className="category-label">{cat.value}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="form-section">
            <Label htmlFor="description">상세 설명 * ({formData.description.length}/100)</Label>
            <Textarea id="description" placeholder="분실물의 특징을 100자 이상 자세히 설명해주세요." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="form-textarea" />
        </div>

        <div className="form-section">
            <Label>사진 업로드 (최대 5장)</Label>
            <div className={`photo-upload-area ${isDragging ? 'dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                <Upload size={32} className="upload-icon" />
                <p>클릭하거나 드래그하여 이미지 업로드</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => handleImageChange(e.target.files)} style={{ display: 'none' }} />
            </div>
            {photosPreviews.length > 0 && (
                <div className="photos-preview">
                    {photosPreviews.map((preview, index) => (
                        <div key={index} className="photo-preview-item">
                            <img src={preview} alt={`Preview ${index + 1}`} />
                            <button type="button" className="remove-photo-btn" onClick={() => removePhoto(index)}><X size={16} /></button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="form-section">
            <Label>분실 / 습득물 위치</Label>
            <button type="button" onClick={getCurrentLocation} className="location-btn"><MapPin size={16} />현재 위치 사용</button>
            <div className="map-container" ref={mapRef} style={{ height: '300px', backgroundColor: '#f3f4f6' }} />
            {formData.location.address && <div className="location-address"><MapPin size={16} className="text-primary"/><span>{formData.location.address}</span></div>}
        </div>

        <div className="form-section">
            <Label>연락처 정보 (하나 이상 필수)</Label>
            <div className="contact-fields">
                <Input type="email" placeholder="이메일" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className="form-input" />
                <Input type="tel" placeholder="전화번호" value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} className="form-input" />
            </div>
        </div>
        
        <div className="form-section">
            <Label>리워드 포인트 ({formData.rewardPoints}P)</Label>
            <p className="points-balance">보유: {userPoints}P</p>
            <input type="range" min="0" max={userPoints} step="10" value={formData.rewardPoints} onChange={e => setFormData({ ...formData, rewardPoints: parseInt(e.target.value) })} className="points-slider" />
        </div>
        
        <div className="form-section">
            <Label htmlFor="lostDate">날짜 *</Label>
            <Input id="lostDate" type="date" value={formData.lostDate} max={new Date().toISOString().split('T')[0]} onChange={e => setFormData({ ...formData, lostDate: e.target.value })} className="form-input" />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="error-banner">
              <AlertCircle size={20} /><span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" disabled={isLoading || !isFormValid()} className="submit-btn">
          {isLoading ? <><Loader2 className="spinner" size={20} />등록 중...</> : '등록하기'}
        </Button>

      </form>
    </div>
  );
}

