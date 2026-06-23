
// import { IonActionSheet } from '@ionic/react';
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { MapPin, Calendar, Share2, Flag, MessageCircle, ChevronLeft, ChevronRight, X, Star, Heart, Edit, Trash, MoreVertical } from 'lucide-react';
// import { useTheme } from '../utils/theme';
// import { getValidAuthToken, getUserInfo } from '../utils/auth';
// import { createChatRoom } from '../utils/chat';
// import '../styles/item-detail.css';
// import { API_BASE_URL } from '../config';
// import { Share } from '@capacitor/share';
// import {
//   shareOutline,       // 공유 아이콘
//   ellipsisVertical,   // 점 3개 더보기 아이콘
//   createOutline,      // 수정 아이콘
//   trashOutline,       // 삭제 아이콘
//   closeOutline        // 닫기 아이콘
// } from 'ionicons/icons';

// interface ApiPost {
//   id: number;
//   title: string;
//   content: string;
//   type: 'LOST' | 'FOUND';
//   author?: {
//     id: number;
//     nickname: string;
//     profileImage: string;
//     totalScore: number;
//     totalReviews: number;
//   };
//   viewCount: number;
//   images: string[];
//   setPoint: number;
//   itemCategory: string;
//   lat: number;
//   lon: number;
//   lostAt: string;
//   createdAt: string;
//   updatedAt: string;
//   isAnonymous: boolean;
//   isCompleted: boolean;
//   likeCount?: number;
//   isLiked?: boolean;
// }

// interface ItemDetail {
//   id: string;
//   type: 'lost' | 'found';
//   title: string;
//   description: string;
//   category: string;
//   images: string[];
//   location: {
//     address: string;
//     coordinates: { lat: number; lng: number };
//   };
//   dateInfo: {
//     lostDate: string;
//     postedDate: string;
//   };
//   reward: {
//     points: number;
//     description: string;
//   };
//   status: 'active' | 'matched' | 'completed';
//   viewCount: number;
//   bookmarkCount: number;
//   isBookmarked: boolean;
//   likes: number;
//   isLiked: boolean;
// }

// interface UserInfo {
//   id: string;
//   nickname: string;
//   profileImage: string;
//   trustScore: number;
//   successCount: number;
//   badges: string[];
//   isOnline: boolean;
// }

// const CATEGORY_MAP: { [key: string]: string } = {
//   'PHONE': '휴대폰',
//   'WALLET': '지갑',
//   'KEY': '열쇠',
//   'BAG': '가방',
//   'ELECTRONICS': '전자기기',
//   'ACCESSORY': '액세서리',
//   'DOCUMENT': '문서',
//   'ETC': '기타',
// };

// const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

// const ItemDetailPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { id } = useParams<{ id: string }>();
//   const { theme } = useTheme();
//   // const currentUser = getUserInfo(); // loadItemDetail 내부에서 최신 정보 호출하도록 변경

//   const [item, setItem] = useState<ItemDetail | null>(null);
//   const [postAuthor, setPostAuthor] = useState<UserInfo | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   // [수정] isMyPost를 상태로 관리 (익명 여부와 관계없이 ID 비교를 위해)
//   const [isMyPost, setIsMyPost] = useState(false);

//   // 좌표 -> 주소 변환 함수
//   const convertCoordsToAddress = async (lat: number, lng: number) => {
//     if (window.google && window.google.maps && window.google.maps.Geocoder) {
//       try {
//         const geocoder = new google.maps.Geocoder();
//         const response = await geocoder.geocode({ location: { lat, lng } });
//         if (response.results && response.results[0]) {
//           return response.results[0].formatted_address.replace(/^대한민국\s*/, '');
//         }
//       } catch (e) {
//         console.error("Geocoding failed:", e);
//       }
//     }
//     return null;
//   };

//   useEffect(() => {
//     if (!item) return;
//     if (item.location.address && !item.location.address.startsWith('위도:')) return;

//     const updateAddress = async () => {
//       const addr = await convertCoordsToAddress(item.location.coordinates.lat, item.location.coordinates.lng);
//       if (addr) {
//         setItem(prev => prev ? ({
//           ...prev,
//           location: {
//             ...prev.location,
//             address: addr
//           }
//         }) : null);
//       }
//     };

//     if (window.google && window.google.maps) {
//       updateAddress();
//     } else {
//       const interval = setInterval(() => {
//         if (window.google && window.google.maps) {
//           clearInterval(interval);
//           updateAddress();
//         }
//       }, 500);
//       return () => clearInterval(interval);
//     }
//   }, [item]);

//   useEffect(() => {
//     window.scrollTo(0, 0);
//     if (id) {
//       loadItemDetail(id);
//     }
//   }, [id]);

//   const loadItemDetail = async (itemId: string) => {
//     setIsLoading(true);

//     try {
//       const token = await getValidAuthToken();
//       const headers: HeadersInit = { 'Accept': 'application/json' };
//       if (token) headers['Authorization'] = `Bearer ${token}`;

