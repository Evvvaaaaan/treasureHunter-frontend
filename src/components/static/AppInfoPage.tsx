import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import '../../styles/static-pages.css';

export default function AppInfoPage() {
  const navigate = useNavigate();
  const [currentVersion, setCurrentVersion] = useState("1.0.0");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isLatest, setIsLatest] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        let appVersion = "1.0.0";
        if (Capacitor.isNativePlatform()) {
          const info = await App.getInfo();
          appVersion = info.version;
          setCurrentVersion(appVersion);
        }

        const bundleId = 'com.junsun.treasurehunter';
        const response = await fetch(`https://itunes.apple.com/lookup?bundleId=${bundleId}`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const storeVersion = data.results[0].version;
          setLatestVersion(storeVersion);
          setIsLatest(storeVersion === appVersion);
        } else {
          setLatestVersion(appVersion);
          setIsLatest(true);
        }
      } catch (error) {
        console.error("Failed to fetch app version:", error);
        setLatestVersion(currentVersion);
        setIsLatest(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, []);

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
          <img src="https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=2d/77/2d771d4f0ddfaf94eb77702eb0d1efeba014e9f387b3fa677d216b086b606518.png" alt="logo" style={{ width: 96, height: 96 }} />
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
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#374151' }}>최신 버전</span>
            <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> :
                isLatest ? "최신 버전입니다" : `업데이트 가능 (${latestVersion})`}
            </span>
          </div>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          © 2026 Find X Team. All rights reserved.
        </p>
      </div>
    </div>
  );
}