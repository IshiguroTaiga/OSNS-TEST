import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES & INTERFACES ---

type Campus = 'Batac' | 'Laoag' | 'Currimao' | 'Dingras';
type Tab = 'home' | 'chat' | 'courses' | 'tutors';
type ChatMode = 'GENERAL' | 'TUTORING';

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

interface UserProfile {
  name: string;
  email: string;
  college: College;
  campus: Campus;
  isLoggedIn: boolean;
  theme: 'light' | 'dark';
  studentId?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  groundingLinks?: Array<{ title: string; uri: string }>;
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
  { id: 'c5', code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', description: 'Study of life and living organisms.', credits: 4 },
  { id: 'c7', code: 'ACCTG 101', title: 'Financial Accounting 1', college: 'College of Business, Economics and Accountancy', description: 'Principles and procedures of the accounting cycle.', credits: 3 },
  { id: 'c9', code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', description: 'Fundamental concepts of computer hardware and software.', credits: 3 },
  { id: 'c10', code: 'CMPSC 146', title: 'Software Engineering', college: 'College of Computing and Information Sciences', description: 'Systematic approach to software development.', credits: 3 },
  { id: 'c12', code: 'CE 201', title: 'Statics of Rigid Bodies', college: 'College of Engineering', description: 'Analysis of force systems in equilibrium.', credits: 3 },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'January 12, 2026', content: 'Final week for adding/dropping subjects. Please visit your college registrar.', category: 'Enrollment' },
  { id: 'a2', title: '2026 Scholarship Renewal', date: 'January 18, 2026', content: 'Submit your 1st Semester grades to the Office of Student Affairs for renewal.', category: 'Scholarship' },
  { id: 'a3', title: 'MMSU 48th Foundation Anniversary', date: 'January 20, 2026', content: 'Happy Foundation Day, Stallions! Join us for the grand celebration at the Sunken Garden.', category: 'Event' },
];

// --- AI SERVICE ---

async function getAIResponse(
  prompt: string, 
  college: string,
  mode: ChatMode = 'GENERAL',
  studentId?: string,
  history?: Array<{role: 'user' | 'assistant', content: string}>
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      You are the "MMSU Stallion AI Companion," the EXCLUSIVE academic assistant for Mariano Marcos State University (MMSU).
      The current date is January 20, 2026. This is the 2nd Semester of AY 2025-2026.

      STRICT OPERATIONAL CONSTRAINTS:
      1. SCOPE: Strictly MMSU-based. Politely decline non-university queries with: "As the Stallion AI, my primary function is limited to serving the MMSU community."
      2. LANGUAGE: Formal English only. Avoid using any asterisks (*).
      3. TONE: Professional, academic, supportive.
      4. CONTEXT: User is from the ${college}.
      ${mode === 'TUTORING' ? `TUTORING MODE: You are acting as a specialized tutor for student ID ${studentId || 'N/A'}. Focus on deep explanations.` : ''}
    `;

    const contents = history?.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || ''
      })) || [];

    return { text: response.text || "I'm sorry, I couldn't generate a response.", links };
  } catch (error) {
    console.error("AI Error:", error);
    return { text: "The stallion network is busy. Please try again later.", links: [] };
  }
}

// --- SUB-COMPONENTS ---

const Header = ({ user, onCollegeChange, onOpenSettings, toggleTheme }: any) => (
  <header className="bg-mmsu-green text-white sticky top-0 z-50 shadow-lg border-b border-mmsu-gold/30">
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green font-bold text-2xl shadow-inner">
          <i className="fas fa-horse"></i>
        </div>
        <div>
          <h1 className="font-extrabold text-xl leading-none uppercase">MMSU Stallion</h1>
          <p className="text-[10px] text-mmsu-gold uppercase tracking-[0.2em] font-bold">Companion</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <select 
          value={user.college}
          onChange={(e) => onCollegeChange(e.target.value)}
          className="hidden md:block text-xs bg-white/10 p-2 rounded-lg border-none focus:ring-2 focus:ring-mmsu-gold text-white"
        >
          {COLLEGES.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
        </select>
        <button onClick={toggleTheme} className="p-2 hover:bg-white/10 rounded-full">
          <i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
        <button onClick={onOpenSettings} className="w-10 h-10 rounded-full border border-mmsu-gold/50 flex items-center justify-center bg-white/10">
          <i className="fas fa-user"></i>
        </button>
      </div>
    </div>
  </header>
);

const Home = ({ user, onNavigateToChat }: any) => (
  <div className="space-y-8 animate-fadeIn">
    <section className="bg-gradient-to-br from-mmsu-green to-mmsu-darkGreen text-white p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden border border-white/10">
      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center space-x-2 bg-mmsu-gold/20 px-4 py-1.5 rounded-full border border-mmsu-gold/30">
          <span className="w-2 h-2 bg-mmsu-gold rounded-full animate-pulse"></span>
          <span className="text-mmsu-gold text-xs font-bold uppercase tracking-wider">Active Semester</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
          Rise Higher, <span className="text-mmsu-gold block mt-1">Stallion {user.name.split(' ')[0]}!</span>
        </h2>
        <p className="text-sm opacity-90 max-w-2xl font-medium">You are viewing the dashboard for the <span className="bg-white/10 px-2 py-0.5 rounded text-mmsu-gold">{user.college}</span></p>
        <button onClick={onNavigateToChat} className="bg-mmsu-gold text-mmsu-green px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Launch Assistant</button>
      </div>
      <i className="fas fa-graduation-cap absolute top-0 right-0 text-[15rem] opacity-5 -rotate-12 transform translate-x-20"></i>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h3 className="text-xl font-black flex items-center dark:text-white">
          <span className="w-1.5 h-6 bg-mmsu-green rounded-full mr-3"></span> Bulletins
        </h3>
        <div className="grid gap-4">
          {MOCK_ANNOUNCEMENTS.map(ann => (
            <div key={ann.id} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold font-bold uppercase">{ann.category}</span>
                <span className="text-[10px] text-gray-400">{ann.date}</span>
              </div>
              <h4 className="font-bold dark:text-white mb-2">{ann.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{ann.content}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <h3 className="text-xl font-black flex items-center dark:text-white">
          <span className="w-1.5 h-6 bg-mmsu-gold rounded-full mr-3"></span> Tools
        </h3>
        <div className="grid gap-4">
          {[
            { icon: 'fa-globe-asia', label: 'Official Site', url: 'https://mmsu.edu.ph' },
            { icon: 'fa-graduation-cap', label: 'MVLE', url: 'https://mvle4.mmsu.edu.ph' },
            { icon: 'fa-user-circle', label: 'Student Portal', url: 'https://mys.mmsu.edu.ph' },
          ].map(tool => (
            <button key={tool.label} onClick={() => window.open(tool.url, '_blank')} className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-mmsu-gold transition-all group">
              <div className="w-10 h-10 bg-mmsu-green text-white rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <i className={`fas ${tool.icon}`}></i>
              </div>
              <span className="font-bold text-sm dark:text-white">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AIChat = ({ college, studentId, mode, onModeChange, isDark }: any) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: `Welcome, Stallion! 🐎 I'm your academic assistant for ${college}. How can I help you today?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const val = text || input;
    if (!val.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: val, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const res = await getAIResponse(val, college, mode, studentId, history);

    setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: res.text, timestamp: new Date(), groundingLinks: res.links }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className={`px-6 py-4 flex items-center justify-between ${mode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}`}>
        <div className="flex items-center space-x-3">
          <i className={`fas ${mode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'} text-xl`}></i>
          <span className="font-black uppercase text-sm">{mode === 'TUTORING' ? 'Tutor Room' : 'Stallion Assistant'}</span>
        </div>
        <div className="flex bg-black/10 p-1 rounded-xl">
          <button onClick={() => onModeChange('GENERAL')} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${mode === 'GENERAL' ? 'bg-white text-mmsu-green' : 'text-white/70'}`}>Assistant</button>
          <button onClick={() => onModeChange('TUTORING')} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${mode === 'TUTORING' ? 'bg-white text-mmsu-green' : 'text-white/70'}`}>Tutor</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[85%] p-4 rounded-3xl ${m.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-white rounded-tl-none border border-gray-100 dark:border-slate-700'}`}>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              {m.groundingLinks && m.groundingLinks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-[8px] font-black uppercase opacity-50 mb-2">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {m.groundingLinks.map((l, i) => (
                      <a key={i} href={l.uri} target="_blank" className="text-[9px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-bold flex items-center gap-1">
                        <i className="fas fa-link scale-75"></i> {l.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-xs text-gray-400 italic">Thinking...</div>}
        <div ref={endRef} />
      </div>
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything..."
          className="flex-1 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-4 text-sm focus:ring-2 focus:ring-mmsu-green dark:text-white"
        />
        <button onClick={() => handleSend()} className="w-12 h-12 bg-mmsu-green text-white rounded-2xl flex items-center justify-center">
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('stallion_profile');
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
    localStorage.setItem('stallion_profile', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home user={user} onNavigateToChat={() => setActiveTab('chat')} />;
      case 'chat': return <AIChat college={user.college} studentId={user.studentId} mode={chatMode} onModeChange={setChatMode} isDark={user.theme === 'dark'} />;
      case 'courses': return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {MOCK_COURSES.map(c => (
            <div key={c.id} className="p-6 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-[10px] font-black bg-mmsu-gold/20 text-mmsu-green px-2 py-1 rounded">{c.code}</span>
              <h4 className="font-bold mt-4 dark:text-white">{c.title}</h4>
              <p className="text-xs text-gray-500 mt-2 italic">"{c.description}"</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold uppercase text-gray-400">
                <span>{c.credits} Credits</span>
                <span className="text-mmsu-green">Details <i className="fas fa-chevron-right ml-1"></i></span>
              </div>
            </div>
          ))}
        </div>
      );
      case 'tutors': return (
        <div className="max-w-4xl mx-auto p-12 bg-mmsu-darkGreen rounded-[3rem] text-center text-white space-y-8 animate-fadeIn shadow-2xl">
          <i className="fas fa-robot text-7xl text-mmsu-gold"></i>
          <h2 className="text-4xl font-black">AI Stallion Tutor Room</h2>
          <p className="text-mmsu-gold/80 max-w-xl mx-auto">Access 24/7 academic deep-dives and concept explanations grounded in MMSU curriculum data.</p>
          <button onClick={() => { setChatMode('TUTORING'); setActiveTab('chat'); }} className="bg-white text-mmsu-green px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Start Tutoring Session</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${user.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header 
        user={user} 
        onCollegeChange={(c: College) => setUser({...user, college: c})}
        onOpenSettings={() => setShowSettings(true)}
        toggleTheme={() => setUser({...user, theme: user.theme === 'dark' ? 'light' : 'dark'})}
      />
      
      <main className="max-w-7xl mx-auto px-4 pt-8">
        <nav className="mb-8 flex justify-between bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          {[
            { id: 'home', icon: 'fa-home', label: 'Home' },
            { id: 'chat', icon: 'fa-comments', label: 'AI Chat' },
            { id: 'courses', icon: 'fa-book', label: 'Catalog' },
            { id: 'tutors', icon: 'fa-user-graduate', label: 'AI Tutor' },
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`flex-1 flex flex-col items-center py-3 rounded-2xl transition-all ${activeTab === t.id ? 'bg-mmsu-green text-white shadow-lg' : 'text-gray-400 hover:text-mmsu-green'}`}
            >
              <i className={`fas ${t.icon} text-lg mb-1`}></i>
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{t.label}</span>
            </button>
          ))}
        </nav>

        {renderContent()}
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] max-w-md w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-6">
            <h3 className="text-2xl font-black dark:text-white">Profile Settings</h3>
            <div className="space-y-4">
              <input 
                placeholder="Name" 
                value={user.name} 
                onChange={e => setUser({...user, name: e.target.value})} 
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 dark:text-white border-none"
              />
              <input 
                placeholder="Student ID (YY-XXXXXX)" 
                value={user.studentId} 
                onChange={e => setUser({...user, studentId: e.target.value})} 
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 dark:text-white border-none font-black tracking-widest"
              />
              <select 
                value={user.campus} 
                onChange={e => setUser({...user, campus: e.target.value as Campus})}
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 dark:text-white border-none"
              >
                <option value="Batac">Batac</option>
                <option value="Laoag">Laoag</option>
                <option value="Currimao">Currimao</option>
                <option value="Dingras">Dingras</option>
              </select>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full bg-mmsu-green text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Save & Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