//       const response = await fetch(`${API_BASE_URL}/post/${itemId}`, {
//         method: 'GET',
//         headers: headers,
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch item details: ${response.status}`);
//       }

//       const data: ApiPost = await response.json();

//       // [핵심 수정] 게시물 소유권 확인 로직 추가
//       // 익명 여부(isAnonymous)와 상관없이 실제 author ID와 내 ID를 비교
//       const currentUser = getUserInfo();
//       if (currentUser && data.author) {
//         // 문자열 변환하여 비교 (타입 불일치 방지)
//         if (String(currentUser.id) === String(data.author.id)) {
//           setIsMyPost(true);
//         } else {
//           setIsMyPost(false);
//         }
//       } else {
//         setIsMyPost(false);
//       }

//       // 주소 초기값 설정
//       let address = `위도: ${data.lat}, 경도: ${data.lon}`;

//       if (window.google && window.google.maps && window.google.maps.Geocoder) {
//         try {
//           const geocoder = new google.maps.Geocoder();
//           const geoResponse = await geocoder.geocode({ location: { lat: data.lat, lng: data.lon } });
//           if (geoResponse.results && geoResponse.results[0]) {
//             address = geoResponse.results[0].formatted_address.replace(/^대한민국\s*/, '');
//           }
//         } catch (e) {
//           console.error("Initial geocoding failed, will retry in useEffect", e);
//         }
//       }

//       const images = data.images && data.images.length > 0
//         ? data.images
//         : [DEFAULT_IMAGE];

//       const mappedItem: ItemDetail = {
//         id: data.id.toString(),
//         type: (data.type || 'LOST').toLowerCase() as 'lost' | 'found',
//         title: data.title,
//         description: data.content,
//         category: CATEGORY_MAP[data.itemCategory] || data.itemCategory,
//         images: images,
//         location: {
//           address: address,
//           coordinates: { lat: data.lat, lng: data.lon }
//         },
//         dateInfo: {
//           lostDate: data.lostAt,
//           postedDate: data.createdAt
//         },
//         reward: {
//           points: data.setPoint,
//           description: data.setPoint > 0 ? `${data.setPoint.toLocaleString()} 포인트` : '사례금 없음'
//         },
//         status: data.isCompleted ? 'completed' : 'active',
//         viewCount: data.viewCount,
//         bookmarkCount: 0,
//         isBookmarked: false,
//         likes: data.likeCount || 0,
//         isLiked: data.isLiked || false
//       };

//       setItem(mappedItem);

//       // 작성자 정보 설정 (익명 처리 로직 유지)
//       if (data.author && !data.isAnonymous) {
//         const avgScore = data.author.totalReviews > 0
//           ? data.author.totalScore / data.author.totalReviews
//           : 0;
//         const trustScore = Math.round(avgScore);

//         setPostAuthor({
//           id: data.author.id.toString(),
//           nickname: data.author.nickname,
//           profileImage: data.author.profileImage || 'https://via.placeholder.com/150?text=User',
//           trustScore: trustScore,
//           successCount: 0,
//           badges: [],
//           isOnline: false
//         });
//       } else {
//         // 익명일 경우 표시 정보는 가리지만, 위에서 isMyPost는 이미 true로 설정됨
//         setPostAuthor({
//           id: 'anonymous',
//           nickname: '익명',
//           profileImage: 'https://via.placeholder.com/150?text=Anonymous',
//           trustScore: 0,
//           successCount: 0,
//           badges: [],
//           isOnline: false
//         });
//       }

//     } catch (error) {
//       console.error("Load detail error", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!confirm('정말 이 게시물을 삭제하시겠습니까?')) return;
//     try {
//       const token = await getValidAuthToken();
//       if (!token) {
//         alert("로그인이 필요합니다.");
//         return;
//       }
//       const response = await fetch(`${API_BASE_URL}/post/${id}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         alert('게시물이 삭제되었습니다.');
//         navigate('/home');
//       } else {
//         throw new Error('삭제 실패');
//       }
//     } catch (error) {
//       alert('삭제에 실패했습니다.');
//     }
//     setIsMenuOpen(false);
//   };

//   const handleLike = async () => {
//     if (!item || !id) return;
//     const token = await getValidAuthToken();
//     if (!token) {
//       if (confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?")) navigate('/login');
//       return;
//     }
//     const prevItem = { ...item };
//     setItem({
//       ...item,
//       likes: item.isLiked ? item.likes - 1 : item.likes + 1,
//       isLiked: !item.isLiked
//     });
//     try {
//       const action = prevItem.isLiked ? 'unlike' : 'like';
//       const response = await fetch(`${API_BASE_URL}/post/${id}/${action}`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error('Like action failed');
//     } catch (error) {
//       setItem(prevItem);
//     }
//   };

//   const handleEdit = () => {
//     setIsMenuOpen(false);

//   };

//   const handleShare = async () => {
//     // [1번 알림] 함수 진입 확인
//     // alert('1. 공유 버튼 클릭됨 (함수 진입)');

//     if (!item || !id) {
//       // alert('데이터 없음 에러');
//       return;
//     }
//     const isLost = item.type === 'lost';

//     const prefix = isLost ? '🚨 도와주세요!' : '📢 주인을 찾습니다!';
//     const suffix = isLost ? '혹시 보신 분 계신가요?' : '주인분은 여기서 확인하세요!';

//   const shareText = `[Find X]\n${prefix} ${item.title}\n${suffix}`;
//     const realUrl = `https://treasurehunter.seohamin.com/post/${id}`;
//     const shareData = {
//       title: 'Find X',
//       text: `${shareText}`,
//       url: realUrl,
//       dialogTitle: '공유하기',
//     };

