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
        className="relative mb-6 h-32 w-32 md:h-40 md:w-40 overflow-hidden rounded-full border-4 border-white shadow-2xl"
      >
        <div className="flex h-full w-full items-center justify-center bg-neutral-50 text-[#0071E3] text-4xl md:text-5xl font-bold">
          성구
        </div>
      </motion.div>
      <motion.h1 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900"
      >
        성구
      </motion.h1>
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-2 text-lg md:text-xl text-[#0071E3] font-bold"
      >
        인디웨이
      </motion.p>
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-neutral-500 font-medium"
      >
        나만의 길을 만들어가는 1인 기업가
      </motion.p>
    </div>
  );
}

function IntroView() {
  const keywords = ['1인 기업', '인디해커', 'Micro SaaS', 'AI', '크리에이터', '저자'];

  return (
    <div className="py-10">
      <h2 className="text-2xl font-bold mb-8">소개</h2>
      <div className="space-y-6">
        <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-100 leading-relaxed text-neutral-700">
          안녕하세요 👋 대기업과 스타트업에서 일하다가, 지금은 혼자서 프로덕트를 만들고 있습니다. 
          AI 도구를 활용해 아이디어를 빠르게 현실로 만드는 걸 좋아합니다. 
          만든 과정을 글과 영상으로 기록하고 공유하고 있어요.
        </div>
        
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <span key={i} className="px-4 py-2 bg-white border border-neutral-200 rounded-2xl text-sm font-medium text-neutral-500">
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
      desc: '1인 개발자를 위한 피드백 & 프로덕트 관리 플랫폼', 
      tech: 'Next.js, Convex, Clerk, Shadcn, Tailwind CSS',
      link: 'https://productlog.xyz'
    },
    { 
      type: 'Micro SaaS', 
      title: '인디로그', 
      desc: '1인 기업가를 위한 프로필 사이트 플랫폼', 
      tech: 'Next.js, Convex, Clerk, Shadcn, Tailwind CSS',
      link: 'https://indielog.xyz'
    },
    { 
      type: '바이브 코딩 입문서', 
      title: '커서×AI로 완성하는 나만의 웹 서비스', 
      desc: 'AI 코딩 도구 Cursor 실전 가이드', 
      tech: '길벗',
      link: 'https://product.kyobobook.co.kr/detail/S000218729929'
    },
    { 
      type: 'AI 입문서', 
      title: '제미나이로 일 잘하는 법', 
      desc: '제미나이 활용 업무 가이드', 
      tech: '길벗',
      link: 'https://product.kyobobook.co.kr/detail/S000219506535'
    },
  ];

  return (
    <div className="py-10">
      <h2 className="text-2xl font-bold mb-8">프로젝트</h2>
      <div className="grid gap-6">
        {projects.map((p, i) => (
          <motion.a 
            key={i}
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group block rounded-3xl border border-neutral-100 bg-neutral-50 p-6 transition-all hover:border-[#0071E3]/30 hover:bg-white hover:shadow-xl hover:shadow-neutral-200/50"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-[#0071E3]/10 text-[#0071E3] rounded-full text-[10px] font-bold uppercase tracking-wider">
                {p.type}
              </span>
              <ExternalLink size={16} className="text-neutral-300 group-hover:text-[#0071E3] transition-colors" />
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-[#0071E3] transition-colors">{p.title}</h3>
            <p className="text-neutral-500 text-sm mb-4">{p.desc}</p>
            <p className="text-neutral-400 text-[11px] font-medium">{p.tech}</p>
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
    <div className="py-10">
      <h2 className="text-2xl font-bold mb-8">기술 스택</h2>
      <div className="space-y-10">
        {skills.map((s, i) => (
          <div key={i}>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="h-px w-4 bg-neutral-200" />
              {s.category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {s.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-[#0071E3]/20 transition-colors">
                  <img 
                    src={`https://cdn.simpleicons.org/${item.slug}`} 
                    alt={item.name} 
                    className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all"
                  />
                  <span className="text-sm font-medium text-neutral-700">{item.name}</span>
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
      desc: 'Micro SaaS, 웹/앱, 오픈소스 개발, 책 집필, 콘텐츠 제작' 
    },
    { 
      title: '핀테크 스타트업', 
      period: '2022 - 2024', 
      desc: '프론트엔드 리드' 
    },
    { 
      title: '헬스케어 스타트업', 
      period: '2020 - 2022', 
      desc: '풀스택 개발자' 
    },
    { 
      title: '대기업', 
      period: '2016 - 2019', 
      desc: '소프트웨어 엔지니어' 
    },
  ];

  return (
    <div className="py-10">
      <h2 className="text-2xl font-bold mb-10">경험</h2>
      <div className="relative space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-100">
        {exps.map((e, i) => (
          <div key={i} className="relative pl-10">
            <div className="absolute left-0 top-1.5 h-[24px] w-[24px] rounded-full bg-white border-4 border-neutral-100 flex items-center justify-center z-10">
              <div className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#0071E3] tracking-wider">{e.period}</span>
              <h3 className="text-lg font-bold text-neutral-900">{e.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mt-1">{e.desc}</p>
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
    <div className="py-10">
      <h2 className="text-2xl font-bold mb-8">연락처</h2>
      <div className="grid gap-4">
        {contacts.map((c, i) => {
          const Icon = c.icon;
          return (
            <a 
              key={i}
              href={c.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-3xl bg-neutral-50 border border-neutral-100 transition-all hover:bg-white hover:border-[#0071E3]/30 hover:shadow-lg hover:shadow-neutral-200/50 group"
            >
              <div className="h-12 w-12 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-400 group-hover:text-[#0071E3] group-hover:border-[#0071E3]/20 transition-all">
                <Icon size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">{c.label}</span>
                <span className="text-neutral-800 font-semibold group-hover:text-[#0071E3] transition-colors">{c.value}</span>
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
    <div className="flex flex-col h-full py-10">
      <h2 className="text-2xl font-bold mb-8">성구 AI와 대화하기</h2>
      
      <div className="flex-1 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-3xl bg-neutral-50 flex items-center justify-center text-[#0071E3] mb-4">
              <MessageCircle size={32} />
            </div>
            <p className="text-neutral-500 text-sm">
              성구의 프로젝트, 경험, 기술에 대해 무엇이든 물어보세요!
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
          >
            {msg.role === 'model' && (
              <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-[#0071E3] text-[10px] font-bold shrink-0 mb-1">
                성구
              </div>
            )}
            <div 
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#0071E3] text-white rounded-br-none' 
                  : 'bg-neutral-100 text-neutral-800 rounded-bl-none'
              }`}
            >
              {msg.parts[0].text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-end gap-2">
            <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-[#0071E3] text-[10px] font-bold shrink-0 mb-1">
              성구
            </div>
            <div className="bg-neutral-100 px-4 py-3 rounded-2xl rounded-bl-none">
              <div className="flex gap-1">
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="h-1.5 w-1.5 rounded-full bg-neutral-400" 
                />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="h-1.5 w-1.5 rounded-full bg-neutral-400" 
                />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="h-1.5 w-1.5 rounded-full bg-neutral-400" 
                />
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
              <AlertCircle size={14} />
              {errorMessage}
            </div>
          </div>
        )}

        <div ref={chatEndRef} className="h-4" />
      </div>
    </div>
  );
}
