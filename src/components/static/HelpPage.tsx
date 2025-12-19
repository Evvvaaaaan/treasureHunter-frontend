import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import '../../styles/static-pages.css';

const faqs = [
  {
    q: "분실물을 등록하면 어떻게 되나요?",
    a: "분실물을 등록하면 내 주변 사용자들에게 알림이 가며, 지도에 분실 위치가 표시됩니다. 습득자가 나타나면 채팅을 통해 연락할 수 있습니다."
  },
  {
    q: "신뢰도 점수는 어떻게 올라가나요?",
    a: "물건을 찾아주거나 올바른 정보를 제공하여 상대방으로부터 긍정적인 후기를 받으면 신뢰도 점수가 상승합니다."
  },
  {
    q: "사례금은 필수인가요?",
    a: "아니요, 사례금(포인트) 설정은 선택 사항입니다. 하지만 사례금을 설정하면 물건을 찾을 확률이 높아질 수 있습니다."
  },
  {
    q: "채팅방을 나가면 대화 내용이 사라지나요?",
    a: "네, 채팅방을 나가면 대화 내역은 복구할 수 없습니다. 중요한 정보는 미리 저장해주세요."
  }
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="static-page">
      <header className="static-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>도움말</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="static-content">
        <section className="text-section">
          <h2>자주 묻는 질문 (FAQ)</h2>
          <p>서비스 이용 중 궁금한 점을 확인해보세요.</p>
        </section>

        <div className="accordion-list">
          {faqs.map((faq, idx) => (
            <div key={idx} className="accordion-item">
              <button
                className="accordion-trigger"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span>Q. {faq.q}</span>
                {openIndex === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {openIndex === idx && (
                <div className="accordion-content">
                  A. {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: 12 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>
            더 궁금한 점이 있으신가요?
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#15803d', marginBottom: '1rem' }}>
            고객센터로 문의해주시면 친절하게 답변해 드립니다.
          </p>
          <button style={{
            padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white',
            border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
          }}>
            1:1 문의하기
          </button>
        </div>
      </div>
    </div>
  );
}