//     try {
//       // [2번 알림] 플러그인 호출 직전

//       // canShare 체크 없이 바로 실행
//       await Share.share(shareData);

//       // [3번 알림] 이게 안 뜨면 플러그인이 먹통인 것
//       // alert('3. 공유 창 열림 성공');

//     } catch (error: any) {
//       // [4번 알림] 에러 내용 출력
//       // alert('4. 에러 발생: ' + JSON.stringify(error));
//       console.error('Share Error:', error);
//     }
//   };
//   const handleReport = () => {
//     if (confirm('이 게시물을 신고하시겠습니까?')) {
//       alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
//     }
//   };

//   const handleStartChat = async () => {
//     const currentUser = getUserInfo();
//     if (!currentUser) {
//       if (confirm('로그인이 필요한 서비스입니다. 로그인 하시겠습니까?')) {
//         navigate('/login');
//       }
//       return;
//     }
//     if (currentUser.role === 'NOT_VERIFIED') {
//       navigate('/verify-phone');
//       return;
//     }
//     if (isMyPost) {
//       alert("자신의 게시물에는 채팅을 걸 수 없습니다.");
//       return;
//     }
//     try {
//       const roomName = `${item?.title}`;
//       const postId = parseInt(item?.id || '0', 10);
//       if (!postId) {
//         alert("잘못된 게시글 정보입니다.");
//         return;
//       }
//       const roomId = await createChatRoom(roomName, postId, false);
//       navigate(`/chat/${roomId}`);
//     } catch (error) {
//       alert(error instanceof Error ? error.message : '채팅방 생성에 실패했습니다.');
//     }
//   };

//   const nextImage = () => {
//     setCurrentImageIndex((prev) => prev === (item?.images.length || 0) - 1 ? 0 : prev + 1);
//   };

//   const prevImage = () => {
//     setCurrentImageIndex((prev) => prev === 0 ? (item?.images.length || 0) - 1 : prev - 1);
//   };

//   if (isLoading) {
//     return (
//       <div className="item-detail-loading">
//         <div className="loading-spinner"></div>
//         <p>보물 정보를 불러오는 중...</p>
//       </div>
//     );
//   }

//   if (!item) {
//     return (
//       <div className="item-detail-error">
//         <p>게시물을 찾을 수 없습니다.</p>
//         <button onClick={() => navigate('/home')}>홈으로 돌아가기</button>
//       </div>
//     );
//   }

//   return (
//     <div className={`item-detail-page ${theme}`}>
//       <div className="detail-header">
//         <button className="back-button" onClick={() => navigate(-1)}>
//           <ChevronLeft size={24} />
//         </button>
//         <div className="header-actions">
//           <button className="icon-button" onClick={handleShare}>
//             <Share2 size={20} />
//           </button>
//           {isMyPost ? (
//             <div className="menu-wrapper">
//               <button
//                 className="icon-button"
//                 onClick={() => setIsMenuOpen(!isMenuOpen)}
//               >
//                 <MoreVertical size={20} />
//               </button>
//               {isMenuOpen && (
//                 <>
//                   <IonActionSheet
//   isOpen={isMenuOpen}
//   onDidDismiss={() => setIsMenuOpen(false)}
//   header="게시글 설정"
//   buttons={[
//     {
//       text: '수정',
//       // 필요하다면 Ionic 아이콘 import: import { createOutline, trashOutline, closeOutline } from 'ionicons/icons';
//       icon: createOutline, 
//       handler: () => {
//         setIsMenuOpen(false);
//         handleEdit(); // 기존 수정 함수 호출
//       }
//     },
//     {
//       text: '삭제',
//       icon: trashOutline,
//       role: 'destructive', // 빨간색 텍스트로 표시
//       handler: () => {
//         setIsMenuOpen(false);
//         // 바로 지우지 않고 한 번 더 묻고 싶다면 여기에 Alert 띄우기!
//         handleDelete(); // 기존 삭제 함수 호출
//       }
//     },
//     {
//       text: '취소',
//       icon: closeOutline,
//       role: 'cancel',
//       handler: () => {
//         setIsMenuOpen(false);
//       }
//     }
//   ]}
// />
//                 </>
//               )}
//             </div>
//           ) : (
//             <button className="icon-button" onClick={handleReport}>
//               <Flag size={20} />
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="image-slider">
//         <div className="slider-container">
//           {item.images.length > 0 && (
//             <img
//               src={item.images[currentImageIndex]}
//               alt={`${item.title} - ${currentImageIndex + 1}`}
//               onClick={() => setIsImageViewerOpen(true)}
//             />
//           )}
//           {item.images.length > 1 && (
//             <>
//               <button className="slider-nav prev" onClick={prevImage}>
//                 <ChevronLeft size={24} />
//               </button>
//               <button className="slider-nav next" onClick={nextImage}>
//                 <ChevronRight size={24} />
//               </button>
//               <div className="slider-indicators">
//                 {item.images.map((_, index) => (
//                   <span
//                     key={index}
//                     className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
//                     onClick={() => setCurrentImageIndex(index)}
//                   />
//                 ))}
//               </div>
//             </>
//           )}
//         </div>
//         <div className="image-counter">
//           {currentImageIndex + 1} / {item.images.length}
//         </div>
//       </div>

