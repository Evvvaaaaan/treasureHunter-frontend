
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Users, Share2, Phone, ShieldCheck } from 'lucide-react';
import '../../styles/static-pages.css'; // 공통 스타일 임포트

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="static-page">
      <header className="static-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>개인정보 처리방침</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="static-content">
        <section className="text-section">
          <h2>Treasure Hunter는 이용자 개인정보보호를 위해 최선을 다하고 있습니다.</h2>
          <p>
            Treasure Hunter(이하 '회사')는 이용자의 개인정보를 중요시하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 개인정보보호법 등 국내의 개인정보 보호에 관한 법률을 준수하고 있습니다.
          </p>
        </section>

        <section className="labeling-section">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#10b981', marginBottom: '0.5rem' }}>
            주요 개인정보 처리 표시 (라벨링)
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            회사는 이용자의 권리를 적극적으로 보장하기 위해 주요 내용을 알기 쉽게 아이콘으로 안내합니다.
          </p>

          <div className="labeling-grid">
            <div className="label-card">
              <div className="label-icon-box">
                <User size={32} />
              </div>
              <span className="label-text">처리항목</span>
            </div>
            <div className="label-card">
              <div className="label-icon-box">
                <Users size={32} />
              </div>
              <span className="label-text">처리위탁</span>
            </div>
            <div className="label-card">
              <div className="label-icon-box">
                <Share2 size={32} />
              </div>
              <span className="label-text">제3자 제공</span>
            </div>
            <div className="label-card">
              <div className="label-icon-box">
                <Phone size={32} />
              </div>
              <span className="label-text">고충처리부서</span>
            </div>
            <div className="label-card">
              <div className="label-icon-box">
                <ShieldCheck size={32} />
              </div>
              <span className="label-text">안전성확보조치</span>
            </div>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <section className="text-section">
          <h3>1. 수집하는 개인정보 항목</h3>
          <ul className="info-list">
            <li>필수항목: 닉네임, 이메일, 가입경로, 프로필 사진</li>
            <li>선택항목: 위치 정보 (서비스 이용 시)</li>
          </ul>

          <h3>2. 개인정보의 처리 목적</h3>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
          <ul className="info-list">
            <li>회원 관리 및 본인 확인</li>
            <li>분실물/습득물 매칭 서비스 제공</li>
            <li>신규 서비스 개발 및 마케팅 활용</li>
          </ul>
        </section>
      </div>
    </div>
  );
}