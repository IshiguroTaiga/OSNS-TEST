
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import './index.css';

// --- TYPES ---
type Campus = 'Batac' | 'Laoag' | 'Currimao' | 'Dingras';
type ChatMode = 'GENERAL' | 'TUTORING';
type Tab = 'home' | 'chat' | 'courses' | 'tutors';

interface GroundingLink {
  title: string;
  uri: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  links?: GroundingLink[];
}

interface UserProfile {
  name: string;
  college: string;
  campus: Campus;
  theme: 'light' | 'dark';
  studentId?: string;
}

// --- CONSTANTS ---
const COLLEGES = [
  'College of Agriculture, Food and Sustainable Development',
  'College of Aquatic Science and Applied Technology',
  'College of Arts and Sciences',
  'College of Business, Economics and Accountancy',
  'College of Computing and Information Sciences',
  'College of Engineering',
  'College of Health Sciences',
  'College of Industrial Technology',
  'College of Teacher Education',
  'College of Medicine',
  'College of Law',
  'College of Dentistry',
  'College of Veterinary Medicine',
  'Graduate School'
];

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', title: '2nd Semester Enrollment 2026', date: 'Jan 12, 2026', content: 'Final week for registration and subject loading via the new Student Portal. Stallions, ensure your accounts are cleared.', category: 'Enrollment' },
  { id: 'a2', title: 'Scholarship Renewal Window', date: 'Jan 18, 2026', content: 'Submit grades to OSA for academic grant extensions. Deadline is Jan 30.', category: 'Scholarship' },
  { id: 'a3', title: 'MMSU Foundation Day', date: 'Jan 20, 2026', content: 'Happy 48th Foundation Anniversary! Join us at the Sunken Garden for festivities.', category: 'Event' },
];

