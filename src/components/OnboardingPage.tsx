import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Shield } from 'lucide-react';
import { getUserInfo } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/onboarding-page.css';

interface OnboardingSlide {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const userInfo = getUserInfo();

  const slides: OnboardingSlide[] = [
    {
      id: 1,
      icon: <Search size={32} />,
      title: '분실물을 쉽게 등록하고\n검색하세요',
      description: '물건을 잃어버리셨나요? 간단하게 등록하고,\n다른 사람들이 발견한 물건을 검색해보세요.',
      image: 'https://images.unsplash.com/photo-1663081026394-ad655698d2bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZm91bmQlMjBpdGVtcyUyMHNlYXJjaHxlbnwxfHx8fDE3NjUwMjE2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 2,
      icon: <MapPin size={32} />,
      title: '지도로 주변 분실물을\n한눈에 확인',
      description: '실시간 지도에서 내 주변의 분실물과\n습득물 위치를 확인하고 빠르게 찾아보세요.',
      image: 'https://images.unsplash.com/photo-1754299356969-2b7d4ffefd9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXAlMjBsb2NhdGlvbiUyMHBpbnxlbnwxfHx8fDE3NjQ5MTU3MjF8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 3,
      icon: <Shield size={32} />,
      title: '신뢰도 시스템으로\n안전한 거래',
      description: '평점과 후기로 신뢰할 수 있는 사용자를 확인하고,\n포인트를 모아 더 많은 혜택을 받으세요.',
      image: 'https://images.unsplash.com/photo-1564069970419-0bc8e7b487da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cnVzdCUyMGhhbmRzaGFrZSUyMGNvbW11bml0eXxlbnwxfHx8fDE3NjUwMjE2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    if (userInfo) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    if (userInfo) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="onboarding-page">
      {/* Skip Button */}
      <button className="skip-button" onClick={handleSkip}>
        건너뛰기
      </button>

      {/* Slides Container */}
      <div className="slides-container">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                handleNext();
              } else if (swipe > swipeConfidenceThreshold) {
                handlePrevious();
              }
            }}
            className="slide"
          >
            <div className="slide-image-container">
              <ImageWithFallback
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="slide-image"
              />
              <div className="image-overlay" />
            </div>

            <div className="slide-content">
              <div className="slide-icon">
                {slides[currentSlide].icon}
              </div>
              <h1 className="slide-title">
                {slides[currentSlide].title.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < slides[currentSlide].title.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h1>
              <p className="slide-description">
                {slides[currentSlide].description.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < slides[currentSlide].description.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="bottom-controls">
        {/* Page Indicators */}
        <div className="page-indicators">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={`indicator-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        {currentSlide === slides.length - 1 && (
          <button className="start-button" onClick={handleGetStarted}>
            시작하기
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;