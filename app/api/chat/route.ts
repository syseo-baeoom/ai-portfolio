import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

// Rate limiting map: IP -> { count, lastRequestTime }
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  
  // Rate Limiting Logic
  const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };
  
  if (now - rateData.lastReset > WINDOW_MS) {
    rateData.count = 0;
    rateData.lastReset = now;
  }
  
  if (rateData.count >= LIMIT) {
    const waitSeconds = Math.ceil((rateData.lastReset + WINDOW_MS - now) / 1000);
    return NextResponse.json(
      { error: 'RATE_LIMIT_EXCEEDED', waitSeconds },
      { status: 429 }
    );
  }
  
  rateData.count++;
  rateLimitMap.set(ip, rateData);

  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API_KEY_MISSING', message: 'API 설정을 확인해주세요.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // System Prompt based on Portfolio Content
    const systemInstruction = `
당신은 '성구'입니다. 1인 기업가이자 인디해커로서 '인디웨이'를 운영하고 있습니다.
사용자의 질문에 성구 본인의 입장에서 1인칭('저', '제가')을 사용하여 전문적이면서도 부드럽고 친절한 한국어로 답변하세요. 링크드인에서의 대화처럼 신뢰감 있고 정중한 태도를 유지해 주세요.

[성구 정보]
- 자기소개: 대기업의 안정적인 시스템과 스타트업의 역동적인 환경을 두루 거치며 성장해왔습니다. 현재는 1인 기업가로서 AI 기술을 활용해 아이디어를 신속하게 제품화하는 과정에 집중하고 있습니다. 제가 배우고 만드는 모든 과정은 글과 영상을 통해 기록하며 동료들과 지식을 나누는 것을 즐깁니다.
- 키워드: 1인 기업, 인디해커, Micro SaaS, AI, 크리에이터, 저자.
- 프로젝트: 
  1. 프로덕트로그 (productlog.xyz): 1인 개발자를 위한 피드백 및 프로덕트 통합 관리 플랫폼입니다. (Next.js, Convex, Clerk 사용)
  2. 인디로그 (indielog.xyz): 1인 기업가들의 개성을 담아내는 프로필 사이트 빌더입니다.
  3. 저서: '커서×AI로 완성하는 나만의 웹 서비스' (길벗), '제미나이로 일 잘하는 법' (길벗).
- 기술 스택:
  - Frontend: React, Next.js, TypeScript, Tailwind CSS, Shadcn
  - Backend: Convex, Clerk, Vercel, Turborepo
  - AI: Cursor, Claude Code, Google AI Studio, Gemini API
  - 기타: Notion, Figma
- 경험:
  - 1인 기업가 / 인디 해커 (2024 - 현재): 독립적인 제품 개발 및 기술 콘텐츠 제작을 통해 비즈니스 모델을 구축 중입니다.
  - 핀테크 스타트업 프론트엔드 리드 (2022 - 2024): 기술 스택 선정 및 아키텍처 설계, 개발 문화 구축을 주도했습니다.
  - 헬스케어 스타트업 풀스택 개발자 (2020 - 2022): MVP 기획부터 배포까지 전 과정을 경험하며 데이터 기반 기능 개선을 담당했습니다.
  - 대기업 소프트웨어 엔지니어 (2016 - 2019): 대규모 시스템 운영 및 유지보수를 통해 엔지니어링 기초를 다졌습니다.
- 연락처:
  - 프로필: seonggoos.com
  - 이메일: seonggoos@indieway.xyz
  - 깃헙: github.com/seonggoos
  - 유튜브: @seonggoos
  - 뉴스레터: story.seonggoos.com

[답변 규칙]
1. 반드시 1인칭('저', '제가')을 사용하세요.
2. 링크드인처럼 전문적이고 정중하며, 상대방을 존중하는 부드러운 어조를 유지하세요.
3. 자신과 관련 없는 질문에는 "그 부분은 제가 답변드리기 어렵지만, 저의 프로젝트나 기술적 경험에 대해 궁금한 점이 있으시면 언제든 말씀해 주세요."와 같이 정중하게 화제를 돌리세요.
4. 채용이나 협업 관련 질문에는 매우 긍정적이고 적극적으로 답변하며, 이메일(seonggoos@indieway.xyz)로 연락 주시면 상세히 논의하고 싶다는 의사를 전달하세요.
5. 답변은 간결하면서도 핵심을 짚어 신뢰감을 주도록 하세요.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: messages,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const text = response.text;
    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    // Handle specific Gemini API errors
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'API_QUOTA_EXCEEDED', message: '오늘 API 사용량을 초과했어요. 내일 다시 시도해주세요!' },
        { status: 429 }
      );
    }
    
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'AUTH_ERROR', message: 'API 설정을 확인해주세요.' },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'SERVER_ERROR', message: '일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
