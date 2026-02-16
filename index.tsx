
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
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
type Tab = 'chat' | 'courses' | 'tutors' | 'home';

interface GroundingLink {
  title: string;
  uri: string;
  type?: 'search' | 'maps';
}

interface Course {
  id: string;
  code: string;
  title: string;
  college: College;
  description: string;
  credits: number;
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
const GET_SYSTEM_INSTRUCTION = (mode: ChatMode, college?: string, studentId?: string) => {
  const base = `
You are the "MMSU Stallion AI Companion," the EXCLUSIVE academic assistant for Mariano Marcos State University (MMSU).
Current date: January 20, 2026 (2nd Semester AY 2025-2026).

CONSTRAINTS:
1. SCOPE: Strictly MMSU-related. Decline non-university queries politely.
2. LANGUAGE: Formal English, no asterisks for bolding.
3. TONE: Professional, supportive, academic.
4. CONTEXT: User is from ${college || 'General MMSU'}.

KNOWLEDGE:
- Campuses: Batac (Main), Laoag, Currimao, Dingras.
- Vision: A premier Philippine university by 2028.
- Motto: Knowledge for the service of the people.
`;

  if (mode === 'TUTORING' && studentId) {
    return `${base}
TUTORING PROTOCOL:
- Role: Stallion Academic Tutor for Student ${studentId}.
- Focus: Explaining complex concepts in ${college} curriculum.
- Guideline: Provide study tips and policy guidance for AY 2025-2026.
`;
  }
  return base;
};

const getAIResponse = async (
  prompt: string, 
  college: string,
  mode: ChatMode = 'GENERAL',
  studentId?: string,
  history?: Array<{role: 'user' | 'assistant', content: string}>
): Promise<{ text: string; links?: GroundingLink[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        systemInstruction: GET_SYSTEM_INSTRUCTION(mode, college, studentId),
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
    return { text: "University servers are busy. Please try again later." };
  }
};

// --- COMPONENTS ---

const LoginModal = ({ onLogin, onClose, isDark }: { onLogin: (id: string) => void, onClose: () => void, isDark: boolean }) => {
  const [id, setId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{2}-\d{6}$/.test(id)) {
      setError('Invalid format (YY-XXXXXX)');
      return;
    }
    onLogin(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className={`p-8 rounded-[2.5rem] w-full max-w-md ${isDark ? 'bg-slate-800 text-white' : 'bg-white'}`}>
        <h3 className="text-2xl font-black mb-2 text-center">Student Access</h3>
        <p className="text-sm text-center mb-6 opacity-60">Enter your Student Number for tutoring mode.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            className={`w-full p-4 rounded-2xl text-center text-xl font-black tracking-widest border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
            value={id} onChange={e => setId(e.target.value)} placeholder="YY-XXXXXX"
          />
          {error && <p className="text-red-500 text-[10px] text-center font-bold uppercase">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold uppercase opacity-50">Cancel</button>
            <button type="submit" className="flex-1 py-4 bg-mmsu-green text-white rounded-2xl font-bold uppercase">Verify</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsModal = ({ user, onUpdate, onClose }: { user: UserProfile, onUpdate: (u: Partial<UserProfile>) => void, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-4">
      <div className={`p-8 rounded-[2.5rem] w-full max-w-lg ${user.theme === 'dark' ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black">Student Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-full"><i className="fas fa-times"></i></button>
        </div>
        <div className="space-y-4">
          <input className={`w-full p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} placeholder="Name" value={user.name} onChange={e => onUpdate({ name: e.target.value })} />
          <input className={`w-full p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} placeholder="Student ID (YY-XXXXXX)" value={user.studentId} onChange={e => onUpdate({ studentId: e.target.value })} />
          <select className={`w-full p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} value={user.college} onChange={e => onUpdate({ college: e.target.value as College })}>
            {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={`w-full p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} value={user.campus} onChange={e => onUpdate({ campus: e.target.value as Campus })}>
            <option value="Batac">Batac</option>
            <option value="Laoag">Laoag</option>
            <option value="Currimao">Currimao</option>
            <option value="Dingras">Dingras</option>
          </select>
        </div>
        <button onClick={onClose} className="w-full mt-6 py-4 bg-mmsu-green text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Save Profile</button>
      </div>
    </div>
  );
};

const Header = ({ user, onUpdate, onSettings, onToggleTheme }: { user: UserProfile, onUpdate: (u: Partial<UserProfile>) => void, onSettings: () => void, onToggleTheme: () => void }) => {
  const isDark = user.theme === 'dark';
  return (
    <header className={`${isDark ? 'bg-mmsu-darkGreen' : 'bg-mmsu-green'} text-white sticky top-0 z-50 border-b border-mmsu-gold/20 px-4 py-3 shadow-md`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green"><i className="fas fa-horse-head"></i></div>
          <div className="hidden sm:block">
            <h1 className="font-black text-lg leading-none">MMSU STALLION</h1>
            <span className="text-[9px] text-mmsu-gold uppercase tracking-widest font-black">AI Academic Companion</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select className="hidden md:block bg-white/10 text-[10px] font-bold p-2 rounded-xl border-none" value={user.college} onChange={e => onUpdate({ college: e.target.value as College })}>
            {COLLEGES.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
          </select>
          <div className="flex items-center space-x-2">
            <button onClick={onToggleTheme} className="p-2 hover:bg-white/10 rounded-full transition-colors"><i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i></button>
            <button onClick={onSettings} className="w-10 h-10 border-2 border-mmsu-gold/30 rounded-full flex items-center justify-center hover:border-mmsu-gold"><i className="fas fa-user-circle"></i></button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Navigation = ({ activeTab, onTabChange }: { activeTab: Tab, onTabChange: (t: Tab) => void }) => {
  const tabs: { id: Tab, icon: string, label: string }[] = [
    { id: 'home', icon: 'fa-home', label: 'Home' },
    { id: 'chat', icon: 'fa-comments', label: 'AI Chat' },
    { id: 'courses', icon: 'fa-book', label: 'Catalog' },
    { id: 'tutors', icon: 'fa-graduation-cap', label: 'Tutor' },
  ];
  return (
    <nav className="bg-white dark:bg-slate-800 rounded-3xl p-1.5 flex shadow-sm border border-slate-200 dark:border-slate-700">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTabChange(t.id)} className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl transition-all ${activeTab === t.id ? 'bg-mmsu-green text-white dark:bg-mmsu-gold dark:text-mmsu-green font-black shadow-lg shadow-mmsu-green/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
          <i className={`fas ${t.icon} text-sm`}></i>
          <span className="hidden md:block text-[10px] uppercase tracking-widest">{t.label}</span>
        </button>
      ))}
    </nav>
  );
};

const HomePage = ({ user, onNavigateChat }: { user: UserProfile, onNavigateChat: () => void }) => {
  const isDark = user.theme === 'dark';
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-br from-mmsu-green to-mmsu-darkGreen text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="bg-white/10 border border-white/20 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Academic Year 2025-2026</div>
          <h2 className="text-4xl md:text-6xl font-black mb-4">Welcome back,<br/><span className="text-mmsu-gold">Stallion {user.name.split(' ')[0]}</span></h2>
          <p className="opacity-80 max-w-lg mb-8 text-sm md:text-base">{user.college}</p>
          <div className="flex gap-4">
            <button onClick={onNavigateChat} className="bg-mmsu-gold text-mmsu-green px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl shadow-black/20 hover:scale-105 transition-transform">Get Started</button>
            <button className="bg-white/10 px-8 py-3 rounded-2xl font-black uppercase text-xs backdrop-blur-md">View Portal</button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-[20rem]"><i className="fas fa-horse-head"></i></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-black flex items-center gap-3 px-2 dark:text-white"><div className="w-1.5 h-6 bg-mmsu-green rounded-full"></div>Latest Notices</h3>
          <div className="grid gap-4">
            {MOCK_ANNOUNCEMENTS.map(ann => (
              <div key={ann.id} className={`p-6 rounded-3xl border transition-all hover:shadow-lg ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${ann.category === 'Scholarship' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{ann.category}</span>
                  <span className="text-[10px] opacity-40 font-bold">{ann.date}</span>
                </div>
                <h4 className="font-bold text-lg mb-2 dark:text-white">{ann.title}</h4>
                <p className="text-sm opacity-60 line-clamp-2 dark:text-slate-300">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-black flex items-center gap-3 px-2 dark:text-white"><div className="w-1.5 h-6 bg-mmsu-gold rounded-full"></div>Quick Tools</h3>
          <div className="grid gap-3">
            {[
              { icon: 'fa-globe', label: 'Official Website', url: 'https://mmsu.edu.ph' },
              { icon: 'fa-graduation-cap', label: 'MVLE Portal', url: 'https://mvle4.mmsu.edu.ph' },
              { icon: 'fa-user-graduate', label: 'Student Dashboard', url: 'https://mys.mmsu.edu.ph' }
            ].map(tool => (
              <button key={tool.label} onClick={() => window.open(tool.url, '_blank')} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all hover:border-mmsu-green ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="w-10 h-10 bg-mmsu-green text-white rounded-xl flex items-center justify-center shadow-lg shadow-mmsu-green/20"><i className={`fas ${tool.icon}`}></i></div>
                <span className="font-bold text-sm">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CoursePage = ({ selectedCollege }: { selectedCollege: College }) => {
  const [query, setQuery] = useState('');
  const filtered = MOCK_COURSES.filter(c => c.college === selectedCollege && (c.code.includes(query.toUpperCase()) || c.title.toLowerCase().includes(query.toLowerCase())));
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black dark:text-white">Course Catalog</h2>
          <p className="text-[10px] text-mmsu-green dark:text-mmsu-gold font-black uppercase tracking-widest">{selectedCollege}</p>
        </div>
        <div className="relative w-full md:w-80">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 opacity-30"></i>
          <input className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-mmsu-green dark:text-white" placeholder="Search code or title..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => (
          <div key={c.id} className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] border dark:border-slate-700 hover:border-mmsu-gold transition-all shadow-sm">
            <span className="bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold px-3 py-1 rounded-full text-[10px] font-black">{c.code}</span>
            <h4 className="mt-4 font-bold text-lg dark:text-white">{c.title}</h4>
            <p className="mt-2 text-xs opacity-50 dark:text-slate-300 italic">"{c.description}"</p>
            <div className="mt-6 pt-6 border-t dark:border-slate-700 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase opacity-40">{c.credits} Units</span>
              <button className="text-xs font-black text-mmsu-green dark:text-mmsu-gold">Details <i className="fas fa-chevron-right ml-1"></i></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChatPage = ({ user, mode, onModeChange }: { user: UserProfile, mode: ChatMode, onModeChange: (m: ChatMode) => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: `Hello, Stallion! I am your academic AI. How can I assist you with your ${user.college} studies today?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, isTyping]);

  const handleSend = async (txt?: string) => {
    const val = txt || input;
    if (!val.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: val, timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setIsTyping(true);
    const res = await getAIResponse(val, user.college, mode, user.studentId, messages.map(m => ({ role: m.role, content: m.content })));
    setIsTyping(false);
    setMessages(p => [...p, { id: (Date.now()+1).toString(), role: 'assistant', content: res.text, timestamp: new Date(), groundingLinks: res.links }]);
  };

  return (
    <div className="h-[calc(100vh-250px)] min-h-[600px] flex flex-col bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-slate-700 animate-fadeIn">
      <div className={`p-6 flex items-center justify-between border-b dark:border-slate-700 ${mode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i className={`fas ${mode === 'TUTORING' ? 'fa-graduation-cap' : 'fa-robot'}`}></i></div>
          <div>
            <h3 className="font-black leading-none">{mode === 'TUTORING' ? 'AI Tutor Room' : 'Stallion Assistant'}</h3>
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{mode === 'TUTORING' ? 'Academic Tutoring' : 'General Support'}</span>
          </div>
        </div>
        <div className="bg-black/10 p-1 rounded-xl flex gap-1">
          <button onClick={() => onModeChange('GENERAL')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${mode === 'GENERAL' ? 'bg-white text-mmsu-green shadow' : 'opacity-60'}`}>General</button>
          <button onClick={() => { if(!user.studentId) setShowLogin(true); else onModeChange('TUTORING'); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${mode === 'TUTORING' ? 'bg-mmsu-green text-white shadow' : 'opacity-60'}`}>Tutor</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-6 py-4 rounded-[2rem] text-sm shadow-sm ${m.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 rounded-tl-none'}`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.groundingLinks && m.groundingLinks.length > 0 && (
                  <div className="mt-4 pt-4 border-t dark:border-slate-700">
                    <span className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">Sources</span>
                    <div className="flex flex-wrap gap-2">
                      {m.groundingLinks.map((l, i) => (
                        <a key={i} href={l.uri} target="_blank" className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl text-[9px] font-black hover:scale-105 transition-transform">
                          <i className="fas fa-link opacity-30"></i> <span className="truncate max-w-[120px]">{l.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[8px] font-bold opacity-30 uppercase mt-2 px-4">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        {isTyping && <div className="flex gap-1.5 p-4"><div className="w-1.5 h-1.5 bg-mmsu-green rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-mmsu-green rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-mmsu-green rounded-full animate-bounce delay-200"></div></div>}
        <div ref={endRef} />
      </div>

      <div className="p-6 border-t dark:border-slate-700">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {(mode === 'GENERAL' ? ['Enrollment dates?', 'Scholarships?', 'Batac campus landmarks?'] : ['Study tips?', 'Grading policy?', 'Thesis help?']).map(q => (
            <button key={q} onClick={() => handleSend(q)} className="whitespace-nowrap px-4 py-2 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-full text-[10px] font-bold hover:bg-mmsu-gold transition-colors">{q}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 pl-6 rounded-2xl border dark:border-slate-700">
          <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm dark:text-white" placeholder="Type your message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
          <button onClick={() => handleSend()} className="w-10 h-10 bg-mmsu-green text-white rounded-xl shadow-lg shadow-mmsu-green/20"><i className="fas fa-paper-plane"></i></button>
        </div>
      </div>
      {showLogin && <LoginModal onLogin={id => { user.studentId = id; onModeChange('TUTORING'); setShowLogin(false); }} onClose={() => setShowLogin(false)} isDark={user.theme === 'dark'} />}
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [user, setUser] = useState<UserProfile>(() => {
    const s = localStorage.getItem('stallion_profile');
    return s ? JSON.parse(s) : { name: 'Guest', college: 'College of Computing and Information Sciences', campus: 'Batac', theme: 'dark', studentId: '' };
  });

  useEffect(() => {
    localStorage.setItem('stallion_profile', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  return (
    <div className={`min-h-screen pb-20 md:pb-8 ${user.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header user={user} onUpdate={u => setUser(p => ({ ...p, ...u }))} onSettings={() => setShowSettings(true)} onToggleTheme={() => setUser(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'home' && <HomePage user={user} onNavigateChat={() => setActiveTab('chat')} />}
        {activeTab === 'chat' && <ChatPage user={user} mode={chatMode} onModeChange={setChatMode} />}
        {activeTab === 'courses' && <CoursePage selectedCollege={user.college} />}
        {activeTab === 'tutors' && (
          <div className="space-y-12 py-10">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-mmsu-gold text-mmsu-green rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-2xl rotate-3"><i className="fas fa-robot"></i></div>
              <h2 className="text-4xl md:text-6xl font-black dark:text-white leading-tight">Stallion AI Tutor</h2>
              <p className="max-w-xl mx-auto text-sm opacity-60 dark:text-slate-300">Specialized academic mentorship for {user.college}. Grounded in university datasets to ensure precision and academic integrity.</p>
              <button onClick={() => { setChatMode('TUTORING'); setActiveTab('chat'); }} className="mt-8 px-10 py-4 bg-mmsu-green text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-mmsu-green/20 hover:scale-105 transition-transform">Enter Tutor Room</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: 'fa-brain', title: 'Deep Logic', desc: 'Explains complex formulas and concepts step-by-step.' },
                { icon: 'fa-search', title: 'Live Search', desc: 'Verifies current university policies in real-time.' },
                { icon: 'fa-clock', title: '24/7 Access', desc: 'Expert tutoring available even during holiday breaks.' }
              ].map(f => (
                <div key={f.title} className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700 shadow-sm text-center">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 text-mmsu-green dark:text-mmsu-gold rounded-xl flex items-center justify-center mx-auto mb-6"><i className={`fas ${f.icon}`}></i></div>
                  <h4 className="font-bold mb-2 dark:text-white">{f.title}</h4>
                  <p className="text-xs opacity-50 dark:text-slate-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      {showSettings && <SettingsModal user={user} onUpdate={u => setUser(p => ({ ...p, ...u }))} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
