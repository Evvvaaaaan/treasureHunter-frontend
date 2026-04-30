import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import {
  Camera,
  X,
  MapPin,
  ChevronLeft,
  Check,
  Loader2,
  Navigation,
  Plus,
  Minus,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { toast } from 'sonner';
import { getUserInfo, createPost, type PostData, getValidAuthToken } from '../utils/auth';
import { useTheme } from '../utils/theme';
import { API_BASE_URL } from '../config';
import '../styles/create-lost-item.css';

// Google Map 다크 모드 스타일
const googleMapDarkMode = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

type ItemType = 'lost' | 'found';
type TimeOption = 'justNow' | 'today' | 'yesterday' | 'custom';

interface FormData {
  itemType: ItemType;
  itemName: string;
  category: string;
  photos: File[];
  timeOption: TimeOption;
  customDate: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    detail: string;
  };
}

const CATEGORIES = ['지갑', '가방', '휴대폰', '의류', '노트북', '귀금속', '기타'];
const categoryMapping: { [key: string]: string } = {
  '휴대폰': 'PHONE',
  '지갑': 'WALLET',
  '의류': 'CLOTHES',
  '가방': 'BAG',
  '노트북': 'ELECTRONICS',
  '귀금속': 'ACCESSORY',
  '기타': 'ETC',
};

// AI가 반환하는 한국어 카테고리 → CATEGORIES 목록으로 정규화
const normalizeAiCategory = (aiCategory: string): string => {
  const map: { [key: string]: string } = {
    '휴대폰': '휴대폰',
    '지갑': '지갑',
    '의류': '의류',
    '가방': '가방',
    '전자기기': '노트북',
    '액세서리': '귀금속',
    '문구류': '기타',
    '기타': '기타',
  };
  return map[aiCategory] ?? '기타';
};

const TIME_OPTIONS: { value: TimeOption; label: string }[] = [
  { value: 'justNow', label: '방금 전' },
  { value: 'today', label: '오늘' },
  { value: 'yesterday', label: '어제' },
  { value: 'custom', label: '직접 선택' },
];

const uploadImages = async (files: File[], token: string): Promise<string[]> => {
  if (files.length === 0) return [];
  const UPLOAD_URL = `${API_BASE_URL}/file/image`;

  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error(`이미지 업로드 실패`);
    const result = await response.json();
    return result.fileUrl;
  });

  return Promise.all(uploadPromises);
};

