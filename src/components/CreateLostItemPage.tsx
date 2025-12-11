import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MapPin,
  Calendar as CalendarIcon,
  Upload,
  Loader2,
  ChevronLeft,
  Check,
  Coins,
  AlertCircle,
  ShieldQuestion, // 익명 아이콘 추가
  Sparkles, // AI 자동 작성 아이콘 추가
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
// [MODIFIED] createPost, PostData, getValidAuthToken 추가
import { getUserInfo, type UserInfo, createPost, type PostData, getValidAuthToken } from '../utils/auth';
import '../styles/create-lost-item.css';
import { API_BASE_URL } from '../config';
// FormData 인터페이스는 그대로 사용
interface FormData {
  itemType: 'lost' | 'found';
  itemName: string;
  category: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  rewardPoints: number;
  lostDate: string; // YYYY-MM-DD 형식 유지
  photos: File[]; // File 객체 배열 유지
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// 카테고리 정의는 그대로 사용
const CATEGORIES = [
  { value: '휴대폰', icon: '📱', color: '#3b82f6' },
  { value: '지갑', icon: '💳', color: '#8b5cf6' },
  { value: '의류', icon: '👖', color: '#f59e0b' },
  { value: '가방', icon: '🎒', color: '#10b981' },
  { value: '전자기기', icon: '💻', color: '#06b6d4' },
  { value: '액세서리', icon: '💍', color: '#ec4899' },
  { value: '문구류', icon: '📄', color: '#6366f1' },
  { value: '기타', icon: '📦', color: '#64748b' },
];


const categoryMapping: { [key: string]: string } = {
  '휴대폰': 'PHONE',
  '지갑': 'WALLET',
  '의류': 'CLOTHES',
  '가방': 'BAG',
  '전자기기': 'ELECTRONICS',
  '액세서리': 'ACCESSORY',
  '문구류': 'STATIONERY',
  '기타': 'ETC', // API에서 '기타'를 어떻게 받는지 확인 필요 (ETC 또는 OTHER 등)
};

// [MODIFIED] API 베이스 URL (필요시 환경 변수 사용)



// [MODIFIED] 이미지 업로드 함수 (실제 API 호출로 교체)
// 이 함수는 File 객체를 받아 서버에 업로드하고, 반환된 이미지 URL 배열을 반환해야 합니다.
const uploadImages = async (files: File[], token: string): Promise<string[]> => {
  console.log('--- 이미지 업로드 시작 (API 호출) ---');
  if (files.length === 0) {
    console.log('업로드할 이미지 없음.');
    return [];
  }

  // [MODIFIED] 이미지 업로드 API 엔드포인트: POST /api/v1/file/image
  const UPLOAD_URL = `${API_BASE_URL}/file/image`;

  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    // [MODIFIED] 요청 Body 필드 이름은 "file"로 설정합니다.
    formData.append('file', file);

    try {
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
          // [MODIFIED] Authorization 헤더를 추가합니다.
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' - fetch는 FormData 사용 시 자동으로 설정
        },
        body: formData,
      });
      console.log(response.status, response.statusText);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // 업로드 실패 시 구체적인 오류 메시지를 제공합니다.
        throw new Error(errorData.message || `이미지 업로드 실패: ${file.name} (상태: ${response.status})`);
      }

      const result = await response.json();
      // [MODIFIED] 백엔드 응답 형식에 따라 'fileUrl'을 추출합니다.
      const fileUrl = result.fileUrl;

      if (!fileUrl) {
        throw new Error(`이미지 URL(fileUrl)을 받지 못했습니다: ${file.name}`);
      }
      console.log(`이미지 업로드 성공: ${file.name} -> ${fileUrl}`);
      return fileUrl;

    } catch (error) {
      console.error(`이미지 업로드 중 오류 발생 (${file.name}):`, error);
      // 오류를 다시 던져 Promise.all에서 잡도록 함
      throw error;
    }
  });

  try {
    const urls = await Promise.all(uploadPromises);
    console.log('--- 모든 이미지 업로드 완료 ---');
    return urls;
  } catch (error) {
    console.error('--- 이미지 업로드 중 최종 오류 발생 ---');
    // 사용자에게 표시할 오류 메시지를 생성하여 throw
    throw new Error(error instanceof Error ? error.message : '일부 이미지 업로드에 실패했습니다. 다시 시도해주세요.');
  }
};


