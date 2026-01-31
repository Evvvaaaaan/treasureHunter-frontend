
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../../styles/static-pages.css';

export default function AppInfoPage() {
  const navigate = useNavigate();
  const currentVersion = "1.0.0";

  return (
    <div className="static-page">
      <header className="static-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>앱 정보</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="static-content" style={{ alignItems: 'center', textAlign: 'center', marginTop: '3rem' }}>
        <div style={{
          width: 96, height: 96, borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
        }}>
          <img src="https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=ec/5f/ec5fe8b344d50ca3fca6c2b812eaec35a7e9e403901112476743884d1053802a.png" alt="logo" style={{width : 96, height: 96}}/>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
          Find X
        </h2>
        <p style={{ fontSize: '1rem', color: '#6b7280' }}>
          잃어버린 물건을 찾는 가장 빠른 방법
        </p>

        <div style={{
          marginTop: '3rem', width: '100%', maxWidth: 400,
          backgroundColor: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ color: '#374151' }}>현재 버전</span>
            <span style={{ fontWeight: 600, color: '#10b981' }}>{currentVersion}</span>
          </div>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#374151' }}>최신 버전</span>
            <span style={{ color: '#6b7280' }}>최신 버전입니다</span>
          </div>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          © 2026 Find X Team. All rights reserved.
        </p>
      </div>
    </div>
  );
}