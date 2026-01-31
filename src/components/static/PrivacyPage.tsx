import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';
import '../../styles/static-pages.css';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ChevronLeft size={24} />
        </button>
        <h1>개인정보 처리방침</h1>
      </div>

      <div className="static-content">
        <div className="policy-section">
          <div className="policy-icon-wrapper">
            <Shield size={48} className="policy-main-icon" />
          </div>
          <p className="policy-intro">
            트레저 헌터(이하 '회사')는 이용자의 개인정보를 소중하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다.
          </p>

          <h3>1. 수집하는 개인정보의 항목 및 방법</h3>
          <ul className="terms-list">
            <li><strong>회원가입/본인확인:</strong> (필수) 휴대전화 번호, 성명, 생년월일, 성별, CI/DI</li>
            <li><strong>소셜 로그인:</strong> (필수) 제공업체(Google, Apple 등)의 식별값(ID), 이메일, 닉네임</li>
            <li><strong>서비스 이용:</strong> (필수) <strong>위치 정보(GPS)</strong>, (선택) 프로필 사진, 물품 사진 및 설명</li>
            <li><strong>정산/결제:</strong> (정산 시) 계좌번호, 예금주, (결제 시) 카드사 승인 정보</li>
          </ul>

          <h3>2. 개인정보의 처리 목적</h3>
          <p>회사는 수집한 정보를 다음의 목적을 위해 활용합니다.</p>
          <ul>
            <li>서비스 제공: 위치 기반 매칭, 퀘스트 알림, IoT 보관함 제어</li>
            <li>본인 확인 및 부정 이용 방지 (사기, 노쇼 예방)</li>
            <li>에스크로 기반 보상금 보관/지급 및 수수료 정산</li>
            <li>신규 서비스 개발 및 AI 학습 데이터 활용</li>
          </ul>

          <h3>3. 개인정보의 제3자 제공</h3>
          <p>회사는 원칙적으로 개인정보를 외부에 제공하지 않습니다. 단, 다음의 경우 예외로 합니다.</p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li><strong>수사 목적으로 법령에 정해진 절차에 따라 수사기관(경찰 등)의 요구가 있는 경우</strong></li>
            <li>IoT 보관함 이용 시 필요한 최소한의 정보</li>
          </ul>

          <h3>4. 개인정보의 처리위탁</h3>
          <p>회사는 서비스 향상을 위해 아래와 같이 업무를 위탁하고 있습니다.</p>
          <div className="table-container">
            <table className="policy-table">
              <thead>
                <tr>
                  <th>수탁 업체</th>
                  <th>위탁 업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AWS</td>
                  <td>서버 운영 및 데이터 보관</td>
                </tr>
                <tr>
                  <td>Firebase (Google)</td>
                  <td>푸시 알림(FCM) 및 앱 분석</td>
                </tr>
                <tr>
                  <td>Solapi</td>
                  <td>본인인증 및 알림톡/SMS 발송</td>
                </tr>
                <tr>
                  <td>PG사 (토스 등)</td>
                  <td>보상금 결제 및 에스크로 대행</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>5. 개인정보의 보유 및 이용 기간</h3>
          <p>목적 달성 후 즉시 파기하나, 관련 법령에 따라 아래 정보는 보관합니다.</p>
          <ul>
            <li>대금결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만/분쟁 처리 기록: 3년 (전자상거래법)</li>
            <li>위치정보 수집/이용 기록: 1년 (위치정보법)</li>
            <li>로그인 기록: 3개월 (통신비밀보호법)</li>
          </ul>

          <h3>6. 이용자의 권리</h3>
          <p>이용자는 언제든지 자신의 정보를 조회/수정하거나 회원 탈퇴를 통해 동의를 철회할 수 있습니다.</p>

          <h3>7. 개인정보 보호책임자</h3>
          <div className="contact-box">
            <p><strong>성명:</strong> 송준선</p>
            <p><strong>직책:</strong> 대표 / 개발총괄</p>
            <p><strong>이메일:</strong> vmfhrmfoald36@gmail.com</p>
            <p><strong>시행일자:</strong> 2026년 1월 30일</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;