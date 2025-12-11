import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../../styles/static-pages.css';

const licenses = [
  { name: "React", license: "MIT License" },
  { name: "Capacitor", license: "MIT License" },
  { name: "Lucide React", license: "ISC License" },
  { name: "Framer Motion", license: "MIT License" },
  { name: "React Router", license: "MIT License" },
  { name: "Tailwind CSS", license: "MIT License" },
  { name: "Zustand", license: "MIT License" }, // 예시
];

export default function LicensesPage() {
  const navigate = useNavigate();

  return (
    <div className="static-page">
      <header className="static-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>오픈소스 라이선스</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="static-content">
        <section className="text-section">
          <p>
            본 애플리케이션은 다음의 오픈소스 소프트웨어를 포함하고 있습니다.
          </p>
        </section>

        <div className="license-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {licenses.map((lib, idx) => (
            <div key={idx} style={{ 
              padding: '1rem', backgroundColor: 'white', borderRadius: 12, 
              border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>{lib.name}</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: 6 }}>
                {lib.license}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}