//       <div className="detail-content">
//         <div className="item-header">
//           {item.status === 'completed' ? (
//             <span className="type-badge completed" style={{ background: '#6b7280', color: 'white' }}>
//               완료
//             </span>
//           ) : (
//             <span className={`type-badge ${item.type}`}>
//               {item.type === 'lost' ? '분실물' : '습득물'}
//             </span>
//           )}
//           <h1>{item.title}</h1>
//           <div className="item-meta">
//             <span className="category">{item.category}</span>
//             <span className="views">조회수 {item.viewCount}</span>
//           </div>
//         </div>

//         {postAuthor && (
//           <div className="user-card" onClick={() => postAuthor.id !== 'anonymous' && navigate(`/other-profile/${postAuthor.id}`)}>
//             <div className="user-avatar-wrapper">
//               <img src={postAuthor.profileImage} alt={postAuthor.nickname} className="user-avatar" />
//               {postAuthor.isOnline && <span className="online-indicator"></span>}
//             </div>
//             <div className="user-info">
//               <div className="user-name">
//                 <span>{postAuthor.nickname}</span>
//                 {/* 내 게시글(익명 포함)이면 (나) 표시 */}
//                 {isMyPost && <span style={{ fontSize: '0.8em', color: 'var(--primary)', marginLeft: '4px' }}>(나)</span>}
//                 {postAuthor.badges.map((badge, idx) => (
//                   <span key={idx} className="user-badge">{badge}</span>
//                 ))}
//               </div>
//               <div className="user-stats">
//                 <span className="trust-score">
//                   <Star size={14} fill="#10b981" stroke="#10b981" />
//                   신뢰도 {postAuthor.trustScore}%
//                 </span>
//               </div>
//             </div>
//             {postAuthor.id !== 'anonymous' && <ChevronRight size={20} className="chevron" />}
//           </div>
//         )}

//         {item.reward.points > 0 && (
//           <div className="reward-card">
//             <div className="reward-icon">💰</div>
//             <div className="reward-info">
//               <p className="reward-points">{item.reward.points.toLocaleString()} 포인트</p>
//               <p className="reward-description">{item.reward.description}</p>
//             </div>
//           </div>
//         )}

//         <div className="description-section">
//           <h2>상세 설명</h2>
//           <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'break-word' }}>{item.description}</p>
//         </div>

//         <div className="info-section">
//           <h2>날짜 정보</h2>
//           <div className="info-item">
//             <Calendar size={18} />
//             <div>
//               <p className="info-label">{item.type === 'lost' ? '분실 날짜' : '습득 날짜'}</p>
//               <p className="info-value">{new Date(item.dateInfo.lostDate).toLocaleDateString('ko-KR')}</p>
//             </div>
//           </div>
//           <div className="info-item">
//             <Calendar size={18} />
//             <div>
//               <p className="info-label">게시 날짜</p>
//               <p className="info-value">{new Date(item.dateInfo.postedDate).toLocaleDateString('ko-KR')}</p>
//             </div>
//           </div>
//         </div>

//         <div className="location-section">
//           <h2>
//             <MapPin size={20} />
//             {item.type === 'lost' ? '분실 위치' : '습득 위치'}
//           </h2>
//           <p className="location-address">{item.location.address}</p>
//           <div className="map-container">
//             <iframe
//               src={`https://maps.google.com/maps?q=${item.location.coordinates.lat},${item.location.coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
//               width="100%"
//               height="250"
//               style={{ border: 0, borderRadius: '12px' }}
//               allowFullScreen
//               loading="lazy"
//               title="map"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="bottom-actions">
//         <button
//           className={`like-button ${item.isLiked ? 'active' : ''}`}
//           onClick={handleLike}
//         >
//           <Heart
//             size={20}
//             fill={item.isLiked ? "#ef4444" : "none"}
//             stroke={item.isLiked ? "#ef4444" : "currentColor"}
//           />
//           <span>{item.likes}</span>
//         </button>

//         {isMyPost ? (
//           <button className="chat-button" style={{ background: '#e5e7eb', color: '#374151', cursor: 'default' }}>
//             내가 쓴 글
//           </button>
//         ) : (
//           <button className="chat-button" onClick={handleStartChat}>
//             <MessageCircle size={20} />
//             채팅하기
//           </button>
//         )}
//       </div>

