import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
type Campus = 'Batac' | 'Laoag' | 'Currimao' | 'Dingras';
type ChatMode = 'GENERAL' | 'TUTORING';
type Tab = 'home' | 'chat' | 'courses' | 'tutors';

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
  college: College;
  campus: Campus;
  studentId: string;
  theme: 'light' | 'dark';
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

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'January 12, 2026', content: 'Final week for adding/dropping subjects. Please visit your college registrar.', category: 'Enrollment' },
  { id: 'a2', title: '2026 Scholarship Renewal', date: 'January 18, 2026', content: 'Submit your 1st Semester grades to the Office of Student Affairs for renewal.', category: 'Scholarship' },
  { id: 'a3', title: 'MMSU 48th Foundation Anniversary', date: 'January 20, 2026', content: 'Happy Foundation Day, Stallions! Join us for the grand celebration at the Sunken Garden.', category: 'Event' },
  { id: 'a4', title: 'Luzon-wide Student Summit 2026', date: 'January 05, 2026', content: 'MMSU delegates orientation at the CIT Amphitheater.', category: 'Event' },
];

const MOCK_COURSES: Course[] = [
  { id: 'c9', code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', description: 'Fundamental concepts of computer hardware and software.', credits: 3 },
  { id: 'c10', code: 'CMPSC 146', title: 'Software Engineering', college: 'College of Computing and Information Sciences', description: 'Systematic approach to software development.', credits: 3 },
  { id: 'c12', code: 'CE 201', title: 'Statics of Rigid Bodies', college: 'College of Engineering', description: 'Analysis of force systems in equilibrium.', credits: 3 },
  { id: 'c5', code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', description: 'Study of life and living organisms.', credits: 4 },
  { id: 'c7', code: 'ACCTG 101', title: 'Financial Accounting 1', college: 'College of Business, Economics and Accountancy', description: 'Principles and procedures of the accounting cycle.', credits: 3 },
  { id: 'c11', code: 'ENGG 101', title: 'Engineering Graphics', college: 'College of Engineering', description: 'Principles of drafting and visualization.', credits: 2 },
];

// --- MAIN APP ---
const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mmsu_stallion_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Stallion Guest',
      college: 'College of Computing and Information Sciences',
      campus: 'Batac',
      studentId: '',
      theme: 'light'
    };
  });

  useEffect(() => {
    localStorage.setItem('mmsu_stallion_profile', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  const toggleTheme = () => setUser(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  const handleUpdateUser = (updates: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="glass-header text-white sticky top-0 z-50 border-b border-mmsu-gold/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 bg-mmsu-gold rounded-xl flex items-center justify-center text-mmsu-green shadow-lg shadow-black/20 transform group-hover:rotate-6 transition-transform">
              <i className="fas fa-horse-head text-lg"></i>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-lg tracking-tight uppercase leading-none">MMSU Stallion</h1>
              <p className="text-[10px] text-mmsu-gold uppercase font-bold tracking-[0.2em]">Academic Companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
             <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-white/10 transition-colors" title="Toggle Theme">
                <i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
             </button>
             <button onClick={() => setShowSettings(true)} className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 p-1.5 pr-4 rounded-full border border-white/10 transition-all shadow-inner">
                <div className="w-8 h-8 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green font-black text-sm uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-bold hidden sm:inline">{user.name.split(' ')[0]}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 mb-20 md:mb-0">
        {activeTab === 'home' && <HomeView user={user} onNavigate={setActiveTab} />}
        {activeTab === 'chat' && (
          <ChatView 
            user={user} 
            mode={chatMode} 
            setMode={setChatMode} 
            onUpdateId={(id) => handleUpdateUser({ studentId: id })}
          />
        )}
        {activeTab === 'courses' && <CourseExplorerView user={user} />}
        {activeTab === 'tutors' && <TutorView user={user} onStartChat={() => { setChatMode('TUTORING'); setActiveTab('chat'); }} />}
      </main>

      {/* Navigation - Bottom for Mobile, Float for Desktop */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-max md:px-8 md:rounded-full md:shadow-2xl md:border">
        <div className="max-w-7xl mx-auto flex justify-around py-3 md:space-x-12">
          {[
            { id: 'home', icon: 'fas fa-home', label: 'Home' },
            { id: 'chat', icon: 'fas fa-comment-dots', label: 'Chat' },
            { id: 'courses', icon: 'fas fa-book-open', label: 'Catalog' },
            { id: 'tutors', icon: 'fas fa-user-graduate', label: 'Tutor' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col items-center space-y-1 transition-all group ${
                activeTab === tab.id ? 'text-mmsu-green dark:text-mmsu-gold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                activeTab === tab.id ? 'bg-mmsu-green/10 dark:bg-mmsu-gold/10 scale-110' : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
              }`}>
                <i className={`${tab.icon} text-lg`}></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="bg-mmsu-green p-8 text-white flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Stallion Profile</h3>
                <p className="text-[10px] text-mmsu-gold font-bold uppercase tracking-[0.3em] mt-1">University Digital ID</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Display Name</label>
                <input 
                  type="text" 
                  value={user.name} 
                  onChange={(e) => handleUpdateUser({ name: e.target.value })}
                  className="w-full p-4 rounded-2xl border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-mmsu-green outline-none font-bold transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Student Number</label>
                <input 
                  type="text" 
                  placeholder="22-123456"
                  value={user.studentId} 
                  onChange={(e) => handleUpdateUser({ studentId: e.target.value })}
                  className="w-full p-4 rounded-2xl border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-mmsu-green outline-none font-black tracking-widest transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Primary College</label>
                <select 
                  value={user.college}
                  onChange={(e) => handleUpdateUser({ college: e.target.value as College })}
                  className="w-full p-4 rounded-2xl border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-mmsu-green outline-none text-sm font-bold transition-all"
                >
                  {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-mmsu-green text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs mt-4 shadow-xl shadow-mmsu-green/20 hover:bg-mmsu-darkGreen transition-all">Update Stallion Card</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const HomeView = ({ user, onNavigate }: { user: UserProfile, onNavigate: (t: Tab) => void }) => (
  <div className="space-y-10 animate-fadeIn">
    {/* Welcome Hero */}
    <section className="mmsu-gradient text-white p-10 md:p-16 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
      <div className="relative z-10 space-y-8 max-w-3xl">
        <div className="inline-flex items-center space-x-2 bg-mmsu-gold/20 backdrop-blur-md px-4 py-2 rounded-full border border-mmsu-gold/30">
          <span className="w-2 h-2 bg-mmsu-gold rounded-full animate-pulse"></span>
          <span className="text-mmsu-gold text-[10px] font-black uppercase tracking-widest">Academic Year 2025-2026</span>
        </div>
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white">
          Unleash Your <br/>
          <span className="text-mmsu-gold italic">Excellence.</span>
        </h2>
        <p className="text-sm md:text-xl opacity-80 font-medium leading-relaxed">
          Welcome back, <span className="font-bold text-white underline decoration-mmsu-gold underline-offset-4">{user.name.split(' ')[0]}</span>. Your Stallion AI companion is primed for the <span className="text-mmsu-gold">{user.college}</span> curriculum.
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
           <button onClick={() => onNavigate('chat')} className="bg-mmsu-gold text-mmsu-green px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl hover:scale-105 hover:bg-white transition-all">Consult Assistant</button>
           <button onClick={() => onNavigate('courses')} className="bg-white/10 hover:bg-white/20 px-10 py-4 rounded-2xl font-black uppercase text-xs border border-white/20 backdrop-blur-sm transition-all">Explore Catalog</button>
        </div>
      </div>
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform group-hover:rotate-12 transition-transform duration-1000">
        <i className="fas fa-graduation-cap text-[25rem]"></i>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Bulletins */}
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black flex items-center">
            <span className="w-2 h-8 bg-mmsu-green rounded-full mr-4"></span>
            University Bulletins
          </h3>
          <button className="text-mmsu-green dark:text-mmsu-gold font-bold text-xs uppercase tracking-widest">View All <i className="fas fa-arrow-right ml-1"></i></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_ANNOUNCEMENTS.map(ann => (
            <div key={ann.id} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold px-3 py-1.5 rounded-xl border border-mmsu-gold/20">{ann.category}</span>
                <span className="text-[10px] text-gray-400 font-bold">{ann.date}</span>
              </div>
              <h4 className="font-bold text-lg mb-3 group-hover:text-mmsu-green dark:group-hover:text-mmsu-gold transition-colors">{ann.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{ann.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="space-y-8">
        <h3 className="text-2xl font-black flex items-center">
          <span className="w-2 h-8 bg-mmsu-gold rounded-full mr-4"></span>
          Quick Portal
        </h3>
        <div className="space-y-4">
          {[
            { label: 'MVLE Learning', url: 'https://mvle4.mmsu.edu.ph/', icon: 'fa-chalkboard-teacher', color: 'bg-indigo-600' },
            { label: 'Student Portal', url: 'https://my.mmsu.edu.ph/', icon: 'fa-id-badge', color: 'bg-rose-600' },
            { label: 'Registrar Hub', url: 'https://registrar.mmsu.edu.ph/', icon: 'fa-folder-open', color: 'bg-emerald-600' },
            { label: 'Library Search', url: 'https://library.mmsu.edu.ph/', icon: 'fa-book', color: 'bg-mmsu-green' }
          ].map(tool => (
            <button 
              key={tool.label}
              onClick={() => window.open(tool.url, '_blank')}
              className="w-full flex items-center p-5 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-mmsu-green dark:hover:border-mmsu-gold transition-all group shadow-sm"
            >
              <div className={`${tool.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mr-5 shadow-lg group-hover:scale-110 transition-transform`}>
                <i className={`fas ${tool.icon}`}></i>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm">{tool.label}</h4>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">University Service</p>
              </div>
              <i className="fas fa-chevron-right ml-auto text-gray-200 group-hover:text-mmsu-green transition-colors"></i>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ChatView = ({ user, mode, setMode, onUpdateId }: { user: UserProfile, mode: ChatMode, setMode: (m: ChatMode) => void, onUpdateId: (id: string) => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: `Greetings, Stallion! I am your AI assistant specialized for the **${user.college}**. How can I assist your academic journey today?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msgText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!text) setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMsg].map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: `You are the "MMSU Stallion AI Companion" for Mariano Marcos State University. 
          Current date: January 20, 2026. 
          User Context: From ${user.college}, studying at ${user.campus} Campus.
          Student Identity: ${user.studentId || 'Anonymous Stallion'}.
          Operating Mode: ${mode === 'TUTORING' ? 'Deep Academic Tutoring' : 'General University Support'}.
          Your responses must be grounded in MMSU realities, policies, and curriculum. Use a professional, supportive, and scholarly tone.`,
          tools: [{ googleSearch: {} }]
        }
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "I apologize, Stallion. My link to the university core is currently unstable.",
        timestamp: new Date(),
        groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(c => c.web).map(c => ({ title: c.web!.title!, uri: c.web!.uri! }))
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "MMSU server heavy load detected. Please try your query again shortly.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] md:h-[750px] bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-slideUp">
      {/* Chat Nav */}
      <div className={`p-6 flex items-center justify-between border-b dark:border-gray-800 transition-colors ${mode === 'TUTORING' ? 'bg-mmsu-gold/5' : 'bg-transparent'}`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 ${mode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}`}>
            <i className={`fas ${mode === 'TUTORING' ? 'fa-user-graduate' : 'fa-brain'}`}></i>
          </div>
          <div>
            <h3 className="font-black text-sm uppercase leading-none">{mode === 'TUTORING' ? 'Academic Tutor' : 'General Assistant'}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center opacity-60">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Live & Grounded
            </p>
          </div>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          <button onClick={() => setMode('GENERAL')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'GENERAL' ? 'bg-white dark:bg-gray-700 text-mmsu-green dark:text-mmsu-gold shadow-sm' : 'text-gray-400'}`}>General</button>
          <button onClick={() => setMode('TUTORING')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'TUTORING' ? 'bg-white dark:bg-gray-700 text-mmsu-green dark:text-mmsu-gold shadow-sm' : 'text-gray-400'}`}>Tutor</button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50 dark:bg-gray-950/20 no-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-6 py-4 rounded-[1.8rem] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none shadow-xl shadow-mmsu-green/10' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-tl-none'}`}>
                {msg.content}
                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-3 tracking-widest">Grounded Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingLinks.map((link, idx) => (
                        <a key={idx} href={link.uri} target="_blank" className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl text-[10px] font-bold text-mmsu-green dark:text-mmsu-gold hover:underline flex items-center gap-2 border border-gray-100 dark:border-gray-700 transition-all hover:scale-105">
                          <i className="fas fa-link text-[8px] opacity-50"></i> {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[8px] font-black text-gray-400 mt-2 uppercase tracking-widest px-1">
                {msg.role === 'assistant' ? 'MMSU Stallion' : 'Stallion User'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[10px] text-gray-400 font-bold italic animate-pulse px-2">Stallion is formulating a grounded response...</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input Tray */}
      <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {['Enrollment Schedule', 'Grade Inquiries', 'Scholarship List', 'MMSU Vision'].map(action => (
            <button key={action} onClick={() => handleSend(action)} className="text-[10px] font-black uppercase border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-full hover:bg-mmsu-gold hover:text-mmsu-green transition-all whitespace-nowrap bg-white dark:bg-gray-800 shadow-sm">{action}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Inquire about academics, policies, or tips..."
            className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-mmsu-green outline-none transition-all dark:text-white"
          />
          <button onClick={() => handleSend()} className="bg-mmsu-green text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-mmsu-darkGreen shadow-xl shadow-mmsu-green/20 transition-all hover:scale-105 active:scale-95"><i className="fas fa-paper-plane text-lg"></i></button>
        </div>
      </div>
    </div>
  );
};

const CourseExplorerView = ({ user }: { user: UserProfile }) => {
  const [search, setSearch] = useState('');
  const filtered = MOCK_COURSES.filter(c => c.college === user.college && (c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())));
  
  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Course Prospectus</h2>
          <p className="text-xs text-mmsu-green dark:text-mmsu-gold font-bold uppercase tracking-widest mt-2">{user.college}</p>
        </div>
        <div className="relative w-full md:w-96">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Filter code or title..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-14 pr-6 py-4 rounded-[1.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full shadow-sm focus:ring-2 focus:ring-mmsu-green outline-none transition-all dark:text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 hover:border-mmsu-gold transition-all shadow-sm hover:shadow-2xl group">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold px-4 py-2 rounded-xl border border-mmsu-gold/20 uppercase tracking-widest">{c.code}</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.credits} Credits</span>
            </div>
            <h4 className="font-black text-xl mb-4 group-hover:text-mmsu-green dark:group-hover:text-mmsu-gold transition-colors">{c.title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic opacity-80">"{c.description}"</p>
            <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-gray-300">Active Syllabus</span>
              <button className="text-[10px] font-black uppercase text-mmsu-green dark:text-mmsu-gold hover:underline">Full Details</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem]">
             <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><i className="fas fa-book-open text-3xl"></i></div>
             <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs">No matching courses found in catalog.</p>
             <button onClick={() => setSearch('')} className="mt-4 text-mmsu-green dark:text-mmsu-gold font-bold text-xs uppercase underline">Clear Search</button>
          </div>
        )}
      </div>
    </div>
  );
};

const TutorView = ({ user, onStartChat }: { user: UserProfile, onStartChat: () => void }) => (
  <div className="space-y-12 animate-fadeIn max-w-5xl mx-auto">
    <div className="mmsu-gradient p-12 md:p-24 rounded-[4rem] text-center text-white relative overflow-hidden shadow-2xl border border-white/5">
      <div className="relative z-10 flex flex-col items-center">
         <div className="w-32 h-32 bg-mmsu-gold rounded-[2.5rem] flex items-center justify-center text-mmsu-green text-5xl shadow-2xl mb-10 transform rotate-6 hover:rotate-0 transition-transform"><i className="fas fa-microchip"></i></div>
         <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">AI Academic <br/> Mentorship.</h2>
         <p className="text-mmsu-gold font-bold mb-10 max-w-xl opacity-90 uppercase tracking-[0.3em] text-xs leading-loose">Specialized Deep-Learning Support for {user.college}</p>
         <button onClick={onStartChat} className="bg-white text-mmsu-green px-16 py-6 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-mmsu-gold transition-all shadow-2xl hover:scale-105 active:scale-95">Enter Tutor Room</button>
      </div>
      <div className="absolute top-0 left-0 p-12 opacity-5 pointer-events-none"><i className="fas fa-atom text-[20rem]"></i></div>
      <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none"><i className="fas fa-dna text-[15rem]"></i></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { title: 'Fact Checked', icon: 'fa-check-double', text: 'Every answer is cross-referenced with university documentation.' },
        { title: 'Major Specific', icon: 'fa-compass', text: 'Tailored for your specific year and college major requirements.' },
        { title: 'Always Open', icon: 'fa-bolt', text: 'Get critical study assistance even during semester breaks and weekends.' }
      ].map(f => (
        <div key={f.title} className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center group hover:border-mmsu-green transition-all">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-mmsu-green dark:text-mmsu-gold mx-auto mb-6 text-2xl shadow-inner group-hover:scale-110 transition-transform"><i className={`fas ${f.icon}`}></i></div>
          <h4 className="font-black text-sm uppercase mb-3 tracking-widest">{f.title}</h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed italic">{f.text}</p>
        </div>
      ))}
    </div>

    <div className="bg-mmsu-gold/5 dark:bg-mmsu-gold/10 p-10 rounded-[3rem] border border-mmsu-gold/20 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-6">
            <div className="w-14 h-14 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green text-xl"><i className="fas fa-shield-alt"></i></div>
            <div className="text-left">
                <h4 className="font-black text-sm uppercase tracking-widest dark:text-mmsu-gold">Academic Integrity</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 max-w-md font-medium">Our AI is built to explain concepts, not write your papers. Use it as a mentor, not a substitute for your own excellence.</p>
            </div>
        </div>
        <button onClick={() => window.open('https://www.mmsu.edu.ph/academic-policies', '_blank')} className="px-8 py-3 bg-mmsu-green text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-mmsu-darkGreen transition-colors">View Policies</button>
    </div>
  </div>
);

// --- MOUNT ---
const root = createRoot(document.getElementById('root')!);
root.render(<App />);