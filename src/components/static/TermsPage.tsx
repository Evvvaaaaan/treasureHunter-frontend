
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../../styles/static-pages.css';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="static-page">
      <header className="static-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>이용약관</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="static-content">
        <section className="text-section">
          <h2>제 1 조 (목적)</h2>
          <p>
            이 약관은 Find X(이하 "회사")가 제공하는 위치 기반 분실물 찾기 서비스의 이용조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2>제 2 조 (용어의 정의)</h2>
          <ul className="info-list">
            <li>"서비스"라 함은 회사가 제공하는 모바일 애플리케이션 및 관련 제반 서비스를 의미합니다.</li>
            <li>"이용자"라 함은 앱에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
          </ul>

          <h2>제 3 조 (약관의 효력 및 변경)</h2>
          <p>
            본 약관은 서비스를 이용하고자 하는 모든 회원에게 효력이 발생합니다. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 약관을 변경할 수 있습니다.
          </p>

          {/* 내용 생략 가능 */}
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '2rem' }}>
            본 약관은 2024년 12월 11일부터 시행됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}