export default function CreateLostItemPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const userInfo = getUserInfo();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    styles: theme === 'dark' ? googleMapDarkMode : [],
  }), [theme]);

  const [formData, setFormData] = useState<FormData>({
    itemType: 'lost',
    itemName: '',
    category: '',
    photos: [],
    timeOption: 'today',
    customDate: new Date().toISOString().split('T')[0],
    description: '',
    location: {
      latitude: 37.5665,
      longitude: 126.9780,
      address: '',
      detail: '',
    },
  });

  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);

  // ─── Map 로직 ───
  const updateLocation = async (lat: number, lng: number) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    let address = `위도: ${roundedLat}, 경도: ${roundedLng}`;
    
    if (typeof window.google !== 'undefined' && google.maps.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat: roundedLat, lng: roundedLng } });
        if (response.results[0]) address = response.results[0].formatted_address;
      } catch (err) {}
    }
    
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, latitude: roundedLat, longitude: roundedLng, address },
    }));
    if (map) map.panTo({ lat: roundedLat, lng: roundedLng });
  };

  const handleMapLoad = (mapInstance: google.maps.Map) => setMap(mapInstance);
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) updateLocation(e.latLng.lat(), e.latLng.lng());
  };
  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) updateLocation(e.latLng.lat(), e.latLng.lng());
  };

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Geolocation.checkPermissions();
        if (status.location !== 'granted') await Geolocation.requestPermissions();
      }
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      updateLocation(position.coords.latitude, position.coords.longitude);
    } catch (err) {
      await Dialog.alert({ title: '알림', message: '위치 권한이 거부되었습니다.' });
    } finally {
      setIsLocating(false);
    }
  };

  const zoomMap = (direction: 'in' | 'out') => {
    if (map) map.setZoom(map.getZoom()! + (direction === 'in' ? 1 : -1));
  };

  const analyzeImageWithAI = async (base64Image: string, mimeType: string) => {
    setIsAiAnalyzing(true);
    setAiProgress(10);

    const systemPrompt = `당신은 사용자의 물품을 분석하고 데이터화하는 전문 vision ai 어시스턴트입니다. 사용자가 제공한 사진의 메인 물체를 분석하여 오직 아래 규격에 맞는 JSON 형식으로만 응답해야 합니다. 다른 부가적인 설명은 절대 출력하지 마세요.
[제약 사항]
1. name : 이미지 속 주요 물체의 구체적인 이름을 한국어로 작성하세요. (예: 아이폰 15프로, 검정색 가죽 반지갑 등)
2. category : 반드시 다음 8개의 카테고리 중 하나만 선택해야 합니다. [휴대폰, 지갑, 의류, 가방, 전자기기, 액세서리, 문구류, 기타]
3. description : 아래 항목을 각각 줄바꿈(\\n)으로 구분하여 작성하세요. 각 항목은 이모지 + 항목명으로 시작합니다.
  - 🔍 물품 특징: 색상, 재질, 브랜드·로고, 눈에 띄는 흠집 등 식별 가능한 외형을 구체적으로 묘사
  - 📍 습득 장소: 구체적인 건물명, 층수, 위치 (이미지에서 파악 불가 시 "확인 필요"로 작성)
  - 🕐 습득 일시: 날짜 및 시간대 (이미지에서 파악 불가 시 "확인 필요"로 작성)`;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    try {
      setAiProgress(30);
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY.trim();
      let groqRes: Response;
      try {
        groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          signal: abortController.signal,
          body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 1024,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                  { type: 'text', text: '이 물체를 분석하여 JSON 형식으로만 응답해주세요.' },
                ],
              },
            ],
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }

      setAiProgress(75);

      if (!groqRes.ok) {
        const errData = await groqRes.json().catch(() => ({}));
        const errMsg = (errData as { error?: { message?: string } })?.error?.message || `API 오류 (${groqRes.status})`;
        throw new Error(errMsg);
      }

      const data = await groqRes.json();
      const text: string = data.choices?.[0]?.message?.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('AI 응답을 파싱할 수 없습니다.');

      const parsed = JSON.parse(match[0]);
      setAiProgress(100);

      setFormData(prev => ({
        ...prev,
        itemName: parsed.name || prev.itemName,
        category: parsed.category ? normalizeAiCategory(parsed.category) : prev.category,
        description: parsed.description || prev.description,
      }));

      toast.success('AI 인식이 완료되었습니다.', { duration: 3000 });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errName = err instanceof Error ? err.name : '';

      const isNetworkError = errName === 'AbortError'
        || (err instanceof TypeError && (
          msg.toLowerCase().includes('fetch')
          || msg.toLowerCase().includes('network')
          || msg.toLowerCase().includes('failed')
        ));

      console.error('AI 자동 입력 오류:', err);

      if (isNetworkError) {
        try {
          await Dialog.alert({
            title: '네트워크 오류',
            message: '네트워크 연결이 불안정하여 AI 분석을 완료할 수 없습니다.\n\n게시글 등록 페이지로 돌아가 네트워크 연결을 확인한 후 다시 시도해주세요.',
            buttonTitle: '확인',
          });
        } catch {
          toast.error('네트워크 연결이 불안정합니다. 다시 시도해주세요.');
        }
      } else {
        try {
          await Dialog.alert({ title: 'AI 오류', message: msg });
        } catch {
          toast.error(`AI 오류: ${msg}`);
        }
      }
    } finally {
      setIsAiAnalyzing(false);
      setAiProgress(0);
    }
  };

  // ─── 사진 업로드 로직 ───
  const handleNativeCamera = async (useAI = false) => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        width: 1920,
        correctOrientation: true,
      });

      if (!image.webPath) return;

      const res = await fetch(image.webPath);
      const blob = await res.blob();
      const mimeType = blob.type || `image/${image.format}` || 'image/jpeg';
      const file = new File([blob], `photo_${Date.now()}.${image.format}`, { type: mimeType });
      const dt = new DataTransfer();
      dt.items.add(file);
      await handleImageChange(dt.files);

      if (useAI) {
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        analyzeImageWithAI(base64Image, mimeType);
      }
    } catch {
      // 사용자 취소 등 무시
    }
  };

  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX = 1920;
          if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
          else if (height > MAX) { width *= MAX / height; height = MAX; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const available = 5 - formData.photos.length;
    if (available <= 0) {
      await Dialog.alert({ title: '알림', message: '사진은 최대 5장까지 가능합니다.' });
      return;
    }
    const newFiles = Array.from(files).slice(0, available);
    setIsLoading(true);
    try {
      const processed = await Promise.all(newFiles.map(async f => {
        const c = await compressImage(f);
        const p = await new Promise<string>(res => {
          const r = new FileReader();
          r.onloadend = () => res(r.result as string);
          r.readAsDataURL(c);
        });
        return { c, p };
      }));
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...processed.map(x => x.c)] }));
      setPhotosPreviews(prev => [...prev, ...processed.map(x => x.p)]);
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = (i: number) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }));
    setPhotosPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleNextStep = async () => {
    if (step === 2) {
      if (!formData.itemName.trim()) {
        await Dialog.alert({ title: '알림', message: '게시글 이름을 입력해주세요.' });
        return;
      }
      if (!formData.category) {
        await Dialog.alert({ title: '알림', message: '카테고리를 선택해주세요.' });
        return;
      }
      if (formData.photos.length === 0) {
        await Dialog.alert({ title: '알림', message: '최소 1장의 사진을 추가해주세요.' });
        return;
      }
    }
    setStep((step + 1) as 2 | 3);
  };

  // ─── 폼 제출 ───
  const handleSubmit = async () => {
    if (userInfo?.role === 'NOT_VERIFIED') {
      navigate('/verify-phone');
      return;
    }

    if (!formData.itemName || !formData.category || formData.photos.length === 0) {
      setError('이름, 카테고리, 사진은 필수입니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = await getValidAuthToken();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const imageUrls = await uploadImages(formData.photos, token);

      let d = new Date();
      if (formData.timeOption === 'yesterday') d.setDate(d.getDate() - 1);
      else if (formData.timeOption === 'custom') d = new Date(formData.customDate);
      
      const postPayload: PostData = {
        title: formData.itemName,
        content: formData.description || `${formData.itemType === 'lost' ? '잃어버린' : '주운'} 물건입니다.`,
        type: formData.itemType.toUpperCase() as 'LOST' | 'FOUND',
        images: imageUrls,
        setPoint: 0,
        itemCategory: categoryMapping[formData.category] || 'ETC',
        lat: formData.location.latitude,
        lon: formData.location.longitude,
        lostAt: d.toISOString(),
        isAnonymous: false,
      };

      const created = await createPost(postPayload);
      if (created) {
        setSuccess(true);
        setTimeout(() => navigate('/home'), 2000);
      } else {
        throw new Error('게시글 등록 실패');
      }
    } catch (err: any) {
      setError(err.message || '오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="clp-success">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="clp-success-icon">
          <Check size={36} color="white" />
        </motion.div>
        <p className="clp-success-title">등록 완료!</p>
        <p className="clp-success-sub">{formData.itemType === 'lost' ? '분실물이' : '습득물이'} 등록되었습니다.</p>
      </div>
    );
  }

  return (
    <div className={`clp-page ${theme}`}>
      <header className="clp-header">
        <button className="clp-back-btn" onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : navigate(-1)}>
          <ChevronLeft size={22} />
        </button>
        <span className="clp-header-title">새로운 흔적 남기기</span>
        <div style={{ width: 36 }} />
      </header>

      <div className="clp-stepper">
        {[{id:1,label:'종류'}, {id:2,label:'정보'}, {id:3,label:'위치'}].map((s, i) => (
          <div key={s.id} className="clp-stepper-item">
            <div className={`clp-step-dot ${step > s.id ? 'done' : step === s.id ? 'active' : ''}`}>
              {step > s.id ? <Check size={11} strokeWidth={3} /> : s.id}
            </div>
            <span className={`clp-step-label ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}>{s.label}</span>
            {i < 2 && <div className={`clp-step-line ${step > s.id ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="clp-body">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              <p className="clp-step-badge">STEP 1 / 3</p>
              <h2 className="clp-step-title">어떤 흔적을 남기시겠어요?</h2>
              <p className="clp-step-sub">분실물과 습득물 중 알려주고 싶은 것을 선택하세요.</p>

              <div className="clp-type-cards">
                <button type="button" className={`clp-type-card ${formData.itemType === 'lost' ? 'active-lost' : ''}`} onClick={() => setFormData(p => ({ ...p, itemType: 'lost' }))}>
                  <div className="clp-type-card-inner">
                    <div className={`clp-type-icon-wrap lost ${formData.itemType === 'lost' ? 'selected' : ''}`}><MapPin size={22} /></div>
                    <div className="clp-type-text">
                      <span className="clp-type-badge lost">· LOST ·</span>
                      <span className="clp-type-name">잃어버렸어요</span>
                      <span className="clp-type-desc">내 물건이 사라졌어요. 누가 발견해 주었으면 해요.</span>
                      <span className="clp-type-eg">예: 지갑, 에어팟, 노트북, 우산</span>
                    </div>
                    <div className={`clp-radio ${formData.itemType === 'lost' ? 'checked' : ''}`}>{formData.itemType === 'lost' && <div className="clp-radio-dot" />}</div>
                  </div>
                </button>
                <button type="button" className={`clp-type-card ${formData.itemType === 'found' ? 'active-found' : ''}`} onClick={() => setFormData(p => ({ ...p, itemType: 'found' }))}>
                  <div className="clp-type-card-inner">
                    <div className={`clp-type-icon-wrap found ${formData.itemType === 'found' ? 'selected' : ''}`}><Check size={22} /></div>
                    <div className="clp-type-text">
                      <span className="clp-type-badge found">· FOUND ·</span>
                      <span className="clp-type-name">주웠어요</span>
                      <span className="clp-type-desc">누군가 흘린 물건을 발견했어요. 주인을 찾아주고 싶어요.</span>
                      <span className="clp-type-eg">예: 카드, 열쇠, 모자, 가방</span>
                    </div>
                    <div className={`clp-radio ${formData.itemType === 'found' ? 'checked found' : ''}`}>{formData.itemType === 'found' && <div className="clp-radio-dot" />}</div>
                  </div>
                </button>
              </div>

              <div className="clp-tip">
                <span className="clp-tip-dot">●</span>
                <span><b>꿀팁.</b> 한 사람이 같은 물건의 분실/습득을 동시에 등록할 수도 있어요. 헷갈리실 땐 <u>도움말</u>을 확인해 주세요.</span>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              <p className="clp-step-badge">STEP 2 / 3</p>
              <h2 className="clp-step-title">물건 정보를 알려주세요</h2>
              <p className="clp-step-sub">사진과 설명이 자세할수록 찾을 확률이 높아집니다.</p>

              <div className="clp-ai-banner" onClick={() => !isAiAnalyzing && handleNativeCamera(true)} style={{ cursor: isAiAnalyzing ? 'default' : 'pointer' }}>
                <div className="clp-ai-banner-left">
                  <div className="clp-ai-icon">
                    {isAiAnalyzing ? <Loader2 size={16} className="clp-spin" /> : <Sparkles size={16} />}
                  </div>
                  <div>
                    <p className="clp-ai-title">{isAiAnalyzing ? 'AI가 특징을 분석하고 있어요...' : '사진만 올리면 AI가 대신 써드려요'}</p>
                    <p className="clp-ai-sub">{isAiAnalyzing ? `${aiProgress}% 완료` : '카테고리·색상·특징을 정확하게 채워드립니다'}</p>
                  </div>
                </div>
                {isAiAnalyzing
                  ? <div className="clp-ai-progress-bg"><div className="clp-ai-progress-bar" style={{ width: `${aiProgress}%` }} /></div>
                  : <span className="clp-ai-free">무료</span>
                }
              </div>

              <div className="clp-section">
                <p className="clp-label">사진 <span className="clp-required">*</span> <span className="clp-label-hint">최대 5장</span></p>
                <div className="clp-photo-row">
                  {formData.photos.length < 5 && (
                    <button type="button" className="clp-photo-add" onClick={() => handleNativeCamera(false)}>
                      <Camera size={22} color="#6FA886" />
                      <span>사진 추가</span>
                    </button>
                  )}
                  {photosPreviews.map((src, i) => (
                    <div key={i} className="clp-photo-thumb">
                      <img src={src} alt="" />
                      <button type="button" className="clp-photo-remove" onClick={() => removePhoto(i)}><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="clp-section">
                <div className="clp-label-row">
                  <p className="clp-label">이름 <span className="clp-required">*</span></p>
                  <span className="clp-ai-suggest">AI 추천</span>
                </div>
                <input type="text" className="clp-input" value={formData.itemName} onChange={e => setFormData(p => ({ ...p, itemName: e.target.value }))} placeholder="예: 검은색 가죽 반지갑" />
              </div>

              <div className="clp-section">
                <p className="clp-label">카테고리 <span className="clp-required">*</span></p>
                <div className="clp-cat-wrap">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" className={`clp-cat-chip ${formData.category === cat ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, category: cat }))}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="clp-section">
                <p className="clp-label">상세 설명</p>
                <textarea className="clp-textarea" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="자세한 특징을 적어주세요." />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              <p className="clp-step-badge">STEP 3 / 3</p>
              <h2 className="clp-step-title">{formData.itemType === 'lost' ? '어디에서 잃어버리셨나요?' : '어디에서 주우셨나요?'}</h2>
              <p className="clp-step-sub">핀을 옮겨 정확한 위치를 알려주세요.</p>

              <div className="clp-map-wrap">
                <GoogleMap mapContainerClassName="clp-map" center={{ lat: formData.location.latitude, lng: formData.location.longitude }} zoom={16} options={mapOptions} onLoad={handleMapLoad} onClick={handleMapClick}>
                  <MarkerF position={{ lat: formData.location.latitude, lng: formData.location.longitude }} draggable onDragEnd={handleMarkerDragEnd} />
                </GoogleMap>
                <div className="clp-map-zoom">
                  <button type="button" className="clp-zoom-btn" onClick={() => zoomMap('in')}><Plus size={16} /></button>
                  <button type="button" className="clp-zoom-btn" onClick={() => zoomMap('out')}><Minus size={16} /></button>
                </div>
                <button type="button" className="clp-my-loc-btn" onClick={getCurrentLocation} disabled={isLocating}>
                  {isLocating ? <Loader2 size={14} className="clp-spin" /> : <Navigation size={14} />}
                  <span>내 위치</span>
                </button>
                {isLocating && (
                  <div className="clp-map-loading-overlay">
                    <Loader2 size={24} className="clp-spin" />
                    <span>정확한 위치를 찾고 있어요...</span>
                  </div>
                )}
              </div>

              <div className="clp-section">
                <p className="clp-label">위치</p>
                <p className="clp-coords">
                  {formData.location.latitude.toFixed(4)}° N · {formData.location.longitude.toFixed(4)}° E
                </p>
                <p className="clp-address">{formData.location.address || '주소를 가져오는 중...'}</p>
                {formData.location.detail && <p className="clp-address-detail">{formData.location.detail}</p>}
              </div>

              <div className="clp-section">
                <p className="clp-label">시간</p>
                <div className="clp-time-chips">
                  {TIME_OPTIONS.map(t => (
                    <button key={t.value} type="button" className={`clp-time-chip ${formData.timeOption === t.value ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, timeOption: t.value }))}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {formData.timeOption === 'custom' && (
                  <input type="date" className="clp-input" style={{ marginTop: '0.75rem' }} value={formData.customDate} max={new Date().toISOString().split('T')[0]} onChange={e => setFormData(p => ({ ...p, customDate: e.target.value }))} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="clp-bottom">
        {error && <div className="clp-error"><AlertCircle size={14} /> {error}</div>}
        {step === 3 ? (
          <div className="clp-bottom-row">
            <button type="button" className="clp-prev-btn" onClick={() => setStep(2)}>이전</button>
            <button type="button" className="clp-next-btn flex-1" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <><Loader2 size={18} className="clp-spin" /> 등록 중...</> : '등록 완료'}
            </button>
          </div>
        ) : (
          <button type="button" className="clp-next-btn" onClick={handleNextStep}>다음 →</button>
        )}
      </div>

      {/* AI 분석 로딩 오버레이 */}
      <AnimatePresence>
        {isAiAnalyzing && (
          <motion.div
            className="clp-ai-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="clp-ai-overlay-card"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sparkles className="clp-ai-overlay-icon" />
              <Loader2 className="clp-ai-overlay-spinner" />
              <p className="clp-ai-overlay-title">AI 분석 중</p>
              <p className="clp-ai-overlay-sub">사진을 분석하고 있습니다...</p>
              <div className="clp-ai-overlay-progress-bg">
                <motion.div
                  className="clp-ai-overlay-progress-fill"
                  animate={{ width: `${aiProgress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