const MOCK_COURSES = [
  { id: 'c1', code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', description: 'Fundamental concepts of computer systems and logic.', credits: 3 },
  { id: 'c2', code: 'AGRI 101', title: 'Crop Science', college: 'College of Agriculture, Food and Sustainable Development', description: 'Basics of plant growth and sustainable soil management.', credits: 3 },
  { id: 'c3', code: 'ENGG 101', title: 'Engineering Graphics', college: 'College of Engineering', description: 'Principles of drafting, visualization, and CAD basics.', credits: 2 },
  { id: 'c4', code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', description: 'Comprehensive study of life from molecular to ecosystem levels.', credits: 4 },
  { id: 'c5', code: 'CS 202', title: 'Data Structures', college: 'College of Computing and Information Sciences', description: 'Algorithm analysis and abstract data types.', credits: 3 },
];

// --- AI SERVICE ---
const GET_SYSTEM_PROMPT = (mode: ChatMode, college: string, studentId?: string) => `
You are the "MMSU Stallion AI Companion," the EXCLUSIVE academic assistant for Mariano Marcos State University (MMSU).
Today is January 20, 2026. 2nd Semester AY 2025-2026.

OPERATIONAL RULES:
1. FOCUS: Only MMSU-related academic and campus topics.
2. LANGUAGE: Formal English. Never use asterisks (*) for formatting.
3. CONTEXT: User belongs to ${college}.
${mode === 'TUTORING' ? `4. TUTOR MODE: You are mentoring Student ${studentId}. Provide pedagogical support, concept breakdowns, and study advice.` : ''}
`;

// --- COMPONENTS ---

const NavDock = ({ active, onSet }: { active: Tab, onSet: (t: Tab) => void }) => (
  <nav className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 sm:px-8 sm:py-4 rounded-[2rem] sm:rounded-[2.5rem] flex items-center gap-4 sm:gap-8 shadow-3xl border z-[150] transition-all bg-white/90 dark:bg-slate-900/90 border-slate-100 dark:border-white/5 backdrop-blur-xl w-[90%] sm:w-auto justify-around sm:justify-start">
    {[
      { id: 'home', icon: 'fa-house', label: 'Home' },
      { id: 'chat', icon: 'fa-comment-dots', label: 'Chat' },
      { id: 'courses', icon: 'fa-book', label: 'Catalog' },
      { id: 'tutors', icon: 'fa-user-graduate', label: 'Tutor' }
    ].map(item => (
      <button key={item.id} onClick={() => onSet(item.id as Tab)} className={`flex flex-col items-center gap-1 transition-all ${active === item.id ? 'text-mmsu-gold scale-110 sm:scale-125' : 'text-slate-400 hover:text-mmsu-gold'}`}>
        <i className={`fas ${item.icon} text-base sm:text-lg`}></i>
        <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">{item.label}</span>
      </button>
    ))}
  </nav>
);

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [showProfile, setShowProfile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Agbiag, Stallion! 🐎 I am your AI Companion. How can I assist your academic journey today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mmsu_stallion_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Stallion Guest',
      college: 'College of Computing and Information Sciences',
      campus: 'Batac',
      theme: 'dark',
      studentId: ''
    };
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('mmsu_stallion_profile', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || isTyping) return;

    if (chatMode === 'TUTORING' && !user.studentId) {
      setMessages(prev => [...prev, 
        { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() },
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Please verify your Student ID in profile settings to use Tutor Mode.', timestamp: new Date() }
      ]);
      setInput('');
      return;
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API_KEY_MISSING");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.filter(m => m.id !== '1').slice(-5).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })).concat([{ role: 'user', parts: [{ text }] }]),
        config: {
          systemInstruction: GET_SYSTEM_PROMPT(chatMode, user.college, user.studentId),
          temperature: 0.7
        }
      });

      const responseText = response.text || "Connection issue. Please consult the official portal.";
      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(c => c.web)
        .map(c => ({ 
          title: c.web?.title || 'MMSU Reference', 
          uri: c.web?.uri || '' 
        }));

      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        links
      }]);
    } catch (err: any) {
      console.error("Gemini Error:", err);
      let errorMsg = `The university server is experiencing an issue: ${err.message || 'Unknown error'}. Please try again later.`;
      
      if (err.message === "API_KEY_MISSING") {
        errorMsg = "STALLION OFFLINE: API Key missing. Ensure process.env.GEMINI_API_KEY is configured.";
      } else if (err.message?.includes("RESOURCE_EXHAUSTED") || err.status === "RESOURCE_EXHAUSTED") {
        errorMsg = "The Stallion AI is currently resting due to high demand. Please try again in a few minutes.";
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: errorMsg, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-500 ${user.theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-[100] border-b backdrop-blur-xl px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between transition-colors ${user.theme === 'dark' ? 'bg-[#0f172a]/80 border-white/5' : 'bg-mmsu-green text-white shadow-lg border-mmsu-gold/20'}`}>
        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-mmsu-gold rounded-lg sm:rounded-xl flex items-center justify-center text-mmsu-green shadow-xl rotate-3">
            <i className="fas fa-horse-head text-lg"></i>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tighter leading-none">MMSU Stallion</h1>
            <p className="text-[7px] sm:text-[8px] text-mmsu-gold font-black uppercase tracking-widest mt-1">Academic Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setUser(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="p-2 rounded-lg sm:p-2.5 sm:rounded-xl hover:bg-white/10 transition-all">
            <i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <div onClick={() => setShowProfile(true)} className="flex items-center gap-2 sm:gap-3 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-mmsu-gold rounded-md sm:rounded-lg flex items-center justify-center text-mmsu-green font-black text-[10px] sm:text-xs">{user.name[0]}</div>
            <span className="text-xs sm:text-sm font-bold hidden xs:block">{user.name.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${activeTab === 'chat' ? 'max-w-[1920px]' : 'max-w-7xl'} mx-auto px-2 sm:px-6 py-2 sm:py-6 transition-all duration-500`}>
        
        {activeTab === 'home' && (
          <div className="space-y-12 animate-fadeIn">
            <section className="bg-gradient-to-br from-[#014421] via-[#003318] to-black text-white p-10 md:p-20 rounded-[3.5rem] shadow-3xl relative overflow-hidden border border-white/10">
              <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-3 bg-mmsu-gold/20 px-4 py-1.5 rounded-full border border-mmsu-gold/30">
                  <span className="w-2 h-2 bg-mmsu-gold rounded-full animate-pulse"></span>
                  <span className="text-mmsu-gold text-[9px] font-black uppercase tracking-widest">Foundation Day Active</span>
                </div>
                <h2 className="text-4xl md:text-7xl font-black leading-[1.1] tracking-tighter">Rise Higher, <br/><span className="text-mmsu-gold">Stallion {user.name.split(' ')[0]}!</span></h2>
                <p className="opacity-70 max-w-xl font-medium text-lg leading-relaxed">{user.college}</p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <button onClick={() => setActiveTab('chat')} className="bg-mmsu-gold text-mmsu-green px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">Launch AI Assistant</button>
                  <button onClick={() => window.open('https://mys.mmsu.edu.ph/v2/home')} className="bg-white/10 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition-all">Student Portal</button>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none hidden lg:block">
                <i className="fas fa-graduation-cap text-[20rem] transform -rotate-12 translate-x-20"></i>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                <h3 className="text-2xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-mmsu-green rounded-full"></div>Latest University Bulletins</h3>
                <div className="grid gap-6">
                  {MOCK_ANNOUNCEMENTS.map(ann => (
                    <div key={ann.id} className="p-8 rounded-[2rem] border bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 shadow-sm transition-all hover:shadow-2xl hover:border-mmsu-gold">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black px-4 py-1.5 bg-mmsu-gold/10 text-mmsu-gold rounded-full uppercase tracking-widest">{ann.category}</span>
                        <span className="text-xs text-slate-400 font-bold">{ann.date}</span>
                      </div>
                      <h4 className="font-bold text-xl mb-3">{ann.title}</h4>
                      <p className="text-sm opacity-60 leading-relaxed">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                <h3 className="text-2xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-mmsu-gold rounded-full"></div>Academic Tools</h3>
                <div className="grid gap-4">
                  {[
                    { label: 'Official Website', icon: 'fa-globe', url: 'https://www.mmsu.edu.ph' },
                    { label: 'MVLE', icon: 'fa-book-open', url: 'https://mvle4.mmsu.edu.ph' },
                    { label: 'Student Portal', icon: 'fa-user-circle', url: 'https://mys.mmsu.edu.ph/v2/home' }
                  ].map(tool => (
                    <button key={tool.label} onClick={() => window.open(tool.url)} className="flex items-center gap-5 p-6 rounded-[1.5rem] border bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 hover:border-mmsu-gold transition-all group text-left shadow-sm">
                      <div className="w-12 h-12 bg-mmsu-green text-white rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-lg"><i className={`fas ${tool.icon} text-lg`}></i></div>
                      <div>
                        <span className="font-black text-sm block">{tool.label}</span>
                        <span className="text-[10px] uppercase opacity-40 font-black tracking-widest">Portal Access</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[calc(100dvh-140px)] sm:h-[calc(100vh-120px)] lg:h-[calc(100vh-100px)] flex flex-col bg-white dark:bg-slate-800 rounded-[1.5rem] sm:rounded-[3rem] shadow-3xl border dark:border-white/5 overflow-hidden animate-fadeIn relative">
            <div className={`px-6 py-4 sm:px-10 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b dark:border-white/5 transition-colors z-20 gap-4 ${chatMode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}`}>
              <div className="flex items-center gap-4 sm:gap-5">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl ${chatMode === 'TUTORING' ? 'bg-mmsu-green text-white' : 'bg-mmsu-gold text-mmsu-green'}`}>
                  <i className={`fas ${chatMode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'} text-xl sm:text-2xl`}></i>
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-lg uppercase tracking-widest leading-none">{chatMode === 'TUTORING' ? 'Stallion Mentor' : 'AI Companion'}</h3>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Grounded in MMSU Intelligence</p>
                </div>
              </div>
              <div className="flex bg-black/10 p-1 rounded-xl sm:p-1.5 sm:rounded-2xl border border-white/10 w-full sm:w-auto">
                <button onClick={() => setChatMode('GENERAL')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'GENERAL' ? 'bg-white text-mmsu-green shadow-sm' : 'opacity-50 hover:opacity-100'}`}>Assistant</button>
                <button onClick={() => setChatMode('TUTORING')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'TUTORING' ? 'bg-mmsu-green text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}>Tutor</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-slate-900/50 chat-scroll">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-[90%] sm:max-w-[80%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-md text-xs sm:text-sm leading-relaxed ${m.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border dark:border-white/5 rounded-tl-none text-slate-700 dark:text-slate-200'}`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.links && m.links.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap gap-2">
                          {m.links.map((l, i) => (
                            <a key={i} href={l.uri} target="_blank" className="text-[9px] sm:text-[10px] font-black uppercase bg-mmsu-gold/10 text-mmsu-gold px-2.5 py-1 rounded-lg sm:rounded-xl border border-mmsu-gold/20 hover:bg-mmsu-gold hover:text-mmsu-green transition-all flex items-center gap-1.5">
                              <i className="fas fa-link"></i> {l.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 px-2">
                      {m.role === 'user' ? 'Stallion' : 'Companion'} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 px-6 py-4 sm:px-8 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] rounded-tl-none shadow-md flex items-center gap-2 border dark:border-white/5">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-mmsu-gold rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-mmsu-gold rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-mmsu-gold rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 sm:p-10 bg-white dark:bg-slate-800 border-t dark:border-white/5">
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                {(chatMode === 'GENERAL' ? ['Enrollment dates', 'Scholarship requirements', 'Campus landmarks'] : ['Explain study tips', 'Grading policy', 'Thesis formatting']).map(q => (
                  <button key={q} onClick={() => handleSend(q)} className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-slate-100 dark:bg-slate-900/50 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest border dark:border-white/10 hover:border-mmsu-gold transition-all">{q}</button>
                ))}
              </div>
              <div className="flex gap-2 sm:gap-4 p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-3xl border dark:border-white/10 focus-within:ring-2 focus-within:ring-mmsu-green transition-all shadow-inner">
                <input 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm p-2 sm:p-4 outline-none font-medium" 
                  placeholder={chatMode === 'TUTORING' ? "Explain a concept or policy..." : "Ask anything about MMSU..."}
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()} 
                />
                <button onClick={() => handleSend()} disabled={isTyping} className="w-10 h-10 sm:w-14 sm:h-14 bg-mmsu-green text-white rounded-xl sm:rounded-[1.25rem] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20">
                  <i className="fas fa-paper-plane text-base sm:text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <div>
                <h2 className="text-4xl font-black tracking-tight">University Catalog</h2>
                <p className="text-[11px] text-mmsu-gold font-black uppercase tracking-[0.3em] mt-2">{user.college}</p>
              </div>
              <div className="relative w-full md:w-[400px]">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-white dark:bg-slate-800 border dark:border-white/5 text-sm shadow-sm focus:ring-2 focus:ring-mmsu-green outline-none" placeholder="Search course code or title..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {MOCK_COURSES.filter(c => c.college === user.college).map(course => (
                <div key={course.id} className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-mmsu-gold transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black uppercase px-4 py-1.5 bg-mmsu-green/10 text-mmsu-green dark:text-mmsu-gold rounded-full tracking-widest border border-mmsu-green/20">{course.code}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.credits} Units</span>
                  </div>
                  <h4 className="font-black text-xl mb-4 leading-tight">{course.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic mb-8">"{course.description}"</p>
                  <button className="w-full py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-mmsu-gold hover:text-mmsu-green transition-all shadow-sm">View Curriculum Data</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tutors' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-fadeIn text-center py-20">
            <div className="w-40 h-40 bg-mmsu-gold rounded-[3rem] flex items-center justify-center text-mmsu-green mx-auto shadow-4xl rotate-6 animate-pulse">
              <i className="fas fa-user-graduate text-6xl"></i>
            </div>
            <div className="space-y-6">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter">Stallion Mentor Room</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed font-medium">Grounded academic support powered by specialized university intelligence. Experience tutoring that understands your specific college curriculum.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Policy Mastery', icon: 'fa-shield-halved', desc: 'Instant policy verification' },
                { label: 'Curriculum Aid', icon: 'fa-book-atlas', desc: 'Subject-specific tutoring' },
                { label: 'Academic Integrity', icon: 'fa-pen-nib', desc: 'Guide to proper citation' }
              ].map(f => (
                <div key={f.label} className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-800 border dark:border-white/5 shadow-lg group hover:-translate-y-2 transition-all">
                  <div className="w-14 h-14 bg-mmsu-green text-mmsu-gold rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:rotate-12 transition-transform"><i className={`fas ${f.icon} text-xl`}></i></div>
                  <h5 className="font-black text-sm uppercase tracking-widest mb-2">{f.label}</h5>
                  <p className="text-xs text-slate-400 font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => { setChatMode('TUTORING'); setActiveTab('chat'); }}
              className="bg-mmsu-green text-white px-16 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-sm shadow-3xl hover:scale-110 active:scale-95 transition-all mt-8 border-2 border-mmsu-gold/20"
            >
              Initialize Mentorship
            </button>
          </div>
        )}

      </main>

      <NavDock active={activeTab} onSet={setActiveTab} />

      {/* Settings Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl flex items-center justify-center z-[200] p-4 sm:p-6 animate-fadeIn">
          <div className={`p-6 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] w-full max-w-xl shadow-4xl relative ${user.theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-100'}`}>
            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 sm:top-10 sm:right-10 text-slate-400 hover:text-mmsu-gold transition-colors p-2"><i className="fas fa-times text-xl sm:text-2xl"></i></button>
            <div className="text-center mb-6 sm:mb-10">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-mmsu-gold rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-mmsu-green mx-auto mb-4 sm:mb-6 shadow-2xl rotate-3">
                <i className="fas fa-user-circle text-3xl sm:text-5xl"></i>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Identity Settings</h3>
              <p className="text-[9px] sm:text-[11px] text-mmsu-gold font-black uppercase tracking-[0.3em] mt-2">MMSU Verification Profile</p>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                <input className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-white/5 outline-none focus:ring-2 focus:ring-mmsu-green font-bold text-base sm:text-lg" value={user.name} onChange={e => setUser(p => ({...p, name: e.target.value}))} />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Student ID (YY-XXXXXX)</label>
                <input 
                  className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-white/5 outline-none focus:ring-2 focus:ring-mmsu-green font-black tracking-widest text-base sm:text-lg" 
                  placeholder="e.g. 22-123456" 
                  value={user.studentId} 
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9-]/g, '');
                    setUser(p => ({...p, studentId: val}));
                  }} 
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">College Department</label>
                <select className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-white/5 outline-none focus:ring-2 focus:ring-mmsu-green font-bold text-xs sm:text-sm" value={user.college} onChange={e => setUser(p => ({...p, college: e.target.value}))}>
                  {COLLEGES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => setShowProfile(false)} className="w-full py-4 sm:py-5 mt-8 sm:mt-10 bg-mmsu-green text-white rounded-xl sm:rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs shadow-2xl shadow-mmsu-green/30 hover:scale-[1.02] active:scale-95 transition-all border border-white/10">Synchronize Identity</button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
