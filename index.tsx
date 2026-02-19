
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES & INTERFACES ---

type Campus = 'Batac' | 'Laoag' | 'Currimao' | 'Dingras';
type ChatMode = 'GENERAL' | 'TUTORING';
type Tab = 'home' | 'chat' | 'courses' | 'tutors' | 'files';

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
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'Jan 12, 2026', content: 'Final week for registration. Please visit your college registrar.', category: 'Enrollment' },
  { id: 'a2', title: '2026 Scholarship Renewal', date: 'Jan 18, 2026', content: 'Submit grades to OSA for renewal of academic grants.', category: 'Scholarship' },
  { id: 'a3', title: 'MMSU 48th Foundation Day', date: 'Jan 20, 2026', content: 'Happy Foundation Day! Join us at the Sunken Garden for celebrations.', category: 'Event' },
];

const MOCK_COURSES = [
  { id: 'c1', code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', description: 'Fundamental concepts of computer systems and software development.', credits: 3 },
  { id: 'c2', code: 'AGRI 101', title: 'Crop Science', college: 'College of Agriculture, Food and Sustainable Development', description: 'Basics of plant growth, soil management, and sustainable farming.', credits: 3 },
  { id: 'c3', code: 'ENGG 101', title: 'Engineering Graphics', college: 'College of Engineering', description: 'Principles of drafting, visualization, and CAD basics.', credits: 2 },
  { id: 'c4', code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', description: 'Comprehensive study of life from molecular to ecosystem levels.', credits: 4 },
  { id: 'c5', code: 'CS 202', title: 'Data Structures', college: 'College of Computing and Information Sciences', description: 'Algorithm analysis and abstract data types.', credits: 3 },
];

// --- AI SERVICE ---

const GET_SYSTEM_INSTRUCTION = (mode: ChatMode, college: string, studentId?: string) => {
  const base = `
You are the "MMSU Stallion AI Companion," the EXCLUSIVE academic assistant for Mariano Marcos State University (MMSU).
Current Date: January 20, 2026 (Foundation Day).
Semester: 2nd Semester, AY 2025-2026.

STRICT CONSTRAINTS:
1. SCOPE: Strictly MMSU-based. Politely decline non-university queries.
2. LANGUAGE: Formal English only. DO NOT use asterisks for bolding, use plain text or markdown where appropriate but keep it clean.
3. CONTEXT: User is from the ${college}.

${mode === 'TUTORING' ? `TUTORING MODE: You are now a personalized mentor for student ${studentId}. Focus on detailed explanations, study strategies, and academic policy guidance.` : ''}
`;
  return base;
};

// --- COMPONENTS ---

const QuickActions = ({ onAction, mode }: { onAction: (p: string) => void, mode: ChatMode }) => {
  const actions = mode === 'TUTORING' 
    ? [
        { label: 'Study Tips', prompt: 'Give me study tips for my major.', icon: '📚' },
        { label: 'Policy Info', prompt: 'What are the rules on scholastic delinquency?', icon: '⚖️' },
        { label: 'Thesis Help', prompt: 'Explain the research methodology for MMSU.', icon: '✍️' }
      ]
    : [
        { label: 'Enrollment', prompt: 'When is the 2nd semester enrollment deadline?', icon: '📝' },
        { label: 'Scholarships', prompt: 'What scholarships are active for 2026?', icon: '💰' },
        { label: 'Campus Map', prompt: 'Where is the University Library located?', icon: '🗺️' }
      ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {actions.map(a => (
        <button 
          key={a.label}
          onClick={() => onAction(a.prompt)}
          className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-mmsu-gold hover:text-mmsu-green transition-all shadow-sm"
        >
          {a.icon} {a.label}
        </button>
      ))}
    </div>
  );
};

const App = () => {
  // State
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Agbiag, Stallion! 🐎 I am your specialized AI Companion. How can I support your studies today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mmsu_user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Stallion Guest',
      college: 'College of Computing and Information Sciences',
      campus: 'Batac',
      theme: 'dark',
      studentId: ''
    };
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('mmsu_user_profile', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || isTyping) return;

    if (chatMode === 'TUTORING' && !user.studentId) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }]);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: "Please verify your Student ID in your profile before entering Tutoring Mode.", timestamp: new Date() }]);
      setInput('');
      return;
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY_MISSING");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.slice(-6).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })).concat([{ role: 'user', parts: [{ text }] }]),
        config: {
          systemInstruction: GET_SYSTEM_INSTRUCTION(chatMode, user.college, user.studentId),
          tools: [{ googleSearch: {} }],
          temperature: 0.7
        }
      });

      const responseText = response.text || "Connection issues. Please check the official portal.";
      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(c => c.web)
        .map(c => ({ title: c.web!.title, uri: c.web!.uri }));

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        links
      }]);
    } catch (err: any) {
      console.error(err);
      let errorMsg = "The university server is experiencing high traffic. Please try again later.";
      if (err.message === "API_KEY_MISSING") {
        errorMsg = "STALLION OFFLINE: API Key is missing in this environment. If you are on GitHub Pages, ensure your environment variables are correctly injected.";
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: errorMsg, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-500 ${user.theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-[100] border-b backdrop-blur-xl px-6 py-4 flex items-center justify-between ${user.theme === 'dark' ? 'bg-[#0f172a]/80 border-white/5' : 'bg-mmsu-green text-white shadow-lg'}`}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 bg-mmsu-gold rounded-xl flex items-center justify-center text-mmsu-green shadow-xl rotate-3">
            <i className="fas fa-horse-head text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">MMSU Stallion</h1>
            <p className="text-[8px] text-mmsu-gold font-black uppercase tracking-widest mt-1">Academic Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setUser(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="p-2.5 rounded-xl hover:bg-white/10 transition-all">
            <i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <div onClick={() => setShowProfile(true)} className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
            <div className="w-8 h-8 bg-mmsu-gold rounded-lg flex items-center justify-center text-mmsu-green font-black text-xs">{user.name[0]}</div>
            <span className="text-sm font-bold hidden sm:block">{user.name.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {activeTab === 'home' && (
          <div className="space-y-10 animate-fadeIn">
            <section className="bg-gradient-to-br from-[#014421] via-[#003318] to-black text-white p-10 md:p-16 rounded-[3rem] shadow-3xl relative overflow-hidden border border-white/10">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-3 bg-mmsu-gold/20 px-4 py-1.5 rounded-full border border-mmsu-gold/30">
                  <span className="w-2 h-2 bg-mmsu-gold rounded-full animate-pulse"></span>
                  <span className="text-mmsu-gold text-[9px] font-black uppercase tracking-widest">Foundation Day active</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black leading-tight">Rise Higher, <br/><span className="text-mmsu-gold">Stallion {user.name.split(' ')[0]}!</span></h2>
                <p className="opacity-70 max-w-xl font-medium">{user.college}</p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <button onClick={() => setActiveTab('chat')} className="bg-mmsu-gold text-mmsu-green px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">Launch Assistant</button>
                  <button onClick={() => window.open('https://mys.mmsu.edu.ph')} className="bg-white/10 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition-all">Student Portal</button>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden lg:block">
                <i className="fas fa-graduation-cap text-[15rem] transform -rotate-12 translate-x-10"></i>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-black flex items-center gap-3"><div className="w-1.5 h-6 bg-mmsu-green rounded-full"></div>Latest Bulletins</h3>
                <div className="grid gap-4">
                  {MOCK_ANNOUNCEMENTS.map(ann => (
                    <div key={ann.id} className="p-6 rounded-3xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black px-3 py-1 bg-mmsu-gold/10 text-mmsu-gold rounded-full uppercase">{ann.category}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{ann.date}</span>
                      </div>
                      <h4 className="font-bold text-lg mb-2">{ann.title}</h4>
                      <p className="text-sm opacity-60 line-clamp-2">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-3"><div className="w-1.5 h-6 bg-mmsu-gold rounded-full"></div>Tools</h3>
                <div className="grid gap-3">
                  {[
                    { label: 'Official Website', icon: 'fa-globe', url: 'https://www.mmsu.edu.ph' },
                    { label: 'MVLE Learning', icon: 'fa-book-open', url: 'https://mvle4.mmsu.edu.ph' },
                    { label: 'Document Vault', icon: 'fa-folder', onClick: () => setActiveTab('files') }
                  ].map(tool => (
                    <button key={tool.label} onClick={tool.onClick || (() => window.open(tool.url))} className="flex items-center gap-4 p-5 rounded-2xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 hover:border-mmsu-gold transition-all group text-left">
                      <div className="w-10 h-10 bg-mmsu-green text-white rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform"><i className={`fas ${tool.icon}`}></i></div>
                      <span className="font-bold text-sm">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-3xl border dark:border-white/5 overflow-hidden animate-fadeIn">
            <div className={`px-8 py-5 flex items-center justify-between border-b dark:border-white/5 transition-colors ${chatMode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${chatMode === 'TUTORING' ? 'bg-mmsu-green text-white' : 'bg-mmsu-gold text-mmsu-green'}`}>
                  <i className={`fas ${chatMode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'} text-xl`}></i>
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest leading-none">{chatMode === 'TUTORING' ? 'Academic Tutor' : 'Stallion Assistant'}</h3>
                  <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-70">Active • {user.college.split(' ').slice(2, 4).join(' ')}</p>
                </div>
              </div>
              <div className="flex bg-black/10 p-1 rounded-xl">
                <button onClick={() => setChatMode('GENERAL')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${chatMode === 'GENERAL' ? 'bg-white text-mmsu-green shadow-sm' : 'opacity-50 hover:opacity-100'}`}>General</button>
                <button onClick={() => setChatMode('TUTORING')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${chatMode === 'TUTORING' ? 'bg-mmsu-green text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}>Tutor</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30 chat-scroll">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-[85%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm leading-relaxed ${m.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border dark:border-white/5 rounded-tl-none'}`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.links && m.links.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap gap-2">
                          {m.links.map((l, i) => (
                            <a key={i} href={l.uri} target="_blank" className="text-[9px] font-black uppercase bg-mmsu-gold/10 text-mmsu-gold px-2 py-1 rounded-lg border border-mmsu-gold/20 hover:bg-mmsu-gold hover:text-mmsu-green transition-all">
                              <i className="fas fa-link mr-1"></i> {l.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-2 px-2">
                      {m.role === 'user' ? 'Stallion' : 'Assistant'} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-mmsu-gold rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-mmsu-gold rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-mmsu-gold rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 border-t dark:border-white/5">
              <QuickActions onAction={handleSend} mode={chatMode} />
              <div className="flex gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-white/10 focus-within:ring-2 focus-within:ring-mmsu-green transition-all">
                <input 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 outline-none" 
                  placeholder={chatMode === 'TUTORING' ? "Ask about your courses, policies..." : "Ask about enrollment, news..."}
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()} 
                />
                <button onClick={() => handleSend()} disabled={isTyping} className="w-10 h-10 bg-mmsu-green text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h2 className="text-3xl font-black">Course Catalog</h2>
                <p className="text-[10px] text-mmsu-gold font-black uppercase tracking-[0.2em] mt-1">{user.college}</p>
              </div>
              <div className="relative w-full md:w-96">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border dark:border-white/5 text-sm" placeholder="Search catalog..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_COURSES.filter(c => c.college === user.college).map(course => (
                <div key={course.id} className="p-6 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-mmsu-gold transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase px-3 py-1 bg-mmsu-green/10 text-mmsu-green dark:text-mmsu-gold rounded-full">{course.code}</span>
                    <span className="text-[10px] font-bold text-slate-400">{course.credits} Units</span>
                  </div>
                  <h4 className="font-bold text-lg mb-3 leading-tight">{course.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic mb-6">"{course.description}"</p>
                  <button className="w-full py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-mmsu-gold hover:text-mmsu-green transition-all">Course Overview</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tutors' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn text-center py-10">
            <div className="w-32 h-32 bg-mmsu-gold rounded-[2.5rem] flex items-center justify-center text-mmsu-green mx-auto shadow-2xl rotate-6">
              <i className="fas fa-user-graduate text-5xl"></i>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black">Stallion Mentor Room</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">Personalized tutoring grounded in your specific college curriculum. Powered by the latest Gemini 3 Flash technology.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Policy Check', icon: 'fa-shield-halved' },
                { label: 'Exam Review', icon: 'fa-pen-to-square' },
                { label: 'Curriculum Guidance', icon: 'fa-book-atlas' }
              ].map(f => (
                <div key={f.label} className="p-6 rounded-3xl bg-white dark:bg-slate-800 border dark:border-white/5">
                  <i className={`fas ${f.icon} text-2xl text-mmsu-gold mb-3`}></i>
                  <h5 className="font-bold text-xs uppercase tracking-widest">{f.label}</h5>
                </div>
              ))}
            </div>
            <button 
              onClick={() => { setChatMode('TUTORING'); setActiveTab('chat'); }}
              className="bg-mmsu-green text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              Enter Mentorship Zone
            </button>
          </div>
        )}

      </main>

      {/* Nav Dock */}
      <nav className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-[2.5rem] flex items-center gap-8 shadow-3xl border z-[150] transition-all ${user.theme === 'dark' ? 'bg-slate-900/90 border-white/5 backdrop-blur-xl' : 'bg-white/90 border-slate-100 backdrop-blur-xl'}`}>
        {[
          { id: 'home', icon: 'fa-house', label: 'Home' },
          { id: 'chat', icon: 'fa-comment-dots', label: 'Chat' },
          { id: 'courses', icon: 'fa-book', label: 'Catalog' },
          { id: 'tutors', icon: 'fa-user-graduate', label: 'Tutor' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-mmsu-gold scale-125' : 'text-slate-400 hover:text-mmsu-gold'}`}>
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-fadeIn">
          <div className={`p-10 rounded-[3rem] w-full max-w-lg shadow-4xl relative ${user.theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-100'}`}>
            <button onClick={() => setShowProfile(false)} className="absolute top-8 right-8 text-slate-400 hover:text-mmsu-gold transition-colors"><i className="fas fa-times text-xl"></i></button>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-mmsu-gold rounded-3xl flex items-center justify-center text-mmsu-green mx-auto mb-4 shadow-xl">
                <i className="fas fa-user-circle text-4xl"></i>
              </div>
              <h3 className="text-2xl font-black">Student Profile</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Identity Verification</p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Display Name</label>
                <input className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-white/5 outline-none focus:ring-2 focus:ring-mmsu-green font-bold" value={user.name} onChange={e => setUser(p => ({...p, name: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Student ID (YY-XXXXXX)</label>
                <input className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-white/5 outline-none focus:ring-2 focus:ring-mmsu-green font-black tracking-widest" placeholder="e.g. 21-123456" value={user.studentId} onChange={e => setUser(p => ({...p, studentId: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">College Department</label>
                <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-white/5 outline-none focus:ring-2 focus:ring-mmsu-green font-bold text-xs" value={user.college} onChange={e => setUser(p => ({...p, college: e.target.value}))}>
                  {COLLEGES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => setShowProfile(false)} className="w-full py-4 mt-8 bg-mmsu-green text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-mmsu-green/20 hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
