import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../utils/theme';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`settings-page ${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 헤더 부분 */}
      <div className="settings-header">
        <div className="header-container">
          <motion.button
            className="back-btn"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1>개인정보 처리방침</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* 본문 내용 (스크롤 영역) */}
      <div className="settings-content" style={{ padding: '20px', overflowY: 'auto', lineHeight: '1.6', fontSize: '14px', color: theme === 'dark' ? '#e5e7eb' : '#374151' }}>
        
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>개인정보처리방침</h2>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제1조 (목적)</h3>
          <p>FindX(이하 ‘회사’라고 함)는 회사가 제공하고자 하는 서비스(이하 ‘회사 서비스’)를 이용하는 개인(이하 ‘이용자’ 또는 ‘개인’)의 정보(이하 ‘개인정보’)를 보호하기 위해, 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 ‘정보통신망법’) 등 관련 법령을 준수하고, 서비스 이용자의 개인정보 보호 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침(이하 ‘본 방침’)을 수립합니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제2조 (개인정보 처리의 원칙)</h3>
          <p>개인정보 관련 법령 및 본 방침에 따라 회사는 이용자의 개인정보를 수집할 수 있으며 수집된 개인정보는 개인의 동의가 있는 경우에 한해 제3자에게 제공될 수 있습니다. 단, 법령의 규정 등에 의해 적법하게 강제되는 경우 회사는 수집한 이용자의 개인정보를 사전에 개인의 동의 없이 제3자에게 제공할 수도 있습니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제3조 (본 방침의 공개)</h3>
          <p>① 회사는 이용자가 언제든지 쉽게 본 방침을 확인할 수 있도록 회사 홈페이지 첫 화면 또는 첫 화면과의 연결화면을 통해 본 방침을 공개하고 있습니다.<br/>
          ② 회사는 제1항에 따라 본 방침을 공개하는 경우 글자 크기, 색상 등을 활용하여 이용자가 본 방침을 쉽게 확인할 수 있도록 합니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제4조 (본 방침의 변경)</h3>
          <p>① 본 방침은 개인정보 관련 법령, 지침, 고시 또는 정부나 회사 서비스의 정책이나 내용의 변경에 따라 개정될 수 있습니다.<br/>
          ② 회사는 제1항에 따라 본 방침을 개정하는 경우 다음 각 호 하나 이상의 방법으로 공지합니다.<br/>
          가. 회사가 운영하는 인터넷 홈페이지의 첫 화면의 공지사항란 또는 별도의 창을 통하여 공지하는 방법<br/>
          나. 서면·모사전송·전자우편 또는 이와 비슷한 방법으로 이용자에게 공지하는 방법<br/>
          ③ 회사는 제2항의 공지는 본 방침 개정의 시행일로부터 최소 7일 이전에 공지합니다. 다만, 이용자 권리의 중요한 변경이 있을 경우에는 최소 30일 전에 공지합니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제5조 (회원 가입을 위한 정보)</h3>
          <p>회사는 이용자의 회사 서비스에 대한 회원가입을 위하여 다음과 같은 정보를 수집합니다.<br/>
          <strong>- 필수 수집 정보: 이름 및 닉네임</strong></p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제6조 (본인 인증을 위한 정보)</h3>
          <p>회사는 이용자의 본인인증을 위하여 다음과 같은 정보를 수집합니다.<br/>
          <strong>- 필수 수집 정보: 휴대폰 번호</strong></p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제7조 (회사 서비스 제공을 위한 정보)</h3>
          <p>회사는 이용자에게 회사의 서비스를 제공하기 위하여 다음과 같은 정보를 수집합니다.<br/>
          <strong>- 필수 수집 정보: 이름 및 연락처</strong><br/>
          회사는 서비스 이용 과정이나 사업 처리 과정에서 다음과 같은 정보들이 자동으로 생성되어 수집될 수 있습니다.<br/>
          <strong>- 필수 수집 정보: 기기 식별자(디바이스 토큰, FCM 토큰), 단말기 정보(OS 버전, 모델명), 접속 IP 주소, 서비스 이용 기록(AI 채팅 내역), 불량 이용 기록</strong></p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제8조 (개인정보 수집 방법)</h3>
          <p>회사는 다음과 같은 방법으로 이용자의 개인정보를 수집합니다.<br/>
          - 이용자가 회사의 홈페이지에 자신의 개인정보를 입력하는 방식<br/>
          - 어플리케이션 등 회사가 제공하는 홈페이지 외의 서비스를 통해 이용자가 자신의 개인정보를 입력하는 방식<br/>
          - 이용자가 고객센터의 상담, 게시판에서의 활동 등 회사의 서비스를 이용하는 과정에서 이용자가 입력하는 방식</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제9조 (개인정보의 이용)</h3>
          <p>회사는 개인정보를 다음 각 호의 경우에 이용합니다.<br/>
          - 공지사항의 전달 등 회사운영에 필요한 경우<br/>
          - 이용문의에 대한 회신, 불만의 처리 등 이용자에 대한 서비스 개선을 위한 경우<br/>
          - 회사의 서비스를 제공하기 위한 경우<br/>
          - 법령 및 회사 약관을 위반하는 회원에 대한 이용 제한 조치, 부정 이용 행위를 포함하여 서비스의 원활한 운영에 지장을 주는 행위에 대한 방지 및 제재를 위한 경우<br/>
          - 신규 서비스 개발을 위한 경우</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제10조 (개인정보의 보유 및 이용기간)</h3>
          <p>① 회사는 이용자의 개인정보에 대해 개인정보의 수집·이용 목적 달성을 위한 기간 동안 개인정보를 보유 및 이용합니다.<br/>
          ② 전항에도 불구하고 회사는 내부 방침에 의해 서비스 부정이용기록은 부정 가입 및 이용 방지를 위하여 회원 탈퇴 시점으로부터 최대 1년간 보관합니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제11조 (법령에 따른 개인정보의 보유 및 이용기간)</h3>
          <p>회사는 관계법령에 따라 다음과 같이 개인정보를 보유 및 이용합니다.<br/>
          <strong>1. 전자상거래 등에서의 소비자보호에 관한 법률에 따른 보유정보 및 보유기간</strong><br/>
          가. 계약 또는 청약철회 등에 관한 기록 : 5년<br/>
          나. 대금결제 및 재화 등의 공급에 관한 기록 : 5년<br/>
          다. 소비자의 불만 또는 분쟁처리에 관한 기록 : 3년<br/>
          라. 표시·광고에 관한 기록 : 6개월<br/>
          <strong>2. 통신비밀보호법에 따른 보유정보 및 보유기간</strong><br/>
          가. 웹사이트 로그 기록 자료 : 3개월<br/>
          <strong>3. 전자금융거래법에 따른 보유정보 및 보유기간</strong><br/>
          가. 전자금융거래에 관한 기록 : 5년<br/>
          <strong>4. 위치정보의 보호 및 이용 등에 관한 법률</strong><br/>
          가. 개인위치정보에 관한 기록 : 6개월</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제12조 (개인정보의 파기원칙)</h3>
          <p>회사는 원칙적으로 이용자의 개인정보 처리 목적의 달성, 보유·이용기간의 경과 등 개인정보가 필요하지 않을 경우에는 해당 정보를 지체 없이 파기합니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제13조 (개인정보 파기절차)</h3>
          <p>① 이용자가 회원가입 등을 위해 입력한 정보는 개인정보 처리 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보 보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기 되어집니다.<br/>
          ② 회사는 파기 사유가 발생한 개인정보를 개인정보보호 책임자의 승인절차를 거쳐 파기합니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제14조 (개인정보 파기방법)</h3>
          <p>회사는 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이로 출력된 개인정보는 분쇄기로 분쇄하거나 소각 등을 통하여 파기합니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제15조 (광고성 정보의 전송 조치)</h3>
          <p>① 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 이용자의 명시적인 사전동의를 받습니다. 다만, 다음 각호 어느 하나에 해당하는 경우에는 사전 동의를 받지 않습니다.<br/>
          가. 회사가 재화 등의 거래관계를 통하여 수신자로부터 직접 연락처를 수집한 경우, 거래가 종료된 날로부터 6개월 이내에 회사가 처리하고 수신자와 거래한 것과 동종의 재화 등에 대한 영리목적의 광고성 정보를 전송하려는 경우<br/>
          나. 「방문판매 등에 관한 법률」 에 따른 전화권유판매자가 육성으로 수신자에게 개인정보의 수집출처를 고지하고 전화권유를 하는 경우<br/>
          ② 회사는 전항에도 불구하고 수신자가 수신거부의사를 표시하거나 사전 동의를 철회한 경우에는 영리목적의 광고성 정보를 전송하지 않으며 수신거부 및 수신동의 철회에 대한 처리 결과를 알립니다.<br/>
          ③ 회사는 오후 9시부터 그다음 날 오전 8시까지의 시간에 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우에는 제1항에도 불구하고 그 수신자로부터 별도의 사전 동의를 받습니다.<br/>
          ④ 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 다음의 사항 등을 광고성 정보에 구체적으로 밝힙니다.<br/>
          가. 회사명 및 연락처<br/>
          나. 수신 거부 또는 수신 동의의 철회 의사표시에 관한 사항의 표시</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제16조 (개인정보 조회 및 수집동의의 철회)</h3>
          <p>① 이용자 및 법정 대리인은 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 개인정보수집 동의 철회를 요청할 수 있습니다.<br/>
          ② 이용자 및 법정 대리인은 자신의 가입정보 수집 등에 대한 동의를 철회하기 위해서는 개인정보보호책임자 또는 담당자에게 서면, 전화 또는 전자우편주소로 연락하시면 회사는 지체 없이 조치하겠습니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제17조 (개인정보 정보변경 등)</h3>
          <p>① 이용자는 회사에게 전조의 방법을 통해 개인정보의 오류에 대한 정정을 요청할 수 있습니다.<br/>
          ② 회사는 전항의 경우에 개인정보의 정정을 완료하기 전까지 개인정보를 이용 또는 제공하지 않으며 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체 없이 통지하여 정정이 이루어지도록 하겠습니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제18조 (이용자의 의무)</h3>
          <p>① 이용자는 자신의 개인정보를 최신의 상태로 유지해야 하며, 이용자의 부정확한 정보 입력으로 발생하는 문제의 책임은 이용자 자신에게 있습니다.<br/>
          ② 타인의 개인정보를 도용한 회원가입의 경우 이용자 자격을 상실하거나 관련 개인정보보호 법령에 의해 처벌받을 수 있습니다.<br/>
          ③ 이용자는 전자우편주소, 비밀번호 등에 대한 보안을 유지할 책임이 있으며 제3자에게 이를 양도하거나 대여할 수 없습니다.<br/>
          ④ 이용자 및 법정 대리인은 언제든지 앱 내 [설정 {'>'} 계정 관리 {'>'} 계정 삭제] 메뉴를 통하여 직접 개인정보의 수집 및 이용 동의를 철회하고 회원 탈퇴를 진행할 수 있습니다. 탈퇴 시 이용자의 개인정보는 본 방침 제12조 및 제13조에 따라 지체 없이 파기됩니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제19조 ~ 제25조 (보안 및 유출 대책)</h3>
          <p>회사는 이용자의 개인정보를 안전하게 보호하기 위하여 내부 관리계획 수립, 암호화(비밀번호 일방향 암호화 등), 해킹 등에 대비한 보안 프로그램 설치, 처리 담당자 최소화 및 교육 등의 조치를 취하고 있습니다. 해지 또는 삭제된 정보는 지체 없이 파기하며, 유출 사고 발생 시 관련 법령에 따라 신속히 통지 및 신고 조치를 이행합니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제26조 (국외 이전 개인정보의 보호)</h3>
          <p>① 회사는 이용자의 개인정보에 관하여 개인정보보호법 등 관계 법규를 위반하는 사항을 내용으로 하는 국제계약을 체결하지 않습니다.<br/>
          ② 회사는 이용자의 개인정보를 국외에 제공·처리위탁·보관(이하 "이전")하려하면 이용자의 동의를 받습니다.<br/>
          ③ 회사는 본조 제2항 본문에 따른 동의를 받으려면 미리 다음 각 호의 사항 모두를 이용자에게 고지합니다.<br/>
          가. 이전되는 개인정보 항목<br/>
          나. 개인정보가 이전되는 국가, 이전일시 및 이전방법<br/>
          다. 개인정보를 이전받는 자의 성명(법인인 경우 그 명칭 및 정보관리 책임자의 연락처)<br/>
          라. 개인정보를 이전받는 자의 개인정보 이용목적 및 보유·이용 기간</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제27조 ~ 제28조 (자동 수집 장치의 설치 및 거부)</h3>
          <p>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 개인정보 자동 수집장치(이하 '쿠키')를 사용할 수 있으며, 이용자는 브라우저 옵션 설정을 통해 쿠키 설치를 거부할 권리가 있습니다.</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제29조 (회사의 개인정보 보호 책임자 지정)</h3>
          <p>회사는 이용자의 개인정보를 보호하고 관련 불만을 처리하기 위하여 아래와 같이 관련 부서 및 책임자를 지정하고 있습니다.<br/>
          <strong>[개인정보 보호 책임자]</strong><br/>
          - 성명: 송준선<br/>
          - 직책: IC<br/>
          - 전화번호: 010-3273-7543<br/>
          - 이메일: vmfhrmfoald36@gmail.com</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>제30조 (권익침해에 대한 구제방법)</h3>
          <p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 아래의 기관에 분쟁해결이나 상담을 신청할 수 있습니다.<br/>
          - 개인정보분쟁조정위원회 : (국번없이) 1833-6972 (www.kopico.go.kr)<br/>
          - 개인정보침해신고센터 : (국번없이) 118 (privacy.kisa.or.kr)<br/>
          - 대검찰청 : (국번없이) 1301 (www.spo.go.kr)<br/>
          - 경찰청 : (국번없이) 182 (ecrm.cyber.go.kr)<br/>
          - 중앙행정심판위원회 : (국번없이) 110 (www.simpan.go.kr)</p>
        </div>

        <div className="policy-section" style={{ marginBottom: '40px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>부칙</h3>
          <p>제1조 본 방침은 2026.03.15. 부터 시행됩니다.</p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;