export default function CreateLostItemPage() {
  const [currentUser] = useState<UserInfo | null>(getUserInfo());
  const navigate = useNavigate();
  const userInfo = getUserInfo(); // 이메일 등 초기값 설정에 사용
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // userPoints 상태는 사용되지 않으므로 제거 가능
  // const [userPoints, setUserPoints] = useState(1000);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null); // google.maps.Map 타입 사용 가능
  const [marker, setMarker] = useState<any>(null); // google.maps.Marker 타입 사용 가능

  // [NEW] 익명 등록 상태 추가
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    itemType: 'lost',
    itemName: '',
    category: '',
    description: '',
    contactEmail: userInfo?.email || '', // 로그인한 사용자 이메일로 초기화
    contactPhone: '',
    rewardPoints: 0,
    lostDate: new Date().toISOString().split('T')[0], // 오늘 날짜 기본값
    photos: [],
    location: {
      latitude: 37.5665, // 서울 기본 위도
      longitude: 126.9780, // 서울 기본 경도
      address: '', // 주소는 선택 시 업데이트
    },
  });

  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);

  // --- calculateProgress, isFormValid 함수는 동일 ---
  // Calculate progress (필수 필드 기준)
  const calculateProgress = () => {
    let completed = 0;
    let total = 7; // 필수 필드 개수: 종류, 이름, 카테고리, 설명(100자), 연락처, 날짜

    // 필수 필드
    // itemType은 기본값이 있으므로 항상 완료로 간주 가능
    if (formData.itemName) completed++;
    if (formData.category) completed++;
    if (formData.description.length >= 100) completed++;
    if (formData.contactEmail || formData.contactPhone) completed++;
    if (formData.lostDate) completed++;
    if (formData.photos.length > 0) completed++; // 사진은 필수로 간주
    

    // 선택사항 (진행률 계산에 포함)
    let optionalTotal = 0;
    let optionalCompleted = 0;
    if (formData.photos.length > 0) optionalTotal++;
    if (formData.rewardPoints > 0) optionalTotal++;
    if (formData.location.address !== '' && formData.location.latitude !== 37.5665) optionalTotal++; // 위치를 변경했는지 여부

    if (formData.photos.length > 0) optionalCompleted++;
    if (formData.rewardPoints > 0) optionalCompleted++;
    if (formData.location.address !== '' && formData.location.latitude !== 37.5665) optionalCompleted++;

    // 최종 진행률: (필수 완료 개수 + 선택 완료 개수) / (필수 총 개수 + 선택 총 개수)
    // 단, 필수가 모두 완료되지 않으면 100% 미만으로 표시되도록 조정
    const overallProgress = (total + optionalTotal) > 0 ? ((completed + optionalCompleted) / (total + optionalTotal)) * 100 : 0;


    // 필수가 다 완료되었을 때만 전체 진행률 반영, 아니면 필수 진행률만 표시 (선택사항)
    // 여기서는 단순 합산으로 계산
    // Make sure progress doesn't exceed 100 or go below 0
    return Math.max(0, Math.min(100, overallProgress));
  };

  const progress = calculateProgress();

  // Check if form is valid (필수 필드만 체크)
  const isFormValid = () => {
    const valid = (
      formData.itemName.trim() !== '' &&
      formData.category !== '' &&
      formData.description.trim().length >= 100 &&
      formData.lostDate !== '' &&
      formData.photos.length > 0 // [추가] 사진이 1장 이상 있어야 함
    );

    return valid;
  };

  // --- 지도 관련 useEffect 및 함수들 (initializeMap, updateLocation, getCurrentLocation)은 동일 ---
  // Initialize Google Maps
  useEffect(() => {
    // Google Maps API 스크립트가 로드되었는지 확인
    if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
      console.warn("Google Maps API not loaded yet. Map initialization deferred.");
      // 스크립트가 index.html에서 로드되기를 기다림
      // 또는 여기서 동적으로 로드하는 로직 유지 가능 (단, 콜백 처리 주의)
      // 현재는 index.html에서 로드하는 것을 가정하고 진행
      const checkGoogleMapsInterval = setInterval(() => {
        if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
          clearInterval(checkGoogleMapsInterval);
          console.log("Google Maps API loaded dynamically. Initializing map.");
          initMap(); // API 로드 후 초기화 시도
        }
      }, 500); // 0.5초마다 확인

      // Cleanup interval on unmount
      return () => clearInterval(checkGoogleMapsInterval);
    } else {
      // API가 이미 로드된 경우 즉시 초기화
      initMap();
    }

    // 지도 초기화 함수 (useEffect 내부로 이동시키거나 useCallback 사용 가능)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    function initMap() { // initMap을 useEffect 내부에 정의하거나 useCallback으로 감싸기
      if (!mapRef.current || map) return; // 이미 초기화되었거나 ref 없으면 중단

      console.log("Initializing Google Map in Create Page...");
      try {
        const googleMap = new google.maps.Map(mapRef.current, {
          center: { lat: formData.location.latitude, lng: formData.location.longitude },
          zoom: 15,
          disableDefaultUI: true, // 기본 컨트롤 숨김
          zoomControl: true, // 확대/축소 컨트롤만 표시
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [ /* ...styles... */
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
          ],
        });

        const mapMarker = new google.maps.Marker({
          position: { lat: formData.location.latitude, lng: formData.location.longitude },
          map: googleMap,
          draggable: true,
          // 커스텀 아이콘 (선택사항)
          // icon: 'path/to/your/marker-icon.png'
        });

        // 지도 클릭 리스너
        googleMap.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            mapMarker.setPosition({ lat, lng });
            updateLocation(lat, lng);
          }
        });

        // 마커 드래그 종료 리스너
        mapMarker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            updateLocation(lat, lng);
          }
        });

        setMap(googleMap);
        setMarker(mapMarker);
        console.log("Google Map initialized successfully in Create Page.");
      } catch (error) {
        console.error("Error initializing Google Map:", error);
        setError("지도 초기화 중 오류 발생");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // map 상태 대신 빈 배열 사용 (마운트 시 한 번만 실행)


  const updateLocation = async (lat: number, lng: number) => {
    // Round coordinates to 6 decimal places before using them
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));

    let address = `위도: ${roundedLat}, 경도: ${roundedLng}`; // 기본 주소 형식 (소수점 6자리)

    if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined' && google.maps.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat: roundedLat, lng: roundedLng } }); // Use rounded values for geocoding
        if (response.results[0]) {
          address = response.results[0].formatted_address;
          console.log("Geocoding successful:", address);
        } else {
          console.warn("Geocoding failed: No results found for rounded coordinates.");
          address = `위도: ${roundedLat}, 경도: ${roundedLng} (주소 없음)`;
        }
      } catch (error) {
        console.error("Geocoding API error:", error);
        address = `위도: ${roundedLat}, 경도: ${roundedLng}`;
      }
    } else {
      console.warn("Geocoder not available or Maps API not loaded.");
    }

    setFormData((prev) => ({
      ...prev,
      location: {
        latitude: roundedLat, // Store rounded value
        longitude: roundedLng, // Store rounded value
        address: address,
      },
    }));

    if (map) {
      map.panTo({ lat: roundedLat, lng: roundedLng }); // Pan to rounded value
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('브라우저에서 위치 정보를 지원하지 않습니다.');
      return;
    }

    // 위치 권한 요청 안내 (선택사항, 브라우저가 자동으로 띄움)
    // alert('정확한 위치를 표시하기 위해 위치 권한이 필요합니다...');
    setIsLoading(true); // Indicate loading location
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false); // Stop loading
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log("Current location acquired:", { lat, lng });
        // 지도와 마커가 모두 존재할 때만 업데이트
        if (map && marker) {
          map.setCenter({ lat, lng });
          marker.setPosition({ lat, lng });
          updateLocation(lat, lng); // 주소 업데이트 및 상태 변경
        } else {
          console.warn("Map or marker not ready for current location update.");
          // 지도가 준비되지 않았으면 상태만 업데이트 시도 (지도가 로드되면 반영됨)
          updateLocation(lat, lng);
        }
      },
      (error) => {
        setIsLoading(false); // Stop loading on error
        console.error('Error getting location:', error);
        let errorMessage = '위치 정보를 가져올 수 없습니다. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += '위치 권한을 허용해주세요.';
            // Avoid alert here, show error banner
            // alert('위치 권한이 거부되었습니다.\n브라우저 설정에서 권한을 확인하거나, 지도에서 직접 위치를 선택해주세요.');
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
        setError(errorMessage);
        // Do not auto-clear error immediately, let user see it
        // setTimeout(() => setError(''), 5000);
      },
      {
        enableHighAccuracy: true, // 높은 정확도 요청
        timeout: 10000, // Increased timeout to 10 seconds
        maximumAge: 0, // 캐시 사용 안 함
      }
    );
  };


  // --- 이미지 관련 함수들 (handleImageChange, compressImage, removePhoto)은 동일 ---
  // Handle image upload
  const handleImageChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // 최대 5장 제한
    const currentPhotoCount = formData.photos.length;
    const availableSlots = 5 - currentPhotoCount;
    if (availableSlots <= 0) {
      alert('사진은 최대 5장까지 업로드할 수 있습니다.');
      return;
    }

    const newFilesArray = Array.from(files).slice(0, availableSlots);

    // 파일 크기 검사 (예: 10MB 제한)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles = newFilesArray.filter(file => {
      if (!file.type.startsWith('image/')) { // Check if it's an image file
        alert(`"${file.name}" 파일은 이미지 파일이 아닙니다.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" 파일 크기가 너무 큽니다 (최대 10MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;


    // 이미지 압축 및 미리보기 생성 (병렬 처리)
    setIsLoading(true); // Show loading indicator during image processing
    setError('');
    try {
      const processingPromises = validFiles.map(async (file) => {
        const compressedFile = await compressImage(file);
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
        return { compressedFile, preview };
      });

      const results = await Promise.all(processingPromises);

      const newCompressedFiles = results.map(r => r.compressedFile);
      const newPreviews = results.map(r => r.preview);

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newCompressedFiles],
      }));
      setPhotosPreviews((prev) => [...prev, ...newPreviews]);

    } catch (error) {
      console.error("Error processing images:", error);
      setError("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false); // Hide loading indicator
    }

  };

  const compressImage = (file: File): Promise<File> => {
    console.log(`Compressing image: ${file.name}, size: ${Math.round(file.size / 1024)} KB`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) {
          return reject(new Error("Failed to read file"));
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // 최대 해상도 제한 (예: 1920px)
          const MAX_DIMENSION = 1920;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round(height * (MAX_DIMENSION / width));
              width = MAX_DIMENSION;
            } else {
              width = Math.round(width * (MAX_DIMENSION / height));
              height = MAX_DIMENSION;
            }
            console.log(`Resized image dimensions: ${width}x${height}`);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error("Failed to get canvas context"));
          }
          ctx.drawImage(img, 0, 0, width, height);

          // JPEG 형식으로 압축 (quality 0.8)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Ensure filename has .jpg extension
                let filename = file.name;
                const dotIndex = filename.lastIndexOf('.');
                if (dotIndex !== -1) {
                  filename = filename.substring(0, dotIndex) + ".jpg";
                } else {
                  filename += ".jpg";
                }

                const compressedFile = new File([blob], filename, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`Compression result: ${compressedFile.name}, new size: ${Math.round(compressedFile.size / 1024)} KB`);
                resolve(compressedFile);
              } else {
                reject(new Error("Canvas toBlob failed, possibly due to large image dimensions."));
              }
            },
            'image/jpeg',
            0.8 // 압축 품질 (0.0 ~ 1.0)
          );
        };
        img.onerror = (error) => {
          console.error("Image load error:", error);
          reject(new Error("Failed to load image for compression."));
        };
        img.src = e.target.result as string;
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error("Failed to read file for compression."));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    // Prevent index out of bounds
    if (index < 0 || index >= formData.photos.length) return;

    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // --- 드래그 앤 드롭 핸들러 (handleDragOver, handleDragLeave, handleDrop)는 동일 ---
  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // 필수: drop 이벤트 허용
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 자식 요소 위로 이동할 때 leave가 발생하지 않도록 관련 타겟 확인 (선택적)
    // Check if the element being left is the container itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log(`Files dropped: ${e.dataTransfer.files.length}`);
      handleImageChange(e.dataTransfer.files);
      // Optional: Clear the dataTransfer to prevent potential issues
      // e.dataTransfer.clearData(); // This might cause issues in some browsers
    }
  };


  // --- 폼 유효성 검사 함수 (validateForm)는 동일 ---
  // Validate form (client-side check before API call)
  const validateForm = (): string | null => {
    if (!formData.itemName.trim()) return '분실물 이름을 입력해주세요.';
    if (!formData.category) return '카테고리를 선택해주세요.';
    if (formData.description.trim().length < 100) return '상세 설명을 100자 이상 입력해주세요. (공백 제외)';
    if (!formData.lostDate) return '분실 날짜를 선택해주세요.';
    if (formData.photos.length === 0) return '최소 1장 이상의 사진을 업로드해주세요.';

    // 날짜 유효성 검사 (미래 날짜 선택 불가 등)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to beginning of the day for comparison
    const selectedDate = new Date(formData.lostDate + 'T00:00:00'); // Ensure comparison is date-only

    if (selectedDate > today) {
      return '분실/습득 날짜는 오늘 또는 이전 날짜여야 합니다.';
    }


    // 위치 좌표 유효성 검사 (선택적)
    if (isNaN(formData.location.latitude) || isNaN(formData.location.longitude)) {
      return '유효한 위치 정보가 아닙니다.';
    }

    return null; // No errors
  };


  // [MODIFIED] Submit form using createPost - Reverted to correct implementation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    console.log('=== 폼 제출 시도 ===');

    // 1. Client-side validation
    const validationError = validateForm();
    if (validationError) {
      console.error('Validation Error:', validationError);
      setError(validationError); // Update error state
      // Avoid alert, let the error banner show
      // alert(`입력 오류: ${validationError}`);
      return; // Stop submission
    }
    console.log('✓ 클라이언트 유효성 검사 통과');

    setIsLoading(true); // Start loading
    setError('');       // Clear previous error message

    try {
      // 2. Get authentication token (includes refresh attempt)
      const token = await getValidAuthToken();
      if (!token) {
        // Redirect to login or show appropriate message
        setError('로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인해주세요.');
        setIsLoading(false);
        // Optional: Redirect after a delay
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      console.log('✓ 인증 토큰 확인');

      // 3. Image upload (replace simulation with actual API call)
      console.log('이미지 업로드 시작...');
      const imageUrls = await uploadImages(formData.photos, token); // Use formData.photos
      console.log('✓ 이미지 업로드 완료');

      // 4. Prepare API payload
      // Convert lostDate (YYYY-MM-DD) to ISO 8601 format (UTC)
      // Use the start of the selected day in UTC
      const lostAtISO = new Date(Date.UTC(
        parseInt(formData.lostDate.substring(0, 4), 10),
        parseInt(formData.lostDate.substring(5, 7), 10) - 1, // Month is 0-indexed
        parseInt(formData.lostDate.substring(8, 10), 10)
      )).toISOString();

      const apiItemType = formData.itemType.toUpperCase() as 'LOST' | 'FOUND'; // Convert 'lost' -> 'LOST', 'found' -> 'FOUND'
      const apiItemCategory = categoryMapping[formData.category] || 'ETC'; // Convert using mapping, default to 'ETC'

      const postPayload: PostData = {
        title: formData.itemName.trim(),
        content: formData.description.trim(),
        type: apiItemType, // Use uppercase type
        images: imageUrls,
        setPoint: formData.rewardPoints,
        itemCategory: apiItemCategory, // Use uppercase English category
        lat: parseFloat(formData.location.latitude.toFixed(6)),
        lon: parseFloat(formData.location.longitude.toFixed(6)),
        lostAt: lostAtISO,
        isAnonymous: isAnonymous,
      };
      console.log('API 요청 페이로드:', postPayload);

      // 5. Call the createPost API function
      console.log('게시글 생성 API 호출...');
      const createdPost = await createPost(postPayload); // Call function from auth.ts

      // 6. Handle API response
      if (createdPost) {
        console.log('✓ 게시글 생성 성공:', createdPost);
        setSuccess(true); // Set success state
        localStorage.removeItem('draft_lost_item'); // Clear draft data

        // No need for alert here if success screen shows
        // alert('게시글이 성공적으로 등록되었습니다!');

        // Success screen will be shown, navigation happens from there or automatically
        // Optional: Navigate directly after a short delay if no success screen is needed
        // setTimeout(() => {
        //   navigate('/home'); // Or navigate(`/item/${createdPost.id}`);
        // }, 500);

      } else {
        // createPost function returned null (error handled internally)
        // Set a generic error message if not already set by createPost's internal handling
        if (!error) {
          setError('게시글 등록에 실패했습니다. 서버 오류일 수 있습니다. 잠시 후 다시 시도해주세요.');
        }
        // No need to throw here, error state is set
      }

    } catch (err) {
      console.error('handleSubmit 오류:', err);
      // Set error message to be displayed
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.');
      // Avoid alert if error banner is used
      // alert(`등록 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);

    } finally {
      setIsLoading(false); // Stop loading
    }
  };


  // --- 자동 저장 및 초안 로드 useEffect는 동일 ---
  // Auto-save draft to localStorage
  useEffect(() => {
    // Save only if form has some data (optional)
    if (formData.itemName || formData.description || formData.category) {
      const timer = setTimeout(() => {
        // photos는 File 객체이므로 JSON으로 변환 불가 -> 제외하고 저장
        const { photos, ...draftData } = formData;
        try {
          localStorage.setItem('draft_lost_item', JSON.stringify(draftData));
          // console.log("Draft saved."); // Reduce console noise
        } catch (e) {
          console.error("Failed to save draft to localStorage:", e);
          // Optionally notify user if storage is full
          if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            setError("임시 저장 공간이 부족합니다.");
          }
        }
      }, 1000); // 1초 디바운스
      return () => clearTimeout(timer);
    }
    // Cleanup function to remove draft if form becomes empty (optional)
    else {
      localStorage.removeItem('draft_lost_item');
    }
  }, [formData]);

  // Load draft on component mount
  useEffect(() => {
    const draft = localStorage.getItem('draft_lost_item');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // photos 필드는 제외하고 나머지 필드만 복원
        setFormData((prev) => ({
          ...prev, // 기존 기본값 유지 (photos: [] 등)
          ...parsedDraft, // 저장된 초안 데이터 덮어쓰기
          photos: [], // photos는 복원하지 않음
        }));
        console.log("Draft loaded:", parsedDraft);
        // 만약 저장된 위치 정보가 있다면 지도를 해당 위치로 이동 (선택적)
        // Need to wait for map and marker to be initialized
        // This logic is now inside the map initialization useEffect or triggered by map state change
      } catch (e) {
        console.error('Failed to load draft from localStorage:', e);
        localStorage.removeItem('draft_lost_item'); // 손상된 데이터 삭제
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount, map/marker dependency removed here

  // Apply draft location when map is ready
  useEffect(() => {
    if (map && marker) {
      const draft = localStorage.getItem('draft_lost_item');
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          if (parsedDraft.location) {
            const { latitude, longitude } = parsedDraft.location;
            if (!isNaN(latitude) && !isNaN(longitude) && (latitude !== 37.5665 || longitude !== 126.9780)) { // Avoid centering on default
              const savedPosition = { lat: latitude, lng: longitude };
              console.log("Applying draft location to map:", savedPosition);
              map.setCenter(savedPosition);
              marker.setPosition(savedPosition);
              // Optionally update address if geocoding is desired on load
              // updateLocation(latitude, longitude);
            }
          }
        } catch (e) {
          console.error("Failed to apply draft location:", e);
        }
      }
    }
  }, [map, marker]); // Run when map or marker becomes available


  // --- 성공 화면 렌더링은 동일 ---
  if (success) {
    return (
      <div className="create-success page-container"> {/* 일관성을 위해 page-container 추가 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="success-icon"
        >
          <Check style={{ width: '3rem', height: '3rem', color: 'white' }} />
        </motion.div>
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          등록 완료!
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          분실물이 성공적으로 등록되었습니다.
        </motion.p>
        {/* 홈으로 돌아가는 버튼 추가 (선택적) */}
        <Button onClick={() => navigate('/home')} style={{ marginTop: '1.5rem' }}>
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  // --- JSX 렌더링 ---
  return (
    // page-container 추가
    <div className="page-container create-lost-item-page">
      {/* Header */}
      <header className="create-header">
        <button onClick={() => navigate(-1)} className="back-btn" aria-label="뒤로 가기">
          <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>
        <h1>분실물 등록</h1>
        <div style={{ width: '2.5rem' }} /> {/* 간격 유지용 빈 div */}
      </header>
      <button
        type="button"
        className="ai-floating-btn"
        onClick={() => {
          alert('AI 자동 입력 기능이 곧 제공될 예정입니다!');
        }}
        title="AI로 자동 작성"
      >
        <Sparkles style={{ width: '1.25rem', height: '1.25rem' }} />
      </button>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="progress-text">{Math.round(progress)}% 완료</p>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        {/* --- Item Type, Name, Category, Description, Photo Upload, Location, Contact, Reward, Date 섹션은 거의 동일 --- */}
        {/* 각 섹션 내 input/textarea/button에 id와 aria-label 등 접근성 속성 추가 권장 */}

        {/* Item Type Selection */}
        <div className="form-section">
          {/* ... (이전과 동일) ... */}
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
              aria-pressed={formData.itemType === 'lost'}
            >
              <span className="type-icon">🔍</span>
              <span>분실물</span>
            </button>
            <button
              type="button"
              className={`type-btn ${formData.itemType === 'found' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, itemType: 'found' })}
              aria-pressed={formData.itemType === 'found'}
            >
              <span className="type-icon">✨</span>
              <span>습득물</span>
            </button>
          </div>
        </div>

        {/* Item Name */}
        <div className="form-section">
          {/* ... (이전과 동일) ... */}
          <div className="label-with-check">
            <Label htmlFor="itemName">분실물 이름 *</Label>
            {formData.itemName.trim() && ( // 공백 제거 후 확인
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
            required // HTML5 기본 유효성 검사
            aria-required="true"
          />
        </div>

        {/* Category */}
        <div className="form-section">
          {/* ... (이전과 동일) ... */}
          <div className="label-with-check">
            <Label>카테고리 선택 *</Label>
            {formData.category && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <div className="category-grid" role="radiogroup" aria-labelledby="category-label">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                role="radio" // 역할 명시
                aria-checked={formData.category === cat.value} // 선택 상태 명시
                className={`category-btn ${formData.category === cat.value ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, category: cat.value })}
                style={{ '--category-color': cat.color } as React.CSSProperties}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-label">{cat.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="form-section">
          {/* ... (이전과 동일) ... */}
          <div className="label-with-check">
            <Label htmlFor="description">
              상세 설명 * <span className="description-counter">({formData.description.trim().length}/100)</span>
            </Label>
            {formData.description.trim().length >= 100 && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <Textarea
            id="description"
            placeholder="물건의 발견 or 습득 지역, 특징, 브랜드, 색상, 크기 등을 자세히 설명해주세요. (최소 100자 이상)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-textarea"
            style={{ minHeight: '8rem' }}
            required
            aria-required="true"
            minLength={100} // HTML5 유효성 검사
            aria-describedby="description-hint"
          />
        </div>

        {/* Photo Upload */}
        <div className="form-section">
          <div className="label-with-check">
            <Label htmlFor="photo-input">사진 업로드 * (최대 5장)</Label>
            {formData.photos.length > 0 && (
              <span className="field-check completed">✓ {formData.photos.length}장 업로드됨</span>
            )}
          </div>
          <div
            className={`photo-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver} // Enter 이벤트도 처리
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button" // 역할 명시
            aria-label="사진 업로드 영역"
          >
            <Upload style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} aria-hidden="true" />
            <p className="upload-text">클릭하거나 드래그하여 이미지 업로드</p>
            <p className="upload-hint">PNG, JPG, JPEG (최대 10MB)</p>
            <input
              id="photo-input"
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg" // 허용 타입 명시
              multiple
              onChange={(e) => handleImageChange(e.target.files)}
              style={{ display: 'none' }} // 화면에 보이지 않도록
              aria-hidden="true" // 스크린 리더에서 숨김
            />
          </div>

          {photosPreviews.length > 0 && (
            <div className="photos-preview" aria-live="polite">
              <p className="sr-only">{photosPreviews.length}개의 사진 미리보기</p>
              {photosPreviews.map((preview, index) => (
                <div key={index} className="photo-preview-item">
                  <img src={preview} alt={`업로드된 사진 ${index + 1} 미리보기`} />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // 이벤트 버블링 방지
                      removePhoto(index);
                    }}
                    aria-label={`${index + 1}번째 사진 삭제`}
                  >
                    <X style={{ width: '1rem', height: '1rem' }} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="form-section">
          {/* ... (이전과 동일, mapRef 접근 시 null 체크 강화) ... */}
          <div className="label-with-check">
            <Label>분실 위치 (지도에서 선택)</Label>
            {/* 주소가 있고 기본 서울 위치가 아니면 완료 표시 */}
            {formData.location.address && formData.location.latitude !== 37.5665 && (
              <span className="field-check completed">✓ 위치 설정됨</span>
            )}
          </div>
          <p className="location-hint">
            지도를 클릭/드래그하여 위치를 선택하거나 아래 버튼으로 현재 위치를 사용하세요.
          </p>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="location-btn"
            disabled={isLoading} // 로딩 중 비활성화
          >
            {/* Show loader when fetching location */}
            {isLoading && !error && <Loader2 className="spinner" size={16} />}
            <MapPin style={{ width: '1rem', height: '1rem' }} aria-hidden="true" />
            현재 위치 사용
          </button>
          {/* 지도 영역 */}
          <div
            className="map-container"
            ref={mapRef}
            aria-label="분실 위치 선택 지도"
            role="application" // 지도는 application 역할 가질 수 있음
          >
            {/* 지도가 로드되지 않았을 때 대체 텍스트 */}
            {/* {!map && <div className="map-placeholder">지도 로딩 중...</div>} */}
          </div>
          {/* 선택된 주소 표시 */}
          <div className={`location-address ${!formData.location.address || formData.location.latitude === 37.5665 ? 'default' : ''}`}>
            <MapPin style={{ width: '1rem', height: '1rem', color: !formData.location.address || formData.location.latitude === 37.5665 ? '#9ca3af' : 'var(--primary)' }} aria-hidden="true" />
            <span>{formData.location.address || '지도에서 위치를 선택해주세요.'}</span>
          </div>
        </div>

        {/* Contact Info */}

        {/* Reward Points */}
        <div className="form-section">
          {/* ... (이전과 동일) ... */}
          <div className="label-with-check">
            <Label htmlFor="rewardPoints">
              <Coins style={{ width: '1rem', height: '1rem' }} aria-hidden="true" />
              리워드 포인트 (선택사항)
            </Label>
            {formData.rewardPoints > 0 && (
              <span className="field-check completed">✓ {formData.rewardPoints.toLocaleString()}P 설정됨</span> // 천단위 콤마
            )}
          </div>
          <p className="points-balance">
            {currentUser ? `${currentUser.nickname}님의 보유 포인트: ${currentUser.point?.toLocaleString() ?? 0}P` : '포인트 정보 로딩 중...'}
          </p>
          <input
            id="rewardPoints"
            type="range"
            min="0"
            max={currentUser?.point || 0} // 현재 사용자 포인트가 최대값
            step="100" // 100 단위로 조절
            value={formData.rewardPoints}
            onChange={(e) => setFormData({ ...formData, rewardPoints: parseInt(e.target.value, 10) })} // 10진수 명시
            className="points-slider"
            aria-valuemin={0}
            aria-valuemax={currentUser?.point || 0}
            aria-valuenow={formData.rewardPoints}
            aria-label="리워드 포인트 설정 슬라이더"
            disabled={!currentUser || currentUser.point === 0} // Disable if no points
          />
          <div className="points-labels">
            <span>0 P</span>
            <span>{currentUser?.point?.toLocaleString() ?? 0} P</span>
          </div>
          <p className="input-hint">습득자에게 사례금으로 지급할 포인트를 설정할 수 있습니다.</p>
        </div>

        {/* Lost Date */}
        <div className="form-section">
          {/* ... (이전과 동일) ... */}
          <div className="label-with-check">
            <Label htmlFor="lostDate">
              <CalendarIcon style={{ width: '1rem', height: '1rem' }} aria-hidden="true" />
              분실/습득 날짜 *
            </Label>
            {formData.lostDate && (
              <span className="field-check completed">✓ 완료</span>
            )}
          </div>
          <Input
            id="lostDate"
            type="date"
            value={formData.lostDate}
            max={new Date().toISOString().split('T')[0]} // 오늘 이후 날짜 선택 불가
            onChange={(e) => setFormData({ ...formData, lostDate: e.target.value })}
            className="form-input"
            required
            aria-required="true"
          />
        </div>

        {/* [NEW] Anonymous Toggle */}
        <div className="form-section anonymous-section">
          <div className="anonymous-label-wrapper">
            <Label htmlFor="isAnonymous" className="anonymous-label">
              <ShieldQuestion style={{ width: '1rem', height: '1rem' }} aria-hidden="true" />
              익명으로 등록하기
            </Label>
            <input
              type="checkbox"
              id="isAnonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="anonymous-checkbox"
            />
          </div>
          <p className="input-hint anonymous-hint">
            체크 시 게시글 목록과 상세 페이지에서 작성자 정보(닉네임, 프로필 사진)가 표시되지 않습니다.
          </p>
        </div>


        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="error-banner"
              role="alert" // 에러 메시지 역할 명시
            >
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} aria-hidden="true" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !isFormValid()} // 유효성 검사 결과도 비활성화 조건에 포함
          className="submit-btn"
        // onClick 핸들러 제거 (form의 onSubmit 사용)
        >
          {isLoading ? (
            <>
              <Loader2 className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} aria-hidden="true" />
              등록 중...
            </>
          ) : (
            '등록하기'
          )}
        </Button>

        <p className="auto-save-hint">
          {/* 진행률 대신 내용이 있을 때 저장된다는 안내 */}
          {(formData.itemName || formData.description || formData.category) && '작성 중인 내용이 자동으로 임시 저장됩니다.'}
        </p>
      </form>
    </div>
  );
}