//       {isImageViewerOpen && (
//         <div className="image-viewer-modal" onClick={() => setIsImageViewerOpen(false)}>
//           <div className="viewer-header" onClick={(e) => e.stopPropagation()}>
//             <button className="close-viewer" onClick={() => setIsImageViewerOpen(false)} aria-label="닫기">
//               <X size={28} />
//             </button>
//           </div>
//           <div className="viewer-content" onClick={(e) => e.stopPropagation()}>
//             <img
//               src={item.images[currentImageIndex]}
//               alt={item.title}
//               onClick={(e) => e.stopPropagation()}
//             />
//           </div>
//           <div className="viewer-footer" onClick={(e) => e.stopPropagation()}>
//             {item.images.length > 1 && (
//               <>
//                 <button className="viewer-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
//                   <ChevronLeft size={28} />
//                 </button>
//                 <div className="viewer-counter">
//                   {currentImageIndex + 1} / {item.images.length}
//                 </div>
//                 <button className="viewer-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
//                   <ChevronRight size={28} />
//                 </button>
//               </>
//             )}
//             {item.images.length === 1 && (
//               <div className="viewer-counter viewer-counter-single">
//                 {currentImageIndex + 1} / {item.images.length}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ItemDetailPage;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Calendar, Share2, Flag, MessageCircle, ChevronLeft, ChevronRight, X, Heart, Trash, MoreVertical, Navigation } from 'lucide-react';
import { useTheme } from '../utils/theme';
import { getValidAuthToken, getUserInfo } from '../utils/auth';
import { createChatRoom } from '../utils/chat';
import '../styles/item-detail.css';
import { API_BASE_URL } from '../config';
import { Share } from '@capacitor/share';
import { Dialog } from "@capacitor/dialog";



interface ApiPost {
  id: number;
  title: string;
  content: string;
  type: 'LOST' | 'FOUND';
  author?: {
    id: number;
    nickname: string;
    profileImage: string;
    totalScore: number;
    totalReviews: number;
  };
  viewCount: number;
  images: string[];
  setPoint: number;
  itemCategory: string;
  lat: number;
  lon: number;
  lostAt: string;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  isCompleted: boolean;
  likeCount?: number;
  isLiked?: boolean;
}

interface ItemDetail {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  images: string[];
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  dateInfo: {
    lostDate: string;
    postedDate: string;
  };
  reward: {
    points: number;
    description: string;
  };
  status: 'active' | 'matched' | 'completed';
  viewCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
  likes: number;
  isLiked: boolean;
}

interface UserInfo {
  id: string;
  nickname: string;
  profileImage: string;
  trustScore: number;
  successCount: number;
  badges: string[];
  isOnline: boolean;
}

const CATEGORY_MAP: { [key: string]: string } = {
  'PHONE': '휴대폰',
  'WALLET': '지갑',
  'KEY': '열쇠',
  'BAG': '가방',
  'ELECTRONICS': '전자기기',
  'ACCESSORY': '액세서리',
  'DOCUMENT': '문서',
  'ETC': '기타',
};

const DEFAULT_IMAGE = 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ba/3c/ba3cbac6421ad26702c10ac05fe7c280a1686683f37321aebfb5026aa560ee21.png';

const ItemDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [postAuthor, setPostAuthor] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMyPost, setIsMyPost] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat:number;lng:number}|null>(null);

  // 사용자 위치 가져오기
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  // Google Maps JS API — 커스텀 마커
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!item || !mapRef.current) return;
    const initMap = () => {
      if (!window.google?.maps || !mapRef.current) return;
      const pos = { lat: item.location.coordinates.lat, lng: item.location.coordinates.lng };

      // Cream 배경 스타일 맵
      const mapStyles: google.maps.MapTypeStyle[] = [
        { elementType: 'geometry', stylers: [{ color: '#F5F2E8' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#4D7A62' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F2E8' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#ECE8DC' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D8EFE3' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#E8E4D8' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#D0E8D6' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ];

      const map = new google.maps.Map(mapRef.current, {
        center: pos,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: false,
        styles: mapStyles,
        gestureHandling: 'cooperative',
      });
      mapInstanceRef.current = map;

      // 사용자 현재 위치 (파란 점)
      if (userLocation) {
        new google.maps.Marker({
          position: userLocation,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 1,
            scale: 8,
            strokeColor: 'white',
            strokeWeight: 2,
          },
        });

        // 50m, 1km 동심원 (이미지 스타일)
        [50, 1000].forEach(radius => {
          new google.maps.Circle({
            strokeColor: '#4D7A62',
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillOpacity: 0,
            map: map,
            center: userLocation,
            radius: radius,
            clickable: false,
          });
        });
      }

      // 커스텀 드롭핀 마커 (빨강 = lost, 초록 = found)
      const pinColor = item.type === 'lost' ? '#D97474' : '#0F3D2E';
      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
          <defs>
            <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.25)"/>
            </filter>
          </defs>
          <path d="M20 50 C20 50 36 30 36 18 C36 9.16 28.84 2 20 2 C11.16 2 4 9.16 4 18 C4 30 20 50 20 50Z"
                fill="${pinColor}" filter="url(#shadow)"/>
          <circle cx="20" cy="18" r="7" fill="white" opacity="0.9"/>
        </svg>`;

      new google.maps.Marker({
        position: pos,
        map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
          scaledSize: new google.maps.Size(40, 52),
          anchor: new google.maps.Point(20, 50),
        },
      });
    };

    if (window.google?.maps) {
      initMap();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps) { clearInterval(interval); initMap(); }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [item, userLocation]);

  // 좌표 -> 주소 변환 함수
  const convertCoordsToAddress = async (lat: number, lng: number) => {
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
          return response.results[0].formatted_address.replace(/^대한민국\s*/, '');
        }
      } catch (e) {
        console.error("Geocoding failed:", e);
      }
    }
    return null;
  };

  useEffect(() => {
    if (!item) return;
    if (item.location.address && !item.location.address.startsWith('위도:')) return;

    const updateAddress = async () => {
      const addr = await convertCoordsToAddress(item.location.coordinates.lat, item.location.coordinates.lng);
      if (addr) {
        setItem(prev => prev ? ({
          ...prev,
          location: {
            ...prev.location,
            address: addr
          }
        }) : null);
      }
    };

    if (window.google && window.google.maps) {
      updateAddress();
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(interval);
          updateAddress();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [item]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      loadItemDetail(id);
    }
  }, [id]);

  const loadItemDetail = async (itemId: string) => {
    setIsLoading(true);

    try {
      const token = await getValidAuthToken();
      const headers: HeadersInit = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/post/${itemId}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch item details: ${response.status}`);
      }

      const data: ApiPost = await response.json();

      // 게시물 소유권 확인 로직 추가
      const currentUser = getUserInfo();
      if (currentUser && data.author) {
        if (String(currentUser.id) === String(data.author.id)) {
          setIsMyPost(true);
        } else {
          setIsMyPost(false);
        }
      } else {
        setIsMyPost(false);
      }

      // 주소 초기값 설정
      let address = `위도: ${data.lat}, 경도: ${data.lon}`;

      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        try {
          const geocoder = new google.maps.Geocoder();
          const geoResponse = await geocoder.geocode({ location: { lat: data.lat, lng: data.lon } });
          if (geoResponse.results && geoResponse.results[0]) {
            address = geoResponse.results[0].formatted_address.replace(/^대한민국\s*/, '');
          }
        } catch (e) {
          console.error("Initial geocoding failed, will retry in useEffect", e);
        }
      }

      const images = data.images && data.images.length > 0
        ? data.images
        : [DEFAULT_IMAGE];

      const mappedItem: ItemDetail = {
        id: data.id.toString(),
        type: (data.type || 'LOST').toLowerCase() as 'lost' | 'found',
        title: data.title,
        description: data.content,
        category: CATEGORY_MAP[data.itemCategory] || data.itemCategory,
        images: images,
        location: {
          address: address,
          coordinates: { lat: data.lat, lng: data.lon }
        },
        dateInfo: {
          lostDate: data.lostAt,
          postedDate: data.createdAt
        },
        reward: {
          points: data.setPoint,
          description: data.setPoint > 0 ? `${data.setPoint.toLocaleString()} 포인트` : '사례금 없음'
        },
        status: data.isCompleted ? 'completed' : 'active',
        viewCount: data.viewCount,
        bookmarkCount: 0,
        isBookmarked: false,
        likes: data.likeCount || 0,
        isLiked: data.isLiked || false
      };

      setItem(mappedItem);

      // 작성자 정보 설정
      if (data.author && !data.isAnonymous) {
        const avgScore = data.author.totalReviews > 0
          ? data.author.totalScore / data.author.totalReviews
          : 0;
        const trustScore = Math.round(avgScore);

        setPostAuthor({
          id: data.author.id.toString(),
          nickname: data.author.nickname,
          profileImage: data.author.profileImage || 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png',
          trustScore: trustScore,
          successCount: 0,
          badges: [],
          isOnline: false
        });
      } else {
        setPostAuthor({
          id: 'anonymous',
          nickname: '익명',
          profileImage: 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png',
          trustScore: 0,
          successCount: 0,
          badges: [],
          isOnline: false
        });
      }

    } catch (error) {
      console.error("Load detail error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsMenuOpen(false); // 메뉴 닫기
    if (!(await Dialog.confirm({ title: '알림', message: '정말 이 게시물을 삭제하시겠습니까?' })).value) return;
    try {
      const token = await getValidAuthToken();
      if (!token) {
        await Dialog.alert({ title: '알림', message: "로그인이 필요합니다." });
        return;
      }
      const response = await fetch(`${API_BASE_URL}/post/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await Dialog.alert({ title: '알림', message: '게시물이 삭제되었습니다.' });
        navigate('/home');
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      await Dialog.alert({ title: '알림', message: '삭제에 실패했습니다.' });
    }
  };

  const handleLike = async () => {
    if (!item || !id) return;
    const token = await getValidAuthToken();
    if (!token) {
      if ((await Dialog.confirm({ title: '알림', message: "로그인이 필요한 기능입니다. 로그인하시겠습니까?" })).value) navigate('/login');
      return;
    }
    const prevItem = { ...item };
    setItem({
      ...item,
      likes: item.isLiked ? item.likes - 1 : item.likes + 1,
      isLiked: !item.isLiked
    });
    try {
      const action = prevItem.isLiked ? 'unlike' : 'like';
      const response = await fetch(`${API_BASE_URL}/post/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Like action failed');
    } catch (error) {
      setItem(prevItem);
    }
  };



  const handleShare = async () => {
    if (!item || !id) return;
    const isLost = item.type === 'lost';

    const prefix = isLost ? '🚨 도와주세요!' : '📢 주인을 찾습니다!';
    const suffix = isLost ? '혹시 보신 분 계신가요?' : '주인분은 여기서 확인하세요!';

    const shareText = `[Find X]\n${prefix} ${item.title}\n${suffix}`;
    const realUrl = `https://treasurehunter.seohamin.com/post/${id}`;
    const shareData = {
      title: 'Find X',
      text: `${shareText}`,
      url: realUrl,
      dialogTitle: '공유하기',
    };

    try {
      await Share.share(shareData);
    } catch (error: any) {
      console.error('Share Error:', error);
    }
  };

  const handleReport = async () => {
    if ((await Dialog.confirm({ title: '알림', message: '이 게시물을 신고하시겠습니까?' })).value) {
      await Dialog.alert({ title: '알림', message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.' });
    }
  };

  const handleStartChat = async () => {
    const currentUser = getUserInfo();
    if (!currentUser) {
      if ((await Dialog.confirm({ title: '알림', message: '로그인이 필요한 서비스입니다. 로그인 하시겠습니까?' })).value) {
        navigate('/login');
      }
      return;
    }
    if (currentUser.role === 'NOT_VERIFIED') {
      navigate('/verify-phone');
      return;
    }
    if (isMyPost) {
      await Dialog.alert({ title: '알림', message: "자신의 게시물에는 채팅을 걸 수 없습니다." });
      return;
    }
    try {
      const roomName = `${item?.title}`;
      const postId = parseInt(item?.id || '0', 10);
      if (!postId) {
        await Dialog.alert({ title: '알림', message: "잘못된 게시글 정보입니다." });
        return;
      }
      const roomId = await createChatRoom(roomName, postId, false);
      navigate(`/chat/${roomId}`);
    } catch (error) {
      await Dialog.alert({ title: '알림', message: error instanceof Error ? error.message : '채팅방 생성에 실패했습니다.' });
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => prev === (item?.images.length || 0) - 1 ? 0 : prev + 1);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => prev === 0 ? (item?.images.length || 0) - 1 : prev - 1);
  };

  if (isLoading) {
    return (
      <div className="item-detail-loading">
        <div className="loading-spinner"></div>
        <p>보물 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-detail-error">
        <p>게시물을 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/home')}>홈으로 돌아가기</button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    let safe = dateStr;
    if (!safe.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safe)) safe += 'Z';
    const d = new Date(safe);
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' }).format(d);
  };

  const formatRelative = (dateStr: string) => {
    if (!dateStr) return '';
    let safe = dateStr;
    if (!safe.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safe)) safe += 'Z';
    const diff = Math.floor((Date.now() - new Date(safe).getTime()) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return formatDate(dateStr);
  };

  // 두 좌표 사이 거리 (m)
  const calcDistance = (lat1:number, lng1:number, lat2:number, lng2:number) => {
    const R = 6371e3;
    const r = Math.PI / 180;
    const dLat = (lat2 - lat1) * r;
    const dLng = (lng2 - lng1) * r;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const distanceText = (() => {
    if (!userLocation || !item) return null;
    const d = calcDistance(userLocation.lat, userLocation.lng, item.location.coordinates.lat, item.location.coordinates.lng);
    if (d < 1000) return `${Math.round(d)}m`;
    return `${(d/1000).toFixed(1)}km`;
  })();

  // 위치 텍스트 20자 제한 (영어일 때)
  const truncatedAddress = (() => {
    const addr = item?.location.address || '위치 확인 중...';
    if (/^[\x00-\x7F]*$/.test(addr) && addr.length > 20) return addr.slice(0, 20) + '…';
    return addr;
  })();

  return (
    <div className={`item-detail-page ${theme}`}>
      {/* ── 투명 헤더 (지도 위에 오버레이) ── */}
      <div className="detail-header detail-header--transparent">
        <button className="detail-icon-btn" onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft size={20} />
        </button>
        <div className="header-actions">
          <button className="detail-icon-btn" onClick={handleShare} aria-label="공유">
            <Share2 size={18} />
          </button>
          {isMyPost ? (
            <div className="menu-wrapper">
              <button className="detail-icon-btn" onClick={() => setIsMenuOpen(true)} aria-label="더보기">
                <MoreVertical size={18} />
              </button>
            </div>
          ) : (
            <button className="detail-icon-btn" onClick={handleReport} aria-label="신고">
              <Flag size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Action Sheet ── */}
      {isMenuOpen && (
        <div className="action-sheet-backdrop" onClick={() => setIsMenuOpen(false)} />
      )}
      <div className={`action-sheet-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="action-sheet-header">게시글 설정</div>
        <button className="action-sheet-btn destructive" onClick={handleDelete}>
          <Trash size={20} /> <span>삭제하기</span>
        </button>
        <div className="action-sheet-divider" />
        <button className="action-sheet-btn cancel" onClick={() => setIsMenuOpen(false)}>
          <span>취소</span>
        </button>
      </div>

      {/* ── 상단: Google Map (JS API) ── */}
      <div className="detail-map-top">
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        <div className="map-badge-row">
          <span className={`detail-type-badge detail-type-badge--${item.type}`}>
            · {item.type === 'lost' ? 'LOST' : 'FOUND'} ·
          </span>
        </div>
      </div>

      {/* ── 콘텐츠 카드 ── */}
      <div className="detail-content-card">
        <p className="detail-category">{item.category?.toUpperCase() || 'ITEM'}</p>
        <h1 className="detail-title">{item.title}</h1>

        <div className="detail-meta-row">
          <div className="detail-meta-left">
            <MapPin size={13} style={{ color: '#6FA886', flexShrink: 0 }} />
            <span className="detail-location-text">{truncatedAddress}</span>
            {distanceText && (
              <>
                <Navigation size={11} style={{ color: '#6FA886', flexShrink: 0, marginLeft: 4 }} />
                <span className="detail-distance">{distanceText}</span>
              </>
            )}
          </div>
          <div className="detail-meta-right">
            <span className="detail-time">{formatRelative(item.dateInfo.postedDate)}</span>
            <span className="detail-views-dot">·</span>
            <span className="detail-views">조회 {item.viewCount}</span>
          </div>
        </div>

        {item.reward.points > 0 && (
          <div className="detail-reward-card">
            <div className="detail-reward-icon">◆</div>
            <div className="detail-reward-body">
              <p className="detail-reward-title">찾아주시면 사례</p>
              <p className="detail-reward-desc">본인 확인 후 즉시 지급</p>
            </div>
            <span className="detail-reward-amount">{item.reward.points.toLocaleString()}P</span>
          </div>
        )}

        <div className="detail-desc-section">
          <p className="detail-desc-text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'break-word' }}>
            {item.description}
          </p>
        </div>

        <div className="detail-dates-row">
          <div className="detail-date-item">
            <Calendar size={13} style={{ color: '#6FA886' }} />
            <div>
              <p className="detail-date-label">{item.type === 'lost' ? '분실 날짜' : '습득 날짜'}</p>
              <p className="detail-date-value">{formatDate(item.dateInfo.lostDate)}</p>
            </div>
          </div>
          <div className="detail-dates-divider" />
          <div className="detail-date-item">
            <Calendar size={13} style={{ color: '#6FA886' }} />
            <div>
              <p className="detail-date-label">게시 날짜</p>
              <p className="detail-date-value">{formatDate(item.dateInfo.postedDate)}</p>
            </div>
          </div>
        </div>

        {postAuthor && (
          <div className="detail-author-card" onClick={() => postAuthor.id !== 'anonymous' && navigate(`/other-profile/${postAuthor.id}`)}>
            <div className="detail-author-avatar-wrap">
              <img src={postAuthor.profileImage} alt={postAuthor.nickname} className="detail-author-avatar" />
              {postAuthor.isOnline && <span className="detail-author-online" />}
            </div>
            <div className="detail-author-info">
              <p className="detail-author-name">
                {postAuthor.nickname}
                {isMyPost && <span style={{ fontSize: '0.8em', color: '#6FA886', marginLeft: 4 }}>(나)</span>}
              </p>
              <p className="detail-author-stats">
                신뢰도 {postAuthor.trustScore}%
                {postAuthor.successCount > 0 && ` · 회수 성공 ${postAuthor.successCount}회`}
              </p>
            </div>
            {postAuthor.id !== 'anonymous' && <ChevronRight size={18} style={{ color: '#CFC9BA', flexShrink: 0 }} />}
          </div>
        )}

        {/* ── 사진 슬라이드 (가로 스와이프) ── */}
        {item.images.length > 0 && (
          <div className="detail-gallery-section">
            <h2 className="detail-section-title">사진 ({item.images.length})</h2>
            <div className="detail-photo-slider">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  className="detail-photo-slide"
                  onClick={() => { setCurrentImageIndex(idx); setIsImageViewerOpen(true); }}
                >
                  <img src={img} alt={`${item.title} ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>





      {/* ── 하단 액션바 ── */}
      <div className="detail-bottom-bar">
        <button
          className={`detail-like-btn ${item.isLiked ? 'active' : ''}`}
          onClick={handleLike}
          aria-label="좋아요"
        >
          <Heart
            size={22}
            fill={item.isLiked ? '#ef4444' : 'none'}
            stroke={item.isLiked ? '#ef4444' : '#9AA89A'}
          />
        </button>

        {isMyPost ? (
          <button className="detail-chat-btn detail-chat-btn--mine">
            내가 쓴 글
          </button>
        ) : (
          <button className="detail-chat-btn" onClick={handleStartChat}>
            <MessageCircle size={20} />
            찾았다고 알리기
          </button>
        )}
      </div>

      {/* ── Apple Photos 스타일 이미지 뷰어 ── */}
      {isImageViewerOpen && (
        <div className="photos-viewer" onClick={() => setIsImageViewerOpen(false)}>
          {/* 상단바: 닫기 + 카운터 */}
          <div className="photos-viewer-topbar" onClick={(e) => e.stopPropagation()}>
            <button className="photos-viewer-close" onClick={() => setIsImageViewerOpen(false)}>
              <X size={22} />
            </button>
            <span className="photos-viewer-counter">{currentImageIndex + 1} / {item.images.length}</span>
            <div style={{ width: 36 }} />
          </div>

          {/* 메인 이미지 */}
          <div className="photos-viewer-main" onClick={(e) => e.stopPropagation()}>
            {item.images.length > 1 && (
              <button className="photos-viewer-arrow photos-viewer-arrow--left" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <ChevronLeft size={28} />
              </button>
            )}
            <img
              key={currentImageIndex}
              className="photos-viewer-img"
              src={item.images[currentImageIndex]}
              alt={item.title}
            />
            {item.images.length > 1 && (
              <button className="photos-viewer-arrow photos-viewer-arrow--right" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* 하단 썸네일 스트립 */}
          {item.images.length > 1 && (
            <div className="photos-viewer-thumbs" onClick={(e) => e.stopPropagation()}>
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`photos-thumb ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img src={img} alt={`${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;