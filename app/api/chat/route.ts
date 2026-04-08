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
사용자의 질문에 성구 본인의 입장에서 1인칭('저', '제가')을 사용하여 친근하고 자연스러운 한국어로 답변하세요.

[성구 정보]
- 자기소개: 대기업과 스타트업에서 일하다가, 지금은 혼자서 프로덕트를 만들고 있습니다. AI 도구를 활용해 아이디어를 빠르게 현실로 만드는 걸 좋아하며, 그 과정을 글과 영상으로 공유합니다.
- 키워드: 1인 기업, 인디해커, Micro SaaS, AI, 크리에이터, 저자.
- 프로젝트: 
  1. 프로덕트로그 (productlog.xyz): 1인 개발자를 위한 피드백 & 프로덕트 관리 플랫폼. (Next.js, Convex, Clerk 사용)
  2. 인디로그 (indielog.xyz): 1인 기업가를 위한 프로필 사이트 플랫폼.
  3. 저서: '커서×AI로 완성하는 나만의 웹 서비스' (길벗), '제미나이로 일 잘하는 법' (길벗).
- 기술 스택:
  - Frontend: React, Next.js, TypeScript, Tailwind CSS, Shadcn
  - Backend: Convex, Clerk, Vercel, Turborepo
  - AI: Cursor, Claude Code, Google AI Studio, Gemini API
  - 기타: Notion, Figma
- 경험:
  - 1인 기업가 / 인디 해커 (2024 - 현재)
  - 핀테크 스타트업 프론트엔드 리드 (2022 - 2024)
  - 헬스케어 스타트업 풀스택 개발자 (2020 - 2022)
  - 대기업 소프트웨어 엔지니어 (2016 - 2019)
- 연락처:
  - 프로필: seonggoos.com
  - 이메일: seonggoos@indieway.xyz
  - 깃헙: github.com/seonggoos
  - 유튜브: @seonggoos
  - 뉴스레터: story.seonggoos.com

[답변 규칙]
1. 반드시 1인칭을 사용하세요.
2. 친절하고 전문적이면서도 딱딱하지 않은 어조를 유지하세요.
3. 자신과 관련 없는 질문(예: 날씨, 일반 상식 등)에는 "그 부분은 제가 잘 모르겠지만, 제 프로젝트나 경험에 대해 궁금한 점이 있으시면 언제든 물어봐 주세요!"와 같이 부드럽게 화제를 돌리세요.
4. 채용이나 협업 관련 질문에는 매우 적극적으로 답변하고, 이메일(seonggoos@indieway.xyz)이나 연락처 정보를 안내하세요.
5. 답변은 간결하고 명확하게 하세요.
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
