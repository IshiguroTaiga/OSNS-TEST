
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
  type?: 'search' | 'maps';
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
  email: string;
  college: College;
  campus: Campus;
  isLoggedIn: boolean;
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
  { id: 'c1', code: 'AGRI 101', title: 'Fundamentals of Crop Science', college: 'College of Agriculture, Food and Sustainable Development', description: 'Basic principles of plant growth and management.', credits: 3 },
  { id: 'c3', code: 'AQUACUL 101', title: 'Introduction to Aquaculture', college: 'College of Aquatic Science and Applied Technology', description: 'Principles and practices of farming aquatic organisms.', credits: 3 },
  { id: 'c5', code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', description: 'Study of life and living organisms.', credits: 4 },
  { id: 'c7', code: 'ACCTG 101', title: 'Financial Accounting 1', college: 'College of Business, Economics and Accountancy', description: 'Principles and procedures of the accounting cycle.', credits: 3 },
  { id: 'c9', code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', description: 'Fundamental concepts of computer hardware and software.', credits: 3 },
  { id: 'c11', code: 'ENGG 101', title: 'Engineering Graphics', college: 'College of Engineering', description: 'Principles of drafting and visualization.', credits: 2 },
  { id: 'c13', code: 'NURS 101', title: 'Fundamentals of Nursing', college: 'College of Health Sciences', description: 'Basic nursing concepts and skills.', credits: 5 },
  { id: 'c15', code: 'AUTO 101', title: 'Automotive Technology', college: 'College of Industrial Technology', description: 'Principles of automotive maintenance and repair.', credits: 3 },
  { id: 'c16', code: 'EDUC 101', title: 'Child and Adolescent Development', college: 'College of Teacher Education', description: 'Phases of growth and development of students.', credits: 3 },
  { id: 'c17', code: 'MED 101', title: 'Gross Anatomy', college: 'College of Medicine', description: 'Detailed study of human structures.', credits: 8 },
  { id: 'c18', code: 'LAW 101', title: 'Constitutional Law 1', college: 'College of Law', description: 'Study of the Philippine Constitution.', credits: 4 },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'January 12, 2026', content: 'Final week for adding/dropping subjects. Please visit your college registrar.', category: 'Enrollment' },
  { id: 'a2', title: '2026 Scholarship Renewal', date: 'January 18, 2026', content: 'Submit your 1st Semester grades to the Office of Student Affairs for renewal.', category: 'Scholarship' },
  { id: 'a3', title: 'MMSU 48th Foundation Anniversary', date: 'January 20, 2026', content: 'Happy Foundation Day, Stallions! Join us for the grand celebration at the Sunken Garden.', category: 'Event' },
  { id: 'a5', title: 'Final Grade Encoding 1st Sem', date: 'December 20, 2025', content: 'All faculty must complete grade encoding by 11:59 PM tonight.', category: 'Academic' },
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
      You are the "MMSU Stallion AI Companion," the EXCLUSIVE academic assistant for Mariano Marcos State University (MMSU).
      The current date is January 20, 2026. This is the 2nd Semester of AY 2025-2026.

      STRICT OPERATIONAL CONSTRAINTS:
      1. SCOPE: Strictly MMSU-based. Politely decline non-university queries.
      2. LANGUAGE: Formal English only. Avoid using asterisks for bolding.
      3. TONE: Professional, academic, supportive.
      4. CONTEXT: User is from the ${college}.

      ${mode === 'TUTORING' && studentId ? `
      SPECIALIZED TUTORING PROTOCOL:
      - You are now acting as a "Stallion Academic Tutor" for Student ${studentId}.
      - Focus on academic support for ${college} specific courses.
      - Provide study tips and concept explanations.
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

    const text = response.text || "I apologize, but I am currently unable to process your inquiry.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links: GroundingLink[] = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'MMSU Reference',
        uri: chunk.web?.uri || '',
        type: 'search'
      }));

    return { text, links };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "University servers are busy. Please try again later." };
  }
};

// --- MAIN APP COMPONENT ---

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Welcome, Stallion! 🐎 How can I assist you with your studies today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>(() => {
    const saved = localStorage.getItem('stallion_vault_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('stallion_profile_v1');
    return saved ? JSON.parse(saved) : {
      name: 'Stallion Guest',
      email: '',
      college: 'College of Computing and Information Sciences',
      campus: 'Batac',
      isLoggedIn: false,
      theme: 'dark',
      studentId: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('stallion_profile_v1', JSON.stringify(user));
    localStorage.setItem('stallion_vault_v1', JSON.stringify(vaultFiles));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user, vaultFiles]);

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

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode === 'TUTORING' && !user.studentId) {
      setShowLogin(true);
    } else {
      setChatMode(newMode);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    const newFiles = uploaded.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type.split('/')[1]?.toUpperCase() || 'FILE',
      date: new Date().toLocaleDateString()
    }));
    setVaultFiles(prev => [...newFiles, ...prev]);
  };

  const renderHome = () => (
    <div className="space-y-8 animate-fadeIn">
      <section className="bg-gradient-to-br from-[#014421] via-[#003318] to-black text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-mmsu-gold/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-mmsu-gold/30">
            <span className="w-2 h-2 bg-mmsu-gold rounded-full animate-pulse"></span>
            <span className="text-mmsu-gold text-xs font-bold uppercase tracking-wider">2nd Semester Portal Active</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Agbiag, <span className="text-mmsu-gold block">Stallion {user.name.split(' ')[0]}!</span></h2>
          <p className="text-sm md:text-lg opacity-80 max-w-2xl font-medium">{user.college}</p>
          <div className="flex gap-4 pt-4">
            <button onClick={() => setActiveTab('chat')} className="bg-mmsu-gold text-mmsu-green px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl shadow-mmsu-gold/20 hover:scale-105 transition-all">Launch AI</button>
            <button onClick={() => window.open('https://mys.mmsu.edu.ph', '_blank')} className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-2xl font-black uppercase text-xs border border-white/20">View Portal</button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-5 text-[20rem] pointer-events-none"><i className="fas fa-horse-head"></i></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-black flex items-center gap-3 dark:text-white"><div className="w-1.5 h-6 bg-mmsu-green rounded-full"></div>Latest Notices</h3>
          <div className="grid gap-4">
            {MOCK_ANNOUNCEMENTS.map(ann => (
              <div key={ann.id} className="p-6 rounded-3xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${ann.category === 'Scholarship' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{ann.category}</span>
                  <span className="text-[10px] opacity-40 font-bold">{ann.date}</span>
                </div>
                <h4 className="font-bold text-lg dark:text-white">{ann.title}</h4>
                <p className="text-sm opacity-60 line-clamp-2 dark:text-slate-300">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-xl font-black flex items-center gap-3 dark:text-white"><div className="w-1.5 h-6 bg-mmsu-gold rounded-full"></div>Stallion Tools</h3>
          <div className="grid gap-3">
            {[
              { label: 'Official Site', icon: 'fa-globe', url: 'https://mmsu.edu.ph' },
              { label: 'MVLE Portal', icon: 'fa-graduation-cap', url: 'https://mvle4.mmsu.edu.ph' },
              { label: 'Student Portal', icon: 'fa-user-circle', url: 'https://mys.mmsu.edu.ph' }
            ].map(tool => (
              <button key={tool.label} onClick={() => window.open(tool.url, '_blank')} className="flex items-center gap-4 p-5 rounded-3xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-mmsu-green transition-all shadow-sm group">
                <div className="w-10 h-10 bg-mmsu-green text-white rounded-xl flex items-center justify-center shadow-lg shadow-mmsu-green/20 transition-transform group-hover:rotate-12"><i className={`fas ${tool.icon}`}></i></div>
                <span className="font-bold text-sm dark:text-white">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="h-[calc(100vh-250px)] min-h-[600px] flex flex-col bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-slate-700 animate-fadeIn">
      <div className={`px-8 py-5 flex items-center justify-between border-b dark:border-slate-700 transition-colors ${chatMode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl ${chatMode === 'TUTORING' ? 'bg-mmsu-green text-white' : 'bg-mmsu-gold text-mmsu-green'}`}>
            <i className={`fas ${chatMode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'} text-xl`}></i>
          </div>
          <div>
            <h3 className="font-black text-lg leading-none">{chatMode === 'TUTORING' ? 'Stallion Tutor' : 'Stallion AI Assistant'}</h3>
            <p className="text-[10px] font-black uppercase opacity-70 tracking-widest mt-1">Grounding Active</p>
          </div>
        </div>
        <div className="bg-black/10 p-1 rounded-2xl flex gap-1 border border-white/10">
          <button onClick={() => handleModeChange('GENERAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${chatMode === 'GENERAL' ? 'bg-white text-mmsu-green shadow-xl' : 'opacity-60'}`}>Assistant</button>
          <button onClick={() => handleModeChange('TUTORING')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${chatMode === 'TUTORING' ? 'bg-mmsu-green text-white shadow-xl' : 'opacity-60'}`}>Tutor</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        {chatMessages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[85%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-6 py-4 rounded-[2.5rem] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 rounded-tl-none'}`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.groundingLinks && m.groundingLinks.length > 0 && (
                  <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-3">
                    <span className="text-[9px] font-black uppercase opacity-40 tracking-widest block">Sources</span>
                    <div className="flex flex-wrap gap-2">
                      {m.groundingLinks.map((l, i) => (
                        <a key={i} href={l.uri} target="_blank" className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl text-[9px] font-black hover:scale-105 transition-transform">
                          <i className="fas fa-link opacity-30 text-[8px]"></i> <span className="truncate max-w-[120px]">{l.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[8px] font-black opacity-30 uppercase mt-2 px-4">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        {isTyping && <div className="flex gap-1.5 p-4"><div className="w-2 h-2 bg-mmsu-green dark:bg-mmsu-gold rounded-full animate-bounce"></div><div className="w-2 h-2 bg-mmsu-green dark:bg-mmsu-gold rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-mmsu-green dark:bg-mmsu-gold rounded-full animate-bounce delay-200"></div></div>}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
        <div className="flex flex-wrap gap-2 py-2 mb-2">
          {(chatMode === 'TUTORING' 
            ? [{ label: 'Study Tips', p: 'Provide study techniques for my major.' }, { label: 'Grading', p: 'What are MMSU grading rules?' }] 
            : [{ label: 'Enrollment', p: 'When is enrollment?' }, { label: 'Scholarship', p: 'List scholarships.' }]
          ).map((a, i) => (
            <button key={i} onClick={() => handleSendMessage(a.p)} className="px-4 py-2 border rounded-full text-[10px] font-bold dark:border-slate-700 dark:text-white hover:bg-mmsu-gold hover:text-mmsu-green transition-all">{a.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 pl-6 rounded-[2rem] border dark:border-slate-700 focus-within:ring-2 focus-within:ring-mmsu-green transition-all shadow-inner">
          <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm dark:text-white font-medium" placeholder="Ask Stallion Assistant..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
          <button onClick={() => handleSendMessage()} disabled={!input.trim() || isTyping} className="w-12 h-12 bg-mmsu-green text-white rounded-2xl shadow-xl shadow-mmsu-green/20 disabled:opacity-20 hover:scale-105 active:scale-95 transition-all"><i className="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-mmsu-gold/20 rounded-xl flex items-center justify-center text-mmsu-gold">
            <i className="fas fa-book text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black dark:text-white">Academic Catalog</h2>
            <p className="text-[10px] text-mmsu-green dark:text-mmsu-gold font-black uppercase tracking-widest">{user.college}</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 opacity-30 text-gray-500"></i>
          <input className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border dark:border-slate-700 focus:ring-2 focus:ring-mmsu-green dark:text-white font-medium" placeholder="Search courses..." />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_COURSES.filter(c => c.college === user.college).map(c => (
          <div key={c.id} className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700 hover:border-mmsu-gold transition-all shadow-sm group">
            <span className="bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold px-4 py-1.5 rounded-full text-[10px] font-black border border-mmsu-gold/20">{c.code}</span>
            <h4 className="mt-5 font-bold text-xl dark:text-white group-hover:text-mmsu-green dark:group-hover:text-mmsu-gold transition-colors">{c.title}</h4>
            <p className="mt-3 text-xs opacity-50 dark:text-slate-300 italic leading-relaxed">"{c.description}"</p>
            <div className="mt-8 pt-6 border-t dark:border-slate-700 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase opacity-40">{c.credits} Units</span>
              <button className="text-xs font-black text-mmsu-green dark:text-mmsu-gold hover:translate-x-1 transition-transform">Details <i className="fas fa-arrow-right ml-1"></i></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-mmsu-gold/20 rounded-xl flex items-center justify-center text-mmsu-gold">
            <i className="fas fa-folder-open text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black dark:text-white">Digital Vault</h2>
            <p className="text-[10px] text-mmsu-green dark:text-mmsu-gold font-black uppercase tracking-widest">Personal Storage</p>
          </div>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-mmsu-green text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-mmsu-green/20">Upload Document</button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vaultFiles.map(f => (
          <div key={f.id} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-mmsu-gold transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center font-black text-[9px] text-mmsu-green dark:text-mmsu-gold">{f.type}</div>
              <div className="overflow-hidden">
                <h5 className="font-bold text-xs truncate dark:text-white">{f.name}</h5>
                <p className="text-[9px] opacity-40 font-bold">{f.size} • {f.date}</p>
              </div>
            </div>
            <button className="mt-6 w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-[9px] font-black uppercase opacity-60 hover:opacity-100">Preview</button>
          </div>
        ))}
        {vaultFiles.length === 0 && <div className="col-span-full py-12 text-center border-2 border-dashed dark:border-slate-700 rounded-3xl opacity-30 font-black uppercase tracking-widest">No documents found</div>}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-300 ${user.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <header className={`sticky top-0 z-[100] border-b backdrop-blur-xl px-4 py-4 md:px-8 transition-all ${user.theme === 'dark' ? 'bg-slate-900/80 border-white/5' : 'bg-mmsu-green text-white'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 bg-mmsu-gold rounded-2xl flex items-center justify-center text-mmsu-green shadow-xl transform rotate-3">
              <i className="fas fa-horse-head text-xl"></i>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black uppercase tracking-tighter leading-none">MMSU Stallion</h1>
              <p className="text-[9px] text-mmsu-gold font-black uppercase tracking-[0.2em] mt-1">Academic Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setUser(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="p-3 rounded-2xl hover:bg-white/10 transition-all"><i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-lg`}></i></button>
            <div onClick={() => setShowSettings(true)} className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
              <div className="w-8 h-8 bg-mmsu-gold rounded-xl flex items-center justify-center text-mmsu-green font-black text-xs">{user.name[0]}</div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black opacity-50 leading-none">Profile</p>
                <span className="text-sm font-bold truncate max-w-[120px]">{user.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <nav 
          style={{ resize: 'horizontal', overflow: 'hidden' }}
          className="bg-white dark:bg-slate-800 rounded-[2rem] p-2 flex shadow-xl border dark:border-slate-700 sticky top-24 z-40 max-w-full min-w-[320px] mx-auto group relative"
        >
          {[
            { id: 'home', icon: 'fa-home', label: 'Home' },
            { id: 'chat', icon: 'fa-comment-dots', label: 'AI Chat' },
            { id: 'courses', icon: 'fa-book', label: 'Catalog' },
            { id: 'tutors', icon: 'fa-user-graduate', label: 'Mentor' },
            { id: 'files', icon: 'fa-folder-open', label: 'Vault' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as Tab)} className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-4 rounded-2xl transition-all ${activeTab === t.id ? 'bg-mmsu-green text-white dark:bg-mmsu-gold dark:text-mmsu-green font-black shadow-lg shadow-mmsu-green/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className={`fas ${t.icon} text-lg md:text-sm`}></i>
              <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap hidden sm:inline">{t.label}</span>
            </button>
          ))}
          {/* Resize Indicator */}
          <div className="absolute right-2 bottom-2 w-2 h-2 border-r-2 border-b-2 border-slate-300 opacity-20 pointer-events-none"></div>
        </nav>

        {activeTab === 'home' && renderHome()}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'files' && renderFiles()}
        {activeTab === 'tutors' && (
          <div className="space-y-12 py-10">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-mmsu-gold text-mmsu-green rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-2xl rotate-3"><i className="fas fa-user-graduate"></i></div>
              <h2 className="text-4xl md:text-6xl font-black dark:text-white leading-tight uppercase">Stallion Tutor</h2>
              <p className="max-w-xl mx-auto text-sm opacity-60 dark:text-slate-300">Specialized academic mentorship for {user.college}. Grounded in university data for precision.</p>
              <button onClick={() => { setChatMode('TUTORING'); setActiveTab('chat'); }} className="mt-8 px-10 py-5 bg-mmsu-green text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-mmsu-green/20 hover:scale-105 transition-transform">Initialize Mentor</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: 'fa-brain', title: 'Concept Logic', desc: 'Walkthroughs of complex academic theories.' },
                { icon: 'fa-search', title: 'Fact Checked', desc: 'Real-time grounding in university policies.' },
                { icon: 'fa-clock', title: 'Always Open', desc: 'Expert help available 24/7, including holidays.' }
              ].map(f => (
                <div key={f.title} className="p-10 bg-white dark:bg-slate-800 rounded-[3rem] border dark:border-slate-700 shadow-sm text-center">
                  <div className="w-14 h-14 bg-mmsu-green text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl"><i className={`fas ${f.icon} text-xl`}></i></div>
                  <h4 className="font-black text-lg mb-3 dark:text-white uppercase tracking-tighter">{f.title}</h4>
                  <p className="text-xs opacity-50 dark:text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`p-10 rounded-[3rem] w-full max-w-xl shadow-4xl transform transition-all border ${user.theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black tracking-tighter">Student Profile</h3>
              <button onClick={() => setShowSettings(false)} className="w-12 h-12 rounded-full hover:bg-slate-500/10 flex items-center justify-center transition-all"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Full Name</label>
                <input className={`w-full p-5 rounded-2xl border font-bold text-lg outline-none transition-all ${user.theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-mmsu-gold' : 'bg-slate-50 border-slate-200 focus:border-mmsu-green'}`} value={user.name} onChange={e => setUser(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">College Faculty</label>
                <select className={`w-full p-5 rounded-2xl border font-bold outline-none transition-all ${user.theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} value={user.college} onChange={e => setUser(p => ({ ...p, college: e.target.value as College }))}>
                  {COLLEGES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Student ID</label>
                  <input className={`w-full p-5 rounded-2xl border font-black tracking-widest outline-none transition-all text-center ${user.theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-mmsu-gold' : 'bg-slate-50 border-slate-200 focus:border-mmsu-green'}`} value={user.studentId} onChange={e => setUser(p => ({ ...p, studentId: e.target.value }))} placeholder="YY-XXXXXX" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Campus</label>
                  <select className={`w-full p-5 rounded-2xl border font-bold outline-none transition-all ${user.theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} value={user.campus} onChange={e => setUser(p => ({ ...p, campus: e.target.value as Campus }))}>
                    <option value="Batac">Batac</option>
                    <option value="Laoag">Laoag</option>
                    <option value="Currimao">Currimao</option>
                    <option value="Dingras">Dingras</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-12 w-full py-5 bg-mmsu-green text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl">Save Changes</button>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[210] p-4">
          <div className={`p-8 rounded-[2.5rem] w-full max-w-md ${user.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <h3 className="text-2xl font-black mb-2 text-center">Tutoring Access</h3>
            <p className="text-sm text-center mb-6 opacity-60">Enter your Student ID to unlock specialized tutoring.</p>
            <input className="w-full p-4 rounded-2xl text-center text-xl font-black tracking-widest border mb-4" placeholder="YY-XXXXXX" onChange={e => {
              if (/^\d{2}-\d{6}$/.test(e.target.value)) {
                setUser(p => ({ ...p, studentId: e.target.value }));
                setChatMode('TUTORING');
                setShowLogin(false);
              }
            }} />
            <button onClick={() => setShowLogin(false)} className="w-full py-4 font-bold opacity-50">Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .shadow-4xl { box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.6); }
        nav { resize: horizontal; overflow: hidden; }
      `}</style>
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
