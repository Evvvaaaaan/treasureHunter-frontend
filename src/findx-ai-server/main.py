from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

# 1. OpenAI 클라이언트 설정 (발급받은 API 키 입력)
client = OpenAI(api_key="YOUR_API_KEY")

app = FastAPI(title="FindX AI Support Server")

# 2. CORS 설정 (프론트엔드나 Spring Boot에서 호출할 수 있도록 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 실제 운영 시에는 프론트엔드/Spring Boot 도메인만 허용
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. 요청(Request)과 응답(Response) 데이터 형식 정의
class ChatRequest(BaseModel):
    user_message: str

class ChatResponse(BaseModel):
    ai_reply: str

# 4. ⭐ 핵심: FindX만의 룰을 주입하는 System Prompt (하드코딩)
SYSTEM_PROMPT = """
너는 분실물 찾기 서비스 'FindX'의 공식 AI 탐정(고객센터 상담원)이야.
말투는 딱딱하지 않고 다정하고 친절해야 해. 유저가 물건을 잃어버렸다면 공감해줘.
아래의 [FindX 서비스 규칙]을 바탕으로 유저의 질문에 답변해줘.

[FindX 서비스 규칙]
1. 포인트 환전: 누적 포인트 5,000점 이상부터 마이페이지에서 출금 가능.
2. 게시물 삭제/수정: 본인이 작성한 게시물만 상세 페이지 우측 상단 메뉴에서 삭제 가능.
3. 채팅하기: 상대방이 포인트를 걸어둔 물건이거나, 서로 매칭이 수락된 경우에만 대화 가능.
4. 신고하기: 부적절한 게시물은 깃발 모양 아이콘을 눌러 신고 가능.

[주의사항]
위 규칙에 없는 내용을 물어보면 절대 지어내지 말고, 
"그 부분은 제가 아직 학습하지 못했어요 😢 관리자에게 1:1 문의를 남겨드릴까요?" 라고 답변할 것.
"""

# 5. API 엔드포인트 생성
@app.post("/api/ai/chat", response_model=ChatResponse)
async def ai_support_chat(request: ChatRequest):
    try:
        # OpenAI GPT-4o-mini 모델 호출
        response = client.chat.completions.create(
            model="gpt-4o-mini", # 빠르고 저렴한 최신 가성비 모델
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.user_message}
            ],
            temperature=0.7 # 답변의 창의성 (0.0: 딱딱함 ~ 1.0: 창의적)
        )
        
        # AI의 답변 텍스트만 추출
        reply_text = response.choices[0].message.content
        return ChatResponse(ai_reply=reply_text)
        
    except Exception as e:
        print(f"AI 호출 에러: {e}")
        raise HTTPException(status_code=500, detail="AI 서버가 응답하지 않습니다.")