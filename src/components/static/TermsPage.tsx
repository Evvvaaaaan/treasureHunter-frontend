import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, AlertTriangle } from 'lucide-react';
import '../../styles/static-pages.css';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ChevronLeft size={24} />
        </button>
        <h1>서비스 이용약관</h1>
      </div>

      <div className="static-content">
        <div className="policy-section">
          <div className="policy-icon-wrapper">
            <FileText size={48} className="policy-main-icon" />
          </div>
          
          <div className="intro-box">
             본 약관은 <strong>FindX</strong> 서비스의 권리, 의무 및 책임사항을 규정합니다.
          </div>

          <h3>제1조 (목적)</h3>
          <p>본 약관은 'FindX'(이하 "회사")가 운영하는 위치 기반 분실물 매칭 플랫폼 및 관련 제반 서비스(이하 "서비스")를 이용함에 있어, "회사"와 "이용자" 간의 권리, 의무 및 책임 사항, 서비스 이용 절차 등에 관한 제반 사항을 규정함을 목적으로 합니다.</p>

          <h3>제2조 (용어의 정의)</h3>
          <ul className="terms-list">
            <li><strong>1. 트레저 헌터:</strong> 유실물 습득 및 반환 과정을 게임의 '퀘스트' 형태로 재정의하여 운영하는 위치 기반 플랫폼을 말합니다.</li>
            <li><strong>2. 헌터 (습득자):</strong> 타인의 분실물을 습득하여 플랫폼에 등록하거나, 분실자의 의뢰를 수락하여 물건을 찾아 반환하는 이용자를 말합니다.</li>
            <li><strong>3. 분실자 (의뢰인):</strong> 물건을 분실하여 플랫폼에 '퀘스트(분실물 찾기 의뢰)'를 생성하는 이용자를 말합니다.</li>
          </ul>

          <h3>제3조 (서비스의 제공 및 가입)</h3>
          <p>
            1. "이용자"는 본인 명의의 휴대전화 번호를 이용한 인증 및 소셜 로그인 등을 완료해야 서비스를 이용할 수 있습니다.<br/>
            2. "회사"는 1차 서비스(MVP) 단계에서 위치 기반(LBS) 매칭, 안심 채팅, AI 이미지 분석 등의 핵심 서비스를 우선 제공합니다.
          </p>

          <h3>제4조 (이용자의 의무 및 금지사항)</h3>
          <ul className="terms-list">
            <li>1. 허위 정보 입력, 타인의 물건을 도용한 퀘스트 생성은 엄격히 금지됩니다.</li>
            <li>2. 앱 내 안심 채팅이 아닌 외부 채널(카카오톡, 개인 전화번호 등)로 개인정보를 무단 공유하여 발생하는 문제에 대해 회사는 책임지지 않습니다.</li>
            <li>3. 약속 없는 일방적인 연락 두절(노쇼), 물건 반환 거부 등의 행위 적발 시 이용이 제한될 수 있습니다.</li>
          </ul>

          <h3>제5조 (인공지능(AI) 서비스의 특성 및 면책)</h3>
          <ul className="terms-list">
            <li>1. "회사"는 분실물 매칭의 편의를 돕기 위해 외부 API를 활용한 AI 이미지 분석 기능을 제공합니다.</li>
            <li>2. <strong>정확성 보증 불가:</strong> AI 기술의 특성상 분석 결과가 100% 정확하지 않을 수 있으며, 오인식 등의 오류가 발생할 수 있습니다. "회사"는 AI 분석 결과의 완전성을 보증하지 않습니다.</li>
            <li>3. 이용자는 AI 분석 결과를 단순 매칭 보조 수단으로만 활용해야 하며, 최종적인 물건의 소유권 확인 및 반환 진행에 대한 책임은 이용자 본인에게 있습니다.</li>
          </ul>

          <h3>제6조 (오프라인 거래 안전 및 책임 제한)</h3>
          <div className="highlight-box red">
            <AlertTriangle size={16} style={{marginRight: '5px', display:'inline', verticalAlign: 'middle'}}/>
            <strong>주의:</strong> 분실물 반환 시 반드시 CCTV가 있는 밝고 안전한 <strong>공공장소</strong>에서 만나시길 권장합니다.
          </div>
          <ul className="terms-list">
            <li>1. "회사"는 이용자 간의 매칭을 돕는 통신판매중개자로서, 실제 물건의 소유권 확인이나 거래 당사자가 아닙니다.</li>
            <li>2. 이용자 간 대면 반환 과정(오프라인)에서 발생하는 금전적 요구, 분쟁, 범죄 피해 등에 대해 "회사"는 고의 또는 중과실이 없는 한 법적 책임을 지지 않습니다.</li>
            <li>3. 분실물에 대한 법정 보상금 등 금전적 협의는 당사자 간의 합의와 관련 법령(유실물법 등)에 따릅니다.</li>
          </ul>

          <h3>제7조 (서비스 이용 제한 및 계약 해지)</h3>
          <ul className="terms-list">
            <li>1. 범죄 연루, 명백한 사기 또는 타인에게 피해를 주는 비정상적인 이용이 확인된 경우 즉시 계정이 영구 정지되며 재가입이 제한됩니다.</li>
            <li>2. <strong>회원 탈퇴:</strong> 이용자는 언제든지 앱 내 <strong>[설정 {'>'} 계정 관리 {'>'} 계정 삭제]</strong> 메뉴를 통해 서비스 이용계약을 해지하고 탈퇴할 수 있습니다. 탈퇴 시 관련 법령에 따라 보존해야 하는 정보를 제외한 모든 데이터는 지체 없이 파기됩니다.</li>
          </ul>

          <div className="contact-box">
            <p><strong>시행일자:</strong> 2026년 3월 15일</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;