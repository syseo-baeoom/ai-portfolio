'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Briefcase, 
  Code2, 
  History, 
  Mail, 
  MessageCircle, 
  ArrowRight,
  ExternalLink,
  Github,
  Youtube,
  Globe,
  Newspaper,
  AlertCircle
} from 'lucide-react';
import CursorTrail from '@/components/CursorTrail';

type Tab = 'home' | 'intro' | 'projects' | 'skills' | 'experience' | 'contact' | 'chat';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

const TABS = [
  { id: 'intro', label: '소개', icon: User },
  { id: 'projects', label: '프로젝트', icon: Briefcase },
  { id: 'skills', label: '기술', icon: Code2 },
  { id: 'experience', label: '경험', icon: History },
  { id: 'contact', label: '연락처', icon: Mail },
  { id: 'chat', label: '챗', icon: MessageCircle },
] as const;

export default function PortfolioApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeTab]);

  // Rate limit countdown
  useEffect(() => {
    if (rateLimitSeconds > 0) {
      const timer = setInterval(() => {
        setRateLimitSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimitSeconds]);

  const goHome = () => setActiveTab('home');

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isLoading || rateLimitSeconds > 0) return;

    const userMessage: Message = { role: 'user', parts: [{ text: chatInput }] };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setChatInput('');
    setIsLoading(true);
    setErrorMessage(null);

    // Switch to chat tab if not already there
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'RATE_LIMIT_EXCEEDED') {
          setRateLimitSeconds(data.waitSeconds);
          setErrorMessage(`잠시 후 다시 물어봐주세요! (${data.waitSeconds}초)`);
        } else {
          setErrorMessage(data.message || '문제가 발생했습니다.');
        }
        return;
      }

      setMessages([...newMessages, { role: 'model', parts: [{ text: data.text }] }]);
    } catch (error) {
      setErrorMessage('일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white text-neutral-900 font-sans selection:bg-[#0071E3]/20 selection:text-[#0071E3]">
      {/* Background Cursor Trail - Only on Home */}
      {activeTab === 'home' && <CursorTrail />}

      {/* Header - Hidden on Home */}
      <AnimatePresence>
        {activeTab !== 'home' && (
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-center px-4 bg-white/80 backdrop-blur-md"
          >
            <button 
              onClick={goHome}
              className="group relative h-10 w-10 overflow-hidden rounded-full border border-neutral-200 transition-transform active:scale-95"
            >
              <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-[#0071E3] font-bold">
                성구
              </div>
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`relative flex h-full w-full flex-col items-center ${activeTab === 'home' ? 'justify-center' : 'pt-16 pb-32'}`}>
        <div className="w-full max-w-[640px] px-6 h-full overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {activeTab === 'home' && <HomeView />}
              {activeTab === 'intro' && <IntroView />}
              {activeTab === 'projects' && <ProjectsView />}
              {activeTab === 'skills' && <SkillsView />}
              {activeTab === 'experience' && <ExperienceView />}
              {activeTab === 'contact' && <ContactView />}
              {activeTab === 'chat' && (
                <ChatView 
                  messages={messages} 
                  isLoading={isLoading} 
                  chatEndRef={chatEndRef}
                  errorMessage={errorMessage}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Area: Chat Input + Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center gap-4 pb-8 px-4 pointer-events-none">
        {/* Chat Input - Only on Home and Chat */}
        <AnimatePresence>
          {(activeTab === 'home' || activeTab === 'chat') && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-lg pointer-events-auto"
            >
              <form 
                onSubmit={handleSendMessage}
                className={`relative flex items-center rounded-full border bg-white/60 p-1.5 pl-5 backdrop-blur-xl shadow-sm transition-all focus-within:border-[#0071E3] focus-within:ring-1 focus-within:ring-[#0071E3]/20 ${
                  rateLimitSeconds > 0 ? 'border-red-200 bg-red-50/30' : 'border-neutral-200'
                }`}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isLoading || rateLimitSeconds > 0}
                  placeholder={rateLimitSeconds > 0 ? `잠시 후 다시 물어봐주세요! (${rateLimitSeconds}초)` : "성구에게 물어보세요..."}
                  className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-neutral-400 disabled:placeholder:text-red-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isLoading || rateLimitSeconds > 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0071E3] text-white transition-all hover:bg-[#0071E3]/90 active:scale-90 disabled:opacity-50 disabled:grayscale"
                >
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="flex items-center gap-1 rounded-full bg-white/70 p-1.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-neutral-100 pointer-events-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-300 active:scale-95 ${
                  isActive 
                    ? 'bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20' 
                    : 'text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`hidden md:block text-xs font-medium ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function HomeView() {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-8 h-32 w-32 md:h-40 md:w-40 overflow-hidden rounded-full border-4 border-white shadow-2xl"
      >
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#0071E3] text-4xl md:text-5xl font-bold">
          성구
        </div>
      </motion.div>
      <motion.h1 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-900"
      >
        성구
      </motion.h1>
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-3 text-xl md:text-2xl text-[#0071E3] font-semibold tracking-tight"
      >
        인디웨이
      </motion.p>
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-neutral-500 font-medium text-lg"
      >
        나만의 길을 만들어가는 1인 기업가
      </motion.p>
    </div>
  );
}

function IntroView() {
  const keywords = ['1인 기업', '인디해커', 'Micro SaaS', 'AI', '크리에이터', '저자'];

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold mb-10 tracking-tight">소개</h2>
      <div className="space-y-8">
        <div className="p-8 rounded-[2rem] liquid-glass leading-relaxed text-neutral-700 text-lg">
          안녕하세요. 대기업의 안정적인 시스템과 스타트업의 역동적인 환경을 두루 거치며 성장해온 성구입니다. <br /><br />
          현재는 1인 기업가로서 AI 기술을 활용해 아이디어를 신속하게 제품화하는 과정에 집중하고 있습니다. 
          제가 배우고 만드는 모든 과정은 글과 영상을 통해 기록하며 동료들과 지식을 나누는 것을 즐깁니다.
        </div>
        
        <div className="flex flex-wrap gap-3">
          {keywords.map((kw, i) => (
            <span key={i} className="px-5 py-2.5 liquid-glass rounded-2xl text-sm font-medium text-neutral-600">
              # {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsView() {
  const projects = [
    { 
      type: 'Micro SaaS', 
      title: '프로덕트로그', 
      desc: '1인 개발자를 위한 피드백 및 프로덕트 통합 관리 플랫폼입니다.', 
      tech: 'Next.js, Convex, Clerk, Shadcn, Tailwind CSS',
      link: 'https://productlog.xyz'
    },
    { 
      type: 'Micro SaaS', 
      title: '인디로그', 
      desc: '1인 기업가들의 개성을 담아내는 프로필 사이트 빌더입니다.', 
      tech: 'Next.js, Convex, Clerk, Shadcn, Tailwind CSS',
      link: 'https://indielog.xyz'
    },
    { 
      type: 'Technical Book', 
      title: '커서×AI로 완성하는 나만의 웹 서비스', 
      desc: 'AI 코딩 도구 Cursor를 활용한 실전 웹 서비스 개발 가이드북입니다.', 
      tech: '길벗 출판사',
      link: 'https://product.kyobobook.co.kr/detail/S000218729929'
    },
    { 
      type: 'AI Guide', 
      title: '제미나이로 일 잘하는 법', 
      desc: '구글의 차세대 AI 제미나이를 업무에 효율적으로 활용하는 방법을 담았습니다.', 
      tech: '길벗 출판사',
      link: 'https://product.kyobobook.co.kr/detail/S000219506535'
    },
  ];

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold mb-10 tracking-tight">프로젝트</h2>
      <div className="grid gap-8">
        {projects.map((p, i) => (
          <motion.a 
            key={i}
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group block rounded-[2rem] liquid-glass p-8 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="px-4 py-1.5 bg-[#0071E3]/10 text-[#0071E3] rounded-full text-[11px] font-bold uppercase tracking-wider">
                {p.type}
              </span>
              <ExternalLink size={18} className="text-neutral-300 group-hover:text-[#0071E3] transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-[#0071E3] transition-colors">{p.title}</h3>
            <p className="text-neutral-600 text-base leading-relaxed mb-6">{p.desc}</p>
            <p className="text-neutral-400 text-xs font-medium tracking-wide">{p.tech}</p>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

function SkillsView() {
  const skills = [
    { 
      category: 'Frontend', 
      items: [
        { name: 'React', slug: 'react' },
        { name: 'Next.js', slug: 'nextdotjs' },
        { name: 'TypeScript', slug: 'typescript' },
        { name: 'Tailwind CSS', slug: 'tailwindcss' },
        { name: 'Shadcn', slug: 'shadcnui' }
      ] 
    },
    { 
      category: 'Backend & Infra', 
      items: [
        { name: 'Convex', slug: 'convex' },
        { name: 'Clerk', slug: 'clerk' },
        { name: 'Vercel', slug: 'vercel' },
        { name: 'Turborepo', slug: 'turborepo' }
      ] 
    },
    { 
      category: 'AI Tools', 
      items: [
        { name: 'Cursor', slug: 'cursor' },
        { name: 'Claude Code', slug: 'anthropic' },
        { name: 'Google AI Studio', slug: 'google' },
        { name: 'Gemini API', slug: 'googlegemini' }
      ] 
    },
    { 
      category: 'Planning & Design', 
      items: [
        { name: 'Notion', slug: 'notion' },
        { name: 'Figma', slug: 'figma' }
      ] 
    },
  ];

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold mb-10 tracking-tight">기술 스택</h2>
      <div className="space-y-12">
        {skills.map((s, i) => (
          <div key={i}>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <span className="h-px w-6 bg-neutral-200" />
              {s.category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {s.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 liquid-glass rounded-2xl hover:scale-[1.05] transition-transform cursor-default">
                  <img 
                    src={`https://cdn.simpleicons.org/${item.slug}`} 
                    alt={item.name} 
                    className="w-6 h-6 grayscale opacity-70"
                  />
                  <span className="text-sm font-semibold text-neutral-700">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceView() {
  const exps = [
    { 
      title: '1인 기업가 / 인디 해커', 
      period: '2024 - 현재', 
      desc: '독립적인 제품 개발 및 기술 콘텐츠 제작을 통해 지속 가능한 비즈니스 모델을 구축하고 있습니다. AI 코딩 도구 활용법에 관한 전문 서적을 집필하였으며, 다수의 Micro SaaS 프로덕트를 운영 중입니다.' 
    },
    { 
      title: '핀테크 스타트업', 
      period: '2022 - 2024', 
      desc: '프론트엔드 리드로서 기술 스택 선정부터 아키텍처 설계, 팀의 생산성 향상을 위한 개발 문화 구축을 주도했습니다. 사용자 경험 중심의 인터페이스 구현과 성능 최적화에 기여했습니다.' 
    },
    { 
      title: '헬스케어 스타트업', 
      period: '2020 - 2022', 
      desc: '초기 스타트업의 풀스택 개발자로서 제품의 MVP 기획부터 배포까지 전 과정을 경험했습니다. 데이터 기반의 기능 개선과 안정적인 서버 인프라 구축을 담당했습니다.' 
    },
    { 
      title: '대기업', 
      period: '2016 - 2019', 
      desc: '대규모 시스템의 안정적인 운영과 유지보수를 담당하며 엔지니어링의 기초를 다졌습니다. 복잡한 비즈니스 로직을 효율적으로 처리하는 코드 작성과 협업의 가치를 배웠습니다.' 
    },
  ];

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold mb-12 tracking-tight">경험</h2>
      <div className="relative space-y-16 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-100">
        {exps.map((e, i) => (
          <div key={i} className="relative pl-12">
            <div className="absolute left-0 top-1.5 h-[32px] w-[32px] rounded-full bg-white border-4 border-neutral-50 flex items-center justify-center z-10 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-[#0071E3]" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#0071E3] tracking-widest uppercase">{e.period}</span>
              <h3 className="text-xl font-bold text-neutral-900">{e.title}</h3>
              <p className="text-neutral-600 text-base leading-relaxed mt-2">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactView() {
  const contacts = [
    { label: '프로필', value: 'seonggoos.com', link: 'https://seonggoos.com', icon: Globe },
    { label: '이메일', value: 'seonggoos@indieway.xyz', link: 'mailto:seonggoos@indieway.xyz', icon: Mail },
    { label: '깃헙', value: 'github.com/seonggoos', link: 'https://github.com/seonggoos', icon: Github },
    { label: '유튜브', value: '@seonggoos', link: 'https://youtube.com/@seonggoos', icon: Youtube },
    { label: '뉴스레터', value: 'story.seonggoos.com', link: 'https://story.seonggoos.com', icon: Newspaper },
  ];

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold mb-10 tracking-tight">연락처</h2>
      <div className="grid gap-6">
        {contacts.map((c, i) => {
          const Icon = c.icon;
          return (
            <a 
              key={i}
              href={c.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-6 p-6 rounded-[2rem] liquid-glass transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              <div className="h-14 w-14 rounded-2xl bg-white/50 border border-white/40 flex items-center justify-center text-neutral-400 group-hover:text-[#0071E3] group-hover:scale-110 transition-all">
                <Icon size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1">{c.label}</span>
                <span className="text-neutral-800 font-bold text-lg group-hover:text-[#0071E3] transition-colors">{c.value}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ChatView({ 
  messages, 
  isLoading, 
  chatEndRef,
  errorMessage 
}: { 
  messages: Message[]; 
  isLoading: boolean; 
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  errorMessage: string | null;
}) {
  return (
    <div className="flex flex-col h-full py-12">
      <h2 className="text-3xl font-bold mb-10 tracking-tight">성구 AI와 대화하기</h2>
      
      <div className="flex-1 space-y-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-[2rem] liquid-glass flex items-center justify-center text-[#0071E3] mb-6">
              <MessageCircle size={40} />
            </div>
            <p className="text-neutral-500 text-base font-medium">
              성구의 프로젝트, 경험, 기술에 대해 <br /> 무엇이든 편하게 물어보세요.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
          >
            {msg.role === 'model' && (
              <div className="h-10 w-10 rounded-full liquid-glass flex items-center justify-center text-[#0071E3] text-[11px] font-bold shrink-0 mb-1">
                성구
              </div>
            )}
            <div 
              className={`max-w-[85%] px-5 py-3.5 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#0071E3] text-white rounded-br-none' 
                  : 'liquid-glass text-neutral-800 rounded-bl-none'
              }`}
            >
              {msg.parts[0].text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-end gap-3">
            <div className="h-10 w-10 rounded-full liquid-glass flex items-center justify-center text-[#0071E3] text-[11px] font-bold shrink-0 mb-1">
              성구
            </div>
            <div className="liquid-glass px-5 py-4 rounded-[1.5rem] rounded-bl-none">
              <div className="flex gap-1.5">
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="h-2 w-2 rounded-full bg-neutral-400" 
                />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="h-2 w-2 rounded-full bg-neutral-400" 
                />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="h-2 w-2 rounded-full bg-neutral-400" 
                />
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100 shadow-sm">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          </div>
        )}

        <div ref={chatEndRef} className="h-8" />
      </div>
    </div>
  );
}
