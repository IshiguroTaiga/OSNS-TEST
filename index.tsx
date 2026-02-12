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
];

// --- APP COMPONENT ---
const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mmsu_stallion_v4');
    return saved ? JSON.parse(saved) : {
      name: 'Stallion Guest',
      college: 'College of Computing and Information Sciences',
      campus: 'Batac',
      studentId: '',
      theme: 'light'
    };
  });

  useEffect(() => {
    localStorage.setItem('mmsu_stallion_v4', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  const toggleTheme = () => setUser(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  const handleUpdateUser = (updates: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 transition-colors duration-300">
      {/* Header */}
      <header className="bg-mmsu-green dark:bg-mmsu-darkGreen text-white sticky top-0 z-50 shadow-md border-b border-mmsu-gold/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green shadow-inner">
              <i className="fas fa-horse-head"></i>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-lg tracking-tight uppercase leading-none">MMSU Stallion</h1>
              <p className="text-[9px] text-mmsu-gold uppercase font-bold tracking-widest">AI Companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
             <div className="hidden md:block">
                <select 
                  value={user.college}
                  onChange={(e) => handleUpdateUser({ college: e.target.value as College })}
                  className="bg-white/10 text-white text-[11px] p-2 rounded-lg border-none focus:ring-1 focus:ring-mmsu-gold outline-none max-w-[200px]"
                >
                  {COLLEGES.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
                </select>
             </div>
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/10 transition-all">
                <i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
             </button>
             <button onClick={() => setShowSettings(true)} className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 p-1.5 pr-3 rounded-full border border-white/20 transition-all">
                <div className="w-7 h-7 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green font-bold text-xs uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-bold hidden sm:inline">{user.name.split(' ')[0]}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === 'home' && <HomeView user={user} onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'chat' && (
          <ChatView 
            user={user} 
            mode={chatMode} 
            setMode={setChatMode} 
            onUpdateId={(id) => handleUpdateUser({ studentId: id })}
          />
        )}
        {activeTab === 'courses' && <CourseExplorerView college={user.college} />}
        {activeTab === 'tutors' && <TutorView college={user.college} onStartChat={() => { setChatMode('TUTORING'); setActiveTab('chat'); }} />}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:relative md:bg-transparent md:border-none">
        <div className="max-w-7xl mx-auto flex justify-around md:justify-center md:space-x-12 py-3">
          {[
            { id: 'home', icon: 'fas fa-home', label: 'Home' },
            { id: 'chat', icon: 'fas fa-comments', label: 'AI Chat' },
            { id: 'courses', icon: 'fas fa-book-open', label: 'Courses' },
            { id: 'tutors', icon: 'fas fa-user-graduate', label: 'Tutors' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3 transition-all ${
                activeTab === tab.id ? 'text-mmsu-green dark:text-mmsu-gold font-bold scale-110 md:scale-100' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <i className={`${tab.icon} text-xl md:text-base`}></i>
              <span className="text-[10px] md:text-sm uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="bg-mmsu-green p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase">Stallion Profile</h3>
                <p className="text-[10px] text-mmsu-gold font-bold uppercase tracking-widest">Digital Identification</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  value={user.name} 
                  onChange={(e) => handleUpdateUser({ name: e.target.value })}
                  className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-mmsu-green outline-none font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Student Number</label>
                <input 
                  type="text" 
                  placeholder="YY-XXXXXX"
                  value={user.studentId} 
                  onChange={(e) => handleUpdateUser({ studentId: e.target.value })}
                  className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-mmsu-green outline-none font-black tracking-widest"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Campus</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Batac', 'Laoag', 'Currimao', 'Dingras'].map(c => (
                    <button 
                      key={c}
                      onClick={() => handleUpdateUser({ campus: c as Campus })}
                      className={`p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${user.campus === c ? 'bg-mmsu-green text-white border-mmsu-green shadow-md' : 'hover:border-mmsu-gold'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-mmsu-green text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs mt-4 shadow-xl shadow-mmsu-green/20">Save Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUBVIEWS ---

const HomeView: React.FC<{ user: UserProfile, onNavigate: (tab: Tab) => void }> = ({ user, onNavigate }) => (
  <div className="space-y-8 animate-fadeIn">
    {/* Banner */}
    <section className="bg-gradient-to-br from-mmsu-green via-mmsu-darkGreen to-green-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10">
      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center space-x-2 bg-mmsu-gold/20 backdrop-blur-md px-3 py-1 rounded-full border border-mmsu-gold/30">
          <span className="w-1.5 h-1.5 bg-mmsu-gold rounded-full animate-pulse"></span>
          <span className="text-mmsu-gold text-[10px] font-black uppercase tracking-widest">2nd Semester 2025-2026</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">
          Rise Higher, <br/>
          <span className="text-mmsu-gold">Stallion {user.name.split(' ')[0]}!</span>
        </h2>
        <p className="text-sm md:text-base opacity-80 max-w-lg font-medium">
          Personalized dashboard active for the <span className="text-mmsu-gold font-bold">{user.college}</span>.
        </p>
        <div className="flex gap-4">
           <button onClick={() => onNavigate('chat')} className="bg-mmsu-gold text-mmsu-green px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition-all">Consult AI</button>
           <button onClick={() => onNavigate('courses')} className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-2xl font-black uppercase text-xs border border-white/20 backdrop-blur-sm transition-all">Explore Courses</button>
        </div>
      </div>
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <i className="fas fa-graduation-cap text-[15rem] transform -rotate-12 translate-x-12"></i>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Announcements */}
      <div className="lg:col-span-2 space-y-6">
        <h3 className="text-xl font-black flex items-center">
          <span className="w-1.5 h-6 bg-mmsu-green rounded-full mr-3"></span>
          Campus Bulletins
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_ANNOUNCEMENTS.map(ann => (
            <div key={ann.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black uppercase bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold px-2 py-1 rounded-full border border-mmsu-gold/20">{ann.category}</span>
                <span className="text-[10px] text-gray-400 font-bold">{ann.date}</span>
              </div>
              <h4 className="font-bold text-base mb-2 group-hover:text-mmsu-green dark:group-hover:text-mmsu-gold transition-colors">{ann.title}</h4>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ann.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="space-y-6">
        <h3 className="text-xl font-black flex items-center">
          <span className="w-1.5 h-6 bg-mmsu-gold rounded-full mr-3"></span>
          Quick Links
        </h3>
        <div className="space-y-3">
          {[
            { label: 'MVLE Learning', url: 'https://mvle4.mmsu.edu.ph/my/', icon: 'fa-graduation-cap', color: 'bg-orange-500' },
            { label: 'Student Portal', url: 'https://my.mmsu.edu.ph/', icon: 'fa-user-circle', color: 'bg-blue-500' },
            { label: 'Registrar', url: 'https://registrar.mmsu.edu.ph/', icon: 'fa-file-signature', color: 'bg-rose-500' },
            { label: 'MMSU Official', url: 'https://www.mmsu.edu.ph/', icon: 'fa-globe-asia', color: 'bg-mmsu-green' }
          ].map(tool => (
            <button 
              key={tool.label}
              onClick={() => window.open(tool.url, '_blank')}
              className="w-full flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-mmsu-green dark:hover:border-mmsu-gold transition-all group text-left"
            >
              <div className={`${tool.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mr-4 shadow-lg group-hover:rotate-12 transition-transform`}>
                <i className={`fas ${tool.icon}`}></i>
              </div>
              <div>
                <h4 className="font-bold text-xs">{tool.label}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">External Portal</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ChatView: React.FC<{ user: UserProfile, mode: ChatMode, setMode: (m: ChatMode) => void, onUpdateId: (id: string) => void }> = ({ user, mode, setMode, onUpdateId }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: `Hello, Stallion! I am your academic assistant for the **${user.college}**. How can I help you today?`, timestamp: new Date() }
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
          Current date: Jan 20, 2026. 
          User is from: ${user.college}, ${user.campus} Campus.
          Student ID: ${user.studentId || 'Not provided'}.
          Mode: ${mode === 'TUTORING' ? 'Academic Tutor' : 'General Assistant'}.
          Scope: MMSU academics, policies, and campus life only.`,
          tools: [{ googleSearch: {} }]
        }
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "I'm having trouble connecting to the university server.",
        timestamp: new Date(),
        groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(c => c.web).map(c => ({ title: c.web!.title!, uri: c.web!.uri! }))
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "MMSU server busy. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[700px] bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn">
      {/* Chat Header */}
      <div className={`p-5 flex items-center justify-between transition-colors ${mode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${mode === 'TUTORING' ? 'bg-mmsu-green text-white' : 'bg-mmsu-gold text-mmsu-green'}`}>
            <i className={`fas ${mode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'}`}></i>
          </div>
          <div>
            <h3 className="font-black text-sm uppercase leading-none">{mode === 'TUTORING' ? 'Stallion Tutor' : 'Stallion Assistant'}</h3>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">Online & Grounded</p>
          </div>
        </div>
        <div className="flex bg-black/10 p-1 rounded-xl">
          <button onClick={() => setMode('GENERAL')} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'GENERAL' ? 'bg-white text-mmsu-green shadow-sm' : 'text-white/60'}`}>General</button>
          <button onClick={() => setMode('TUTORING')} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'TUTORING' ? 'bg-white text-mmsu-green shadow-sm' : 'text-white/60'}`}>Tutor</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/40">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-5 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-none'}`}>
                {msg.content}
                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingLinks.map((link, idx) => (
                        <a key={idx} href={link.uri} target="_blank" className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1">
                          <i className="fas fa-link text-[8px]"></i> {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase px-1">
                {msg.role === 'assistant' ? 'MMSU Stallion' : 'Student'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[10px] text-gray-400 font-bold italic animate-pulse">Stallion is thinking...</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 mb-3">
          {['Enrollment Help', 'Course Prospectus', 'Library Hours', 'Study Tips'].map(action => (
            <button key={action} onClick={() => handleSend(action)} className="text-[10px] font-black uppercase border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-mmsu-gold hover:text-mmsu-green transition-all">{action}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about MMSU..."
            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-mmsu-green outline-none"
          />
          <button onClick={() => handleSend()} className="bg-mmsu-green text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-mmsu-darkGreen shadow-lg"><i className="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  );
};

const CourseExplorerView: React.FC<{ college: College }> = ({ college }) => {
  const [search, setSearch] = useState('');
  const filtered = MOCK_COURSES.filter(c => c.college === college && (c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())));
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Course Catalog</h2>
          <p className="text-xs text-mmsu-green dark:text-mmsu-gold font-bold uppercase tracking-widest">{college}</p>
        </div>
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search code or title..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-full md:w-80 shadow-sm focus:ring-2 focus:ring-mmsu-green outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-mmsu-gold transition-all shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold px-3 py-1 rounded-lg">{c.code}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">{c.credits} Units</span>
            </div>
            <h4 className="font-bold text-lg mb-2">{c.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed italic">"{c.description}"</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
             <i className="fas fa-book-open text-4xl text-gray-200 mb-4"></i>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No courses found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TutorView: React.FC<{ college: College, onStartChat: () => void }> = ({ college, onStartChat }) => (
  <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
    <div className="bg-gradient-to-br from-mmsu-green to-mmsu-darkGreen p-10 md:p-16 rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl">
      <div className="relative z-10 flex flex-col items-center">
         <div className="w-24 h-24 bg-mmsu-gold rounded-3xl flex items-center justify-center text-mmsu-green text-4xl shadow-2xl mb-8 transform rotate-6"><i className="fas fa-brain"></i></div>
         <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Personalized AI Tutoring</h2>
         <p className="text-mmsu-gold font-medium mb-8 max-w-lg opacity-90 uppercase tracking-[0.2em] text-xs">Exclusively for {college}</p>
         <button onClick={onStartChat} className="bg-white text-mmsu-green px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-mmsu-gold transition-all shadow-xl">Launch Tutor Room</button>
      </div>
      <div className="absolute top-0 left-0 p-8 opacity-5 pointer-events-none"><i className="fas fa-atom text-[15rem]"></i></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { title: 'Grounding', icon: 'fa-search', text: 'Real-time university data verification.' },
        { title: 'Adaptive', icon: 'fa-sliders-h', text: 'Adjusts to your specific college major.' },
        { title: '24/7 Access', icon: 'fa-clock', text: 'Get help anytime, even during breaks.' }
      ].map(f => (
        <div key={f.title} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
          <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-mmsu-green dark:text-mmsu-gold mx-auto mb-4 text-xl shadow-inner"><i className={`fas ${f.icon}`}></i></div>
          <h4 className="font-black text-sm uppercase mb-2">{f.title}</h4>
          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{f.text}</p>
        </div>
      ))}
    </div>
  </div>
);

// --- MOUNT APP ---
const root = createRoot(document.getElementById('root')!);
root.render(<App />);