import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES & INTERFACES ---
type Campus = 'Batac' | 'Laoag' | 'Currimao' | 'Dingras';
type College = 
  | 'College of Agriculture, Food and Sustainable Development'
  | 'College of Aquatic Science and Applied Technology'
  | 'College of Arts and Sciences'
  | 'College of Business, Economics and Accountancy'
  | 'College of Computing and Information Sciences'
  | 'College of Engineering'
  | 'College of Health Sciences'
  | 'College of Industrial Technology'
  | 'College of Teacher Education'
  | 'College of Medicine'
  | 'College of Law'
  | 'College of Dentistry'
  | 'College of Veterinary Medicine'
  | 'Graduate School';

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
  groundingLinks?: GroundingLink[];
}

interface UserProfile {
  name: string;
  college: College;
  campus: Campus;
  theme: 'light' | 'dark';
  studentId?: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
  college: College;
  description: string;
  credits: number;
}

interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  category: 'Academic' | 'Event' | 'Scholarship' | 'Enrollment';
}

interface VaultFile {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
}

// --- CONSTANTS ---
const COLLEGES: College[] = [
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

const MOCK_COURSES: Course[] = [
  { id: 'c1', code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', description: 'Fundamental concepts of computer hardware and software systems.', credits: 3 },
  { id: 'c2', code: 'CS 146', title: 'Software Engineering', college: 'College of Computing and Information Sciences', description: 'Systematic approach to development and maintenance of software.', credits: 3 },
  { id: 'c3', code: 'AGRI 101', title: 'Crop Science', college: 'College of Agriculture, Food and Sustainable Development', description: 'Principles of plant growth and crop production.', credits: 3 },
  { id: 'c4', code: 'ENGG 101', title: 'Engineering Graphics', college: 'College of Engineering', description: 'Visual communication and technical drawing principles.', credits: 2 },
  { id: 'c5', code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', description: 'Study of life, cellular structures, and genetics.', credits: 4 },
  { id: 'c6', code: 'ACCTG 101', title: 'Financial Accounting', college: 'College of Business, Economics and Accountancy', description: 'Basic accounting concepts and financial reporting.', credits: 3 },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'Jan 12, 2026', content: 'Final call for adding/dropping subjects. Registration ends this Friday.', category: 'Enrollment' },
  { id: 'a2', title: 'Scholarship Renewal Period', date: 'Jan 18, 2026', content: 'Submit your documentary requirements to OSA for scholarship renewal.', category: 'Scholarship' },
  { id: 'a3', title: 'MMSU 48th Foundation Day', date: 'Jan 20, 2026', content: 'Happy Foundation Day, Stallions! Join the grand parade at the Sunken Garden.', category: 'Event' },
];

// --- AI SERVICE ---
const getAIResponse = async (
  prompt: string, 
  college: string,
  mode: ChatMode = 'GENERAL',
  studentId?: string,
  history?: Array<{role: 'user' | 'assistant', content: string}>
): Promise<{ text: string; links?: GroundingLink[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      You are the "MMSU Stallion AI Companion," the exclusive academic assistant for Mariano Marcos State University (MMSU).
      Current Date: January 20, 2026 (MMSU Foundation Day).
      Context: 2nd Semester, AY 2025-2026.

      OPERATIONAL PROTOCOL:
      1. SCOPE: Strictly MMSU-related topics. Politely decline non-university queries.
      2. TONE: Professional, academic, and supportive. Use "Agbiag!" as a greeting.
      3. CONTEXT: User is from the ${college}.
      4. STYLE: Formal English. Avoid unnecessary bolding symbols like asterisks.

      ${mode === 'TUTORING' && studentId ? `
      TUTORING MODE ACTIVE:
      - You are a specialized mentor for Student ID: ${studentId}.
      - Focus on deep explanations, study strategies, and academic policy guidance.
      ` : ''}
    `;

    const contents: any[] = history?.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const text = response.text || "I apologize, but my connection to the university network is currently unstable.";
    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Academic Reference',
        uri: chunk.web?.uri || ''
      })) || [];

    return { text, links };
  } catch (error) {
    console.error("AI Error:", error);
    return { text: "Stallion servers are busy. Please consult the official student handbook." };
  }
};

// --- MAIN APPLICATION ---

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Agbiag, Stallion! 🐎 How can I assist you with your academic journey today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('stallion_profile_v2');
    return saved ? JSON.parse(saved) : {
      name: 'Stallion Guest',
      college: 'College of Computing and Information Sciences',
      campus: 'Batac',
      theme: 'dark',
      studentId: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('stallion_profile_v2', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
    const result = await getAIResponse(text, user.college, chatMode, user.studentId, history);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.text,
      timestamp: new Date(),
      groundingLinks: result.links
    };

    setIsTyping(false);
    setChatMessages(prev => [...prev, aiMsg]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newVaultFiles = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type.split('/')[1]?.toUpperCase() || 'DOC',
      date: new Date().toLocaleDateString()
    }));
    setVaultFiles(prev => [...newVaultFiles, ...prev]);
  };

  return (
    <div className={`min-h-screen pb-28 transition-colors duration-500 ${user.theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-[100] border-b backdrop-blur-2xl px-6 py-4 md:px-12 flex items-center justify-between transition-all ${user.theme === 'dark' ? 'bg-[#0f172a]/80 border-white/5 shadow-2xl shadow-black/20' : 'bg-mmsu-green text-white shadow-xl'}`}>
        <div className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('home')}>
          <div className="w-12 h-12 bg-mmsu-gold rounded-2xl flex items-center justify-center text-mmsu-green shadow-xl shadow-mmsu-gold/20 rotate-3">
            <i className="fas fa-horse-head text-2xl"></i>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none">MMSU Stallion</h1>
            <p className="text-[10px] text-mmsu-gold font-black uppercase tracking-[0.2em] mt-1">Academic Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button onClick={() => setUser(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="p-3 rounded-2xl hover:bg-white/10 transition-colors">
            <i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
          </button>
          <div onClick={() => setShowSettings(true)} className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
            <div className="w-9 h-9 bg-mmsu-gold rounded-xl flex items-center justify-center text-mmsu-green font-black text-sm">{user.name[0]}</div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black opacity-50 leading-none">Profile</p>
              <span className="text-sm font-bold truncate max-w-[100px] block">{user.name.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {activeTab === 'home' && (
          <div className="space-y-12 animate-fadeIn">
            <section className="bg-gradient-to-br from-[#014421] via-[#003318] to-black text-white p-10 md:p-16 rounded-[3rem] shadow-3xl relative overflow-hidden border border-white/10">
              <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-3 bg-mmsu-gold/20 backdrop-blur-md px-5 py-2 rounded-full border border-mmsu-gold/30">
                  <span className="w-2 h-2 bg-mmsu-gold rounded-full animate-pulse"></span>
                  <span className="text-mmsu-gold text-[10px] font-black uppercase tracking-widest">Active Academic Period 2025-2026</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">Agbiag, <br/><span className="text-mmsu-gold">Stallion {user.name.split(' ')[0]}!</span></h2>
                <p className="text-base md:text-xl opacity-80 max-w-2xl font-medium leading-relaxed">{user.college}</p>
                <div className="flex flex-wrap gap-5 pt-4">
                  <button onClick={() => setActiveTab('chat')} className="bg-mmsu-gold text-mmsu-green px-10 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-mmsu-gold/20 hover:scale-105 active:scale-95 transition-all">Launch AI Assistant</button>
                  <button onClick={() => window.open('https://mys.mmsu.edu.ph', '_blank')} className="bg-white/10 backdrop-blur-md px-10 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition-all">Open Student Portal</button>
                </div>
              </div>
              <div className="absolute top-[-10%] right-[-5%] text-[30rem] opacity-5 pointer-events-none transform -rotate-12"><i className="fas fa-horse-head"></i></div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                <h3 className="text-2xl font-black flex items-center gap-4 dark:text-white"><div className="w-2 h-8 bg-mmsu-green rounded-full"></div>University Notices</h3>
                <div className="grid gap-5">
                  {MOCK_ANNOUNCEMENTS.map(ann => (
                    <div key={ann.id} className="p-8 rounded-[2.5rem] border bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
                      <div className="flex justify-between items-start mb-5">
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${ann.category === 'Scholarship' ? 'bg-blue-100 text-blue-700' : 'bg-mmsu-gold/10 text-mmsu-gold'}`}>{ann.category}</span>
                        <span className="text-[10px] opacity-40 font-bold">{ann.date}</span>
                      </div>
                      <h4 className="font-bold text-xl dark:text-white group-hover:text-mmsu-gold transition-colors">{ann.title}</h4>
                      <p className="text-sm opacity-60 mt-2 leading-relaxed dark:text-slate-400">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                <h3 className="text-2xl font-black flex items-center gap-4 dark:text-white"><div className="w-2 h-8 bg-mmsu-gold rounded-full"></div>Academic Tools</h3>
                <div className="grid gap-4">
                  {[
                    { label: 'Official Website', icon: 'fa-globe', url: 'https://mmsu.edu.ph', color: 'bg-mmsu-green' },
                    { label: 'MVLE Learning', icon: 'fa-graduation-cap', url: 'https://mvle4.mmsu.edu.ph', color: 'bg-orange-600' },
                    { label: 'Student Portal', icon: 'fa-user-circle', url: 'https://mys.mmsu.edu.ph', color: 'bg-emerald-600' }
                  ].map(tool => (
                    <button key={tool.label} onClick={() => window.open(tool.url, '_blank')} className="flex items-center gap-5 p-6 rounded-[2rem] border bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 hover:border-mmsu-gold transition-all shadow-sm group">
                      <div className={`w-12 h-12 ${tool.color} text-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/10 transition-transform group-hover:rotate-12`}><i className={`fas ${tool.icon} text-lg`}></i></div>
                      <span className="font-black text-sm uppercase tracking-widest dark:text-white">{tool.label}</span>
                      <i className="fas fa-arrow-right ml-auto opacity-0 group-hover:opacity-100 transition-all text-mmsu-gold"></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-280px)] min-h-[600px] flex flex-col bg-white dark:bg-slate-800 rounded-[3rem] shadow-3xl overflow-hidden border dark:border-white/5 animate-fadeIn relative">
            <div className={`px-10 py-6 flex items-center justify-between border-b dark:border-white/5 shadow-lg relative z-10 transition-colors ${chatMode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${chatMode === 'TUTORING' ? 'bg-mmsu-green text-white' : 'bg-mmsu-gold text-mmsu-green'}`}>
                  <i className={`fas ${chatMode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'} text-2xl`}></i>
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tighter leading-none flex items-center gap-2">
                    {chatMode === 'TUTORING' ? 'Stallion Tutor' : 'Stallion AI Assistant'}
                    <i className="fas fa-sparkles text-xs opacity-50"></i>
                  </h3>
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mt-1.5">Knowledge Grounding Active</p>
                </div>
              </div>
              <div className="bg-black/10 p-1.5 rounded-2xl flex gap-1 border border-white/10 backdrop-blur-md">
                <button onClick={() => setChatMode('GENERAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'GENERAL' ? 'bg-white text-mmsu-green shadow-xl' : 'opacity-60 hover:opacity-100'}`}>Assistant</button>
                <button onClick={() => { if(!user.studentId) setShowLogin(true); else setChatMode('TUTORING'); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'TUTORING' ? 'bg-mmsu-green text-white shadow-xl' : 'opacity-60 hover:opacity-100'}`}>Tutor</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 bg-slate-50/50 dark:bg-[#0f172a]/50 chat-scroll">
              {chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-8 py-5 rounded-[2.5rem] text-sm leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-white/5 rounded-tl-none'}`}>
                      <p className="whitespace-pre-wrap font-medium">{m.content}</p>
                      {m.groundingLinks && m.groundingLinks.length > 0 && (
                        <div className="mt-6 pt-5 border-t dark:border-white/5 space-y-3">
                          <span className="text-[9px] font-black uppercase opacity-40 tracking-widest block px-1">Verified Sources</span>
                          <div className="flex flex-wrap gap-2">
                            {m.groundingLinks.map((l, i) => (
                              <a key={i} href={l.uri} target="_blank" className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-xl text-[10px] font-black hover:scale-105 transition-transform shadow-sm max-w-[200px] truncate">
                                <i className="fas fa-link opacity-30 text-[8px]"></i> {l.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-black opacity-30 uppercase mt-2 px-6 tracking-widest">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              {isTyping && <div className="flex gap-2 p-4 bg-white/5 w-fit rounded-full"><div className="w-2 h-2 bg-mmsu-gold rounded-full animate-bounce"></div><div className="w-2 h-2 bg-mmsu-gold rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-mmsu-gold rounded-full animate-bounce delay-200"></div></div>}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 bg-white dark:bg-slate-800 border-t dark:border-white/5">
              <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {(chatMode === 'TUTORING' 
                  ? ['Explain complex topics', 'Review study guide', 'MMSU grade system'] 
                  : ['Enrollment help', 'Campus directions', 'Scholarship list']
                ).map((p, i) => (
                  <button key={i} onClick={() => handleSendMessage(p)} className="px-5 py-2.5 border rounded-full text-[10px] font-black uppercase tracking-widest dark:border-white/10 dark:text-white hover:bg-mmsu-gold hover:text-mmsu-green transition-all shadow-sm active:scale-95 whitespace-nowrap">{p}</button>
                ))}
              </div>
              <div className="flex items-center gap-4 bg-slate-100 dark:bg-[#0f172a] p-3 pl-8 rounded-[2rem] border dark:border-white/10 focus-within:ring-4 focus-within:ring-mmsu-gold/10 transition-all shadow-inner">
                <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm dark:text-white font-medium" placeholder={chatMode === 'TUTORING' ? "I need help with my subjects..." : "Ask Stallion Assistant anything..."} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                <button onClick={() => handleSendMessage()} disabled={!input.trim() || isTyping} className="w-14 h-14 bg-gradient-to-br from-mmsu-green to-mmsu-darkGreen text-white rounded-2xl shadow-2xl shadow-mmsu-green/30 disabled:opacity-20 hover:scale-105 active:scale-95 transition-all"><i className="fas fa-paper-plane text-lg"></i></button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-mmsu-gold/10 rounded-[2rem] flex items-center justify-center text-mmsu-gold text-3xl shadow-inner border border-mmsu-gold/20">
                  <i className="fas fa-book-open-reader"></i>
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tight dark:text-white">Academic Catalog</h2>
                  <p className="text-[10px] text-mmsu-green dark:text-mmsu-gold font-black uppercase tracking-[0.2em] mt-1.5">{user.college}</p>
                </div>
              </div>
              <div className="relative w-full md:w-96 group">
                <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 opacity-30 text-gray-400 group-focus-within:text-mmsu-gold transition-colors"></i>
                <input className="w-full pl-14 pr-8 py-5 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border-none focus:ring-4 focus:ring-mmsu-gold/10 dark:text-white font-bold text-sm" placeholder="Search course code or title..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {MOCK_COURSES.filter(c => c.college === user.college || activeTab === 'courses').map(c => (
                <div key={c.id} className="p-10 bg-white dark:bg-slate-800 rounded-[3rem] border dark:border-white/5 hover:border-mmsu-gold transition-all shadow-sm group relative overflow-hidden">
                  <span className="bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold px-5 py-2 rounded-xl text-[10px] font-black border border-mmsu-gold/20 uppercase tracking-widest">{c.code}</span>
                  <h4 className="mt-8 font-black text-2xl dark:text-white group-hover:text-mmsu-gold transition-colors leading-tight">{c.title}</h4>
                  <p className="mt-4 text-sm opacity-50 dark:text-slate-400 italic leading-relaxed border-l-2 border-mmsu-gold/20 pl-4">"{c.description}"</p>
                  <div className="mt-10 pt-8 border-t dark:border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">{c.credits} Credit Units</span>
                    <button className="text-xs font-black text-mmsu-green dark:text-mmsu-gold hover:translate-x-2 transition-transform uppercase">Prospectus <i className="fas fa-arrow-right ml-2"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-mmsu-gold/10 rounded-2xl flex items-center justify-center text-mmsu-gold text-2xl shadow-inner border border-mmsu-gold/20"><i className="fas fa-folder-open"></i></div>
                <div>
                  <h2 className="text-3xl font-black dark:text-white">Academic Vault</h2>
                  <p className="text-[10px] text-mmsu-green dark:text-mmsu-gold font-black uppercase tracking-widest">Personal Storage for Student Documents</p>
                </div>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-mmsu-green text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-mmsu-green/30 hover:scale-105 active:scale-95 transition-all">Upload File</button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {vaultFiles.map(f => (
                <div key={f.id} className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-white/5 shadow-sm flex flex-col justify-between hover:border-mmsu-gold transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-[#0f172a] rounded-2xl flex items-center justify-center font-black text-[10px] text-mmsu-green dark:text-mmsu-gold border dark:border-white/5">{f.type}</div>
                    <div className="overflow-hidden">
                      <h5 className="font-bold text-sm truncate dark:text-white">{f.name}</h5>
                      <p className="text-[9px] opacity-40 font-black uppercase mt-1">{f.size} • {f.date}</p>
                    </div>
                  </div>
                  <button className="mt-8 w-full py-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-mmsu-gold/10 hover:text-mmsu-green transition-all">Open Document</button>
                </div>
              ))}
              {vaultFiles.length === 0 && <div className="col-span-full py-24 text-center border-4 border-dashed dark:border-white/5 rounded-[3rem] opacity-30 font-black uppercase tracking-[0.4em] text-xl">Vault is Empty</div>}
            </div>
          </div>
        )}

        {activeTab === 'tutors' && (
          <div className="animate-fadeIn space-y-12">
            <section className="p-16 md:p-24 rounded-[4rem] bg-gradient-to-br from-[#FFD700] via-[#ffd700] to-orange-400 text-[#014421] text-center space-y-10 relative overflow-hidden shadow-3xl shadow-mmsu-gold/30">
              <div className="relative z-10 space-y-10">
                <div className="w-28 h-28 bg-white/95 rounded-[3rem] flex items-center justify-center mx-auto text-5xl shadow-3xl rotate-6 hover:rotate-0 transition-transform"><i className="fas fa-user-graduate"></i></div>
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">Stallion <br/>Learning Mentor</h2>
                  <p className="text-lg md:text-2xl font-bold max-w-2xl mx-auto opacity-70 leading-relaxed">Personalized high-fidelity academic mentoring for {user.college}.</p>
                </div>
                <button onClick={() => { setChatMode('TUTORING'); setActiveTab('chat'); if(!user.studentId) setShowLogin(true); }} className="bg-[#014421] text-white px-16 py-6 rounded-3xl font-black uppercase text-sm tracking-[0.25em] shadow-3xl hover:scale-110 active:scale-95 transition-all">Initialize Tutor</button>
              </div>
              <i className="fas fa-brain absolute left-[-100px] top-[-100px] text-[35rem] opacity-5 pointer-events-none"></i>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Deep Knowledge', icon: 'fa-microscope', desc: 'Expert level explanations of complex major subjects.' },
                { icon: 'fa-shield-halved', title: 'Academic Ethics', desc: 'Guidance built on MMSU integrity standards.' },
                { icon: 'fa-bolt', title: 'Real-time Search', desc: 'Grounding in the latest 2026 academic policies.' }
              ].map(f => (
                <div key={f.title} className="p-12 bg-white dark:bg-slate-800 rounded-[3rem] border dark:border-white/5 text-center shadow-xl hover:-translate-y-2 transition-all">
                  <div className="w-16 h-16 bg-mmsu-gold/10 text-mmsu-gold rounded-3xl flex items-center justify-center mx-auto mb-8 text-2xl border border-mmsu-gold/20 shadow-inner"><i className={`fas ${f.icon}`}></i></div>
                  <h4 className="font-black text-xl mb-4 dark:text-white uppercase tracking-tight">{f.title}</h4>
                  <p className="text-sm opacity-50 dark:text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Navigation Dock */}
      <nav 
        style={{ resize: 'horizontal', overflow: 'hidden' }}
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-6 rounded-[3.5rem] border backdrop-blur-3xl z-[150] flex justify-around items-center gap-12 shadow-3xl transition-all min-w-[320px] max-w-[90%] md:max-w-4xl group overflow-x-auto scrollbar-hide ${user.theme === 'dark' ? 'bg-[#0f172a]/95 border-white/10 shadow-black/40' : 'bg-white/95 border-slate-200 shadow-slate-300/40'}`}>
        {[
          { id: 'home', icon: 'fa-house', label: 'Home' },
          { id: 'chat', icon: 'fa-comment-dots', label: 'AI Chat' },
          { id: 'courses', icon: 'fa-book', label: 'Catalog' },
          { id: 'tutors', icon: 'fa-user-graduate', label: 'Mentor' },
          { id: 'files', icon: 'fa-folder-open', label: 'Vault' }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id as Tab)} 
            className={`flex flex-col items-center gap-2 group transition-all relative ${activeTab === item.id ? 'text-mmsu-green dark:text-mmsu-gold scale-125 font-black' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] hidden sm:block whitespace-nowrap">{item.label}</span>
            {activeTab === item.id && <span className="absolute -bottom-3 w-1.5 h-1.5 bg-mmsu-green dark:bg-mmsu-gold rounded-full shadow-lg"></span>}
          </button>
        ))}
        {/* Resize Handle */}
        <div className="absolute right-3 bottom-3 w-3 h-3 border-r-2 border-b-2 border-slate-400/20 pointer-events-none group-hover:opacity-100 transition-opacity"></div>
      </nav>

      {/* Profile Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[200] p-6 animate-fadeIn">
          <div className={`p-12 rounded-[4rem] border max-w-xl w-full shadow-4xl transform transition-all border dark:border-white/10 ${user.theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-4xl font-black tracking-tighter">Student Profile</h3>
                <p className="text-[10px] font-black uppercase opacity-40 mt-1 tracking-widest">Academic Identity Manager</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-14 h-14 rounded-full hover:bg-slate-500/10 flex items-center justify-center transition-all"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-3">Full Legal Name</label>
                <input className={`w-full p-6 rounded-[2rem] border outline-none font-bold text-lg transition-all ${user.theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-mmsu-gold' : 'bg-slate-50 border-slate-200 focus:border-mmsu-green'}`} value={user.name} onChange={e => setUser(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-3">College Faculty</label>
                <select className={`w-full p-6 rounded-[2rem] border font-bold outline-none transition-all ${user.theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} value={user.college} onChange={e => setUser(p => ({ ...p, college: e.target.value as College }))}>
                  {COLLEGES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-3">Student ID</label>
                  <input className={`w-full p-6 rounded-[2rem] border font-black tracking-widest outline-none text-center ${user.theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-mmsu-gold' : 'bg-slate-50 border-slate-200'}`} value={user.studentId} onChange={e => setUser(p => ({ ...p, studentId: e.target.value }))} placeholder="YY-XXXXXX" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-3">Campus</label>
                  <select className={`w-full p-6 rounded-[2rem] border font-bold outline-none ${user.theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} value={user.campus} onChange={e => setUser(p => ({ ...p, campus: e.target.value as Campus }))}>
                    <option value="Batac">Batac</option><option value="Laoag">Laoag</option><option value="Currimao">Currimao</option><option value="Dingras">Dingras</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-14 w-full py-6 bg-mmsu-green text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-3xl shadow-mmsu-green/20 hover:scale-105 active:scale-95 transition-all">Save Changes</button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[250] p-6 animate-fadeIn">
          <div className={`p-10 rounded-[3rem] w-full max-w-md text-center shadow-4xl ${user.theme === 'dark' ? 'bg-[#0f172a] text-white border border-white/10' : 'bg-white text-slate-900 border border-slate-100'}`}>
            <div className="w-20 h-20 bg-mmsu-green text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-mmsu-green/20"><i className="fas fa-id-card text-3xl"></i></div>
            <h3 className="text-2xl font-black mb-2">Mentor Access</h3>
            <p className="text-sm opacity-50 mb-8 font-medium">Verify your official Student ID to unlock specialized AI Tutoring sessions.</p>
            <input className="w-full p-5 rounded-2xl text-center text-xl font-black tracking-[0.3em] border dark:border-white/10 dark:bg-white/5 mb-6 outline-none focus:ring-4 focus:ring-mmsu-gold/20" placeholder="YY-XXXXXX" autoFocus onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (/^\d{2}-\d{6}$/.test(val)) {
                  setUser(p => ({ ...p, studentId: val }));
                  setChatMode('TUTORING');
                  setShowLogin(false);
                }
              }
            }} />
            <div className="flex gap-4">
              <button onClick={() => setShowLogin(false)} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest opacity-40">Cancel</button>
              <button onClick={() => {
                 const inputVal = (document.querySelector('input[placeholder="YY-XXXXXX"]') as HTMLInputElement).value;
                 if (/^\d{2}-\d{6}$/.test(inputVal)) {
                    setUser(p => ({ ...p, studentId: inputVal }));
                    setChatMode('TUTORING');
                    setShowLogin(false);
                 }
              }} className="flex-2 bg-mmsu-green text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Verify ID</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255, 215, 0, 0.1); border-radius: 10px; }
        .chat-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255, 215, 0, 0.3); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .shadow-3xl { box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.4); }
        .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0, 0, 0, 0.7); }
      `}</style>
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
