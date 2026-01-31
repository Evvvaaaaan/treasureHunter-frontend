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
             본 약관은 <strong>트레저 헌터(FindX)</strong> 서비스의 권리, 의무 및 책임사항을 규정합니다.
          </div>

          <h3>제1조 (목적)</h3>
          <p>본 약관은 '트레저 헌터'(이하 "회사")가 운영하는 위치 기반 분실물 매칭 플랫폼 및 관련 제반 서비스(이하 "서비스")를 이용함에 있어, "회사"와 "이용자" 간의 권리, 의무 및 책임 사항, 서비스 이용 절차, 보상금 지급 및 환불 등에 관한 제반 사항을 규정함을 목적으로 합니다.</p>

          <h3>제2조 (용어의 정의)</h3>
          <ul className="terms-list">
            <li><strong>1. 트레저 헌터:</strong> 유실물 습득 및 반환 과정을 게임의 '퀘스트' 형태로 재정의하여 운영하는 위치 기반 플랫폼을 말합니다.</li>
            <li><strong>2. 헌터 (습득자):</strong> 타인의 분실물을 습득하여 플랫폼에 등록하거나, 분실자의 의뢰를 수락하여 물건을 찾아 반환하고 보상을 받는 이용자를 말합니다.</li>
            <li><strong>3. 분실자 (의뢰인):</strong> 물건을 분실하여 플랫폼에 '퀘스트(분실물 찾기 의뢰)'를 생성하고 보상금을 예치하는 이용자를 말합니다.</li>
            <li><strong>4. 에스크로 기반 보상 시스템:</strong> 거래 안전을 위해 “분실자”가 보상금을 선결제하여 예치하고, 물건 반환 완료가 확인되었을 때 수수료를 공제한 금액을 “헌터”에게 지급하는 결제대금 예치 서비스를 말합니다.</li>
            <li><strong>5. IoT 스마트 보관함:</strong> 비대면으로 물건을 안전하게 주고받을 수 있도록 지정된 물리적 거점(대학가, 공공시설 등)에 설치된 보관함을 말합니다.</li>
          </ul>

          <h3>제3조 (서비스의 제공 및 가입)</h3>
          <p>
            1. "이용자"는 본인 명의의 휴대전화 번호를 이용한 SMS 본인인증 및 소셜 로그인(Google, Apple 등)을 완료해야 서비스를 이용할 수 있습니다.<br/>
            2. "회사"는 위치 기반(LBS) 매칭, 안심 채팅, 에스크로 보상 시스템, AI 이미지 분석, IoT 보관함 연동 서비스를 제공합니다.
          </p>

          <h3>제4조 (보상금 예치 및 수수료)</h3>
          <div className="highlight-box red">
            <AlertTriangle size={16} style={{marginRight: '5px', display:'inline'}}/>
            <strong>중요:</strong> 모든 보상금 거래는 안전을 위해 "회사"의 <strong>에스크로 시스템</strong>을 통해서만 이루어져야 합니다.
          </div>
          <ul className="terms-list">
            <li>1. "회사"는 시스템을 통하지 않은 개인 간 직거래(현금, 타 송금 앱)에서 발생한 피해에 대해 책임지지 않습니다.</li>
            <li>2. 물건 반환이 완료되면 "회사"는 예치된 보상금에서 <strong>중개 수수료(3% ~ 10%) 및 PG사 수수료</strong>를 공제한 금액을 "헌터"에게 지급합니다.</li>
            <li>3. 분쟁 발생 시 "회사"는 채팅 기록, 위치 정보, IoT 보관함 기록 등을 근거로 중재할 수 있습니다.</li>
          </ul>

          <h3>제5조 (IoT 스마트 보관함 이용)</h3>
          <p>
            1. "헌터"는 보관함 입고 시 물건의 상태(파손 여부 등)를 식별할 수 있는 사진을 반드시 앱에 등록해야 합니다.<br/>
            2. 입고 시점의 사진과 출고 시점의 물건 상태가 상이하여 발생하는 분쟁에 대해서는, <strong>입고 시 등록된 사진 데이터</strong>가 책임 소재를 판단하는 주요 근거가 됩니다.
          </p>

          <h3>제6조 (이용자의 의무 및 금지사항)</h3>
          <ul className="terms-list">
            <li>1. 허위 정보 입력, 타인의 물건을 도용한 퀘스트 생성은 금지됩니다.</li>
            <li>2. <strong>직거래 유도 금지:</strong> 에스크로를 회피할 목적으로 외부 채널(카톡, 전화번호)로 유도하는 행위는 엄격히 금지됩니다.</li>
            <li>3. 노쇼, 물건 반환 거부 후 금전 추가 요구 등의 행위 적발 시 계정이 영구 정지될 수 있습니다.</li>
          </ul>

          <h3>제7조 (책임 제한 및 면책)</h3>
          <ul className="terms-list">
            <li>1. "회사"는 통신판매중개자로서 시스템을 운영할 뿐이며, 거래의 당사자가 아닙니다.</li>
            <li>2. <strong>오프라인 안전:</strong> 대면 거래 시 발생하는 이용자의 피해(범죄 등)에 대해 "회사"는 고의 또는 중과실이 없는 한 책임을 지지 않습니다. 가급적 IoT 스마트 보관함이나 공공장소를 이용하시기 바랍니다.</li>
          </ul>

          <h3>제8조 (서비스 이용 제한)</h3>
          <p>범죄 연루, 명백한 사기 행위(에스크로 악용 등)가 확인된 경우 즉시 영구 정지되며 재가입이 제한됩니다.</p>

          <div className="contact-box">
            <p><strong>공고일자:</strong> 2026년 1월 30일</p>
            <p><strong>시행일자:</strong> 2026년 1월 30일</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;