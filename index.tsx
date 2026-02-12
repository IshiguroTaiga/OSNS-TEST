
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
export type Campus = 'Batac' | 'Laoag' | 'Currimao' | 'Dingras';
export type Tab = 'home' | 'chat' | 'courses' | 'tutors';
export type ChatMode = 'GENERAL' | 'TUTORING';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  groundingLinks?: { title: string; uri: string }[];
}

export interface UserProfile {
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
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'January 12, 2026', content: 'Final week for enrollment. Please visit your college registrar.', category: 'Enrollment' },
  { id: 'a2', title: 'MMSU 48th Foundation Anniversary', date: 'January 20, 2026', content: 'Happy Foundation Day, Stallions! Join us at the Sunken Garden.', category: 'Event' },
  { id: 'a3', title: 'Scholarship Renewal Period', date: 'January 18, 2026', content: 'Submit grades to OSA for renewal.', category: 'Scholarship' }
];

// --- AI SERVICE ---
async function getAIResponse(prompt: string, college: string, mode: ChatMode, studentId?: string, history?: Message[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const contents = history?.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })) || [];
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const systemInstruction = `You are the "MMSU Stallion AI Companion". Context: Mariano Marcos State University. Date: Jan 20, 2026 (Foundation Day). User is from ${college}. Mode: ${mode}. StudentID: ${studentId || 'Guest'}. Tone: Professional, scholarly, and supportive. Use university-specific knowledge. Today is a celebration day!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: { systemInstruction, tools: [{ googleSearch: {} }] }
    });

    const text = response.text || "I'm having a bit of trouble connecting right now.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = groundingChunks.filter(c => c.web).map(c => ({ title: c.web?.title || 'External Link', uri: c.web?.uri || '#' }));

    return { text, links };
  } catch (e) {
    console.error(e);
    return { text: "The university server is experiencing high traffic. Please try again soon.", links: [] };
  }
}

// --- COMPONENTS ---

const Header = ({ user, toggleTheme, onOpenSettings, onCollegeChange }: any) => (
  <header className="mmsu-header">
    <div className="container d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <div className="bg-warning text-success rounded-3 d-flex align-items-center justify-content-center me-3" style={{width: '42px', height: '42px'}}>
          <i className="fas fa-horse-head fs-5"></i>
        </div>
        <div className="lh-1">
          <h1 className="h6 mb-0 fw-bold text-uppercase">MMSU Stallion</h1>
          <small className="text-warning text-uppercase fw-bold" style={{fontSize: '0.6rem'}}>Academic Companion</small>
        </div>
      </div>
      <div className="d-flex align-items-center gap-3">
        <select 
          value={user.college} 
          onChange={e => onCollegeChange(e.target.value)} 
          className="form-select form-select-sm d-none d-lg-block border-0 bg-white bg-opacity-10 text-white shadow-none clickable" 
          style={{maxWidth: '220px'}}
        >
          {COLLEGES.map(c => <option key={c} value={c} className="text-dark">{c}</option>)}
        </select>
        <button onClick={toggleTheme} className="btn btn-link p-0 text-white text-decoration-none clickable">
          <i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'} fs-5`}></i>
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            onOpenSettings();
          }} 
          className="btn btn-outline-warning btn-sm rounded-pill px-3 fw-bold clickable d-flex align-items-center gap-2"
        >
          <i className="fas fa-user-circle"></i>
          <span>{user.name.split(' ')[0]}</span>
        </button>
      </div>
    </div>
  </header>
);

const Dashboard = ({ user, onStartChat }: any) => (
  <div className="animate-fadeIn">
    <div className="mmsu-banner">
      <div className="position-relative z-1">
        <span className="badge bg-warning text-dark text-uppercase mb-3 px-3 fw-bold">Academic Year 2025-2026</span>
        <h2 className="display-4 fw-black mb-3">Rise Higher, <br/><span className="text-mmsu-gold">Stallion {user.name.split(' ')[0]}!</span></h2>
        <p className="lead opacity-90 mb-4">{user.college}</p>
        <button onClick={onStartChat} className="btn btn-gold btn-lg shadow">Start AI Consult</button>
      </div>
      <i className="fas fa-horse-head position-absolute top-0 end-0 p-5 opacity-10" style={{fontSize: '12rem'}}></i>
    </div>
    
    <div className="row mt-5">
      <div className="col-lg-7">
        <h5 className="fw-bold mb-4 d-flex align-items-center">
          <span className="bg-success rounded-pill me-2" style={{width: '6px', height: '24px'}}></span>
          Latest Bulletins
        </h5>
        {MOCK_ANNOUNCEMENTS.map(ann => (
          <div key={ann.id} className="stallion-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="badge bg-success bg-opacity-10 text-success text-uppercase" style={{fontSize: '0.65rem'}}>{ann.category}</span>
              <small className="fw-bold opacity-75">{ann.date}</small>
            </div>
            <h6 className="fw-bold mb-1">{ann.title}</h6>
            <p className="small m-0 line-clamp-1">{ann.content}</p>
          </div>
        ))}
      </div>
      <div className="col-lg-5">
        <h5 className="fw-bold mb-4 d-flex align-items-center">
          <span className="bg-warning rounded-pill me-2" style={{width: '6px', height: '24px'}}></span>
          Quick Tools
        </h5>
        <div className="row g-3">
          {[
            {label: 'Admission', icon: 'fa-user-plus'},
            {label: 'MVLE', icon: 'fa-graduation-cap'},
            {label: 'Portal', icon: 'fa-id-card'},
            {label: 'Library', icon: 'fa-book'}
          ].map(tool => (
            <div key={tool.label} className="col-6">
              <div className="stallion-card text-center p-4 m-0 h-100 d-flex flex-column align-items-center justify-content-center">
                <i className={`fas ${tool.icon} text-success h3 mb-2`}></i>
                <p className="small fw-black text-uppercase m-0">{tool.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ChatRoom = ({ user, mode, setMode }: any) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: `Hello Stallion! I am your AI assistant for the ${user.college}. How can I help you today?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const send = async (text?: string) => {
    const val = text || input;
    if (!val.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: val, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    const result = await getAIResponse(val, user.college, mode, user.studentId, messages);
    setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: result.text, groundingLinks: result.links, timestamp: new Date() }]);
    setLoading(false);
  };

  return (
    <div className="chat-container animate-fadeIn">
      <div className="bg-success text-white p-3 px-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <i className="fas fa-robot text-warning fs-5"></i>
          <span className="fw-black text-uppercase small tracking-wider">AI Assistant Online</span>
        </div>
        <div className="btn-group btn-group-sm rounded-pill overflow-hidden border">
          <button onClick={() => setMode('GENERAL')} className={`btn ${mode === 'GENERAL' ? 'btn-warning text-dark' : 'btn-outline-light border-0'}`}>General</button>
          <button onClick={() => setMode('TUTORING')} className={`btn ${mode === 'TUTORING' ? 'btn-warning text-dark' : 'btn-outline-light border-0'}`}>Tutor</button>
        </div>
      </div>
      <div className="messages-area no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`message-bubble ${m.role === 'user' ? 'user-message shadow' : 'ai-message'}`}>
            <p className="m-0" style={{whiteSpace: 'pre-wrap'}}>{m.content}</p>
            {m.groundingLinks && m.groundingLinks.length > 0 && (
              <div className="mt-3 pt-2 border-top small opacity-75">
                <span className="fw-bold d-block mb-1">Sources:</span>
                {m.groundingLinks.map((l, i) => (
                  <a key={i} href={l.uri} target="_blank" className="d-block text-truncate text-primary text-decoration-none">
                    <i className="fas fa-external-link-alt me-1"></i> {l.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-muted small italic ms-2">Stallion is typing...</div>}
        <div ref={scrollRef}></div>
      </div>
      <div className="p-3 border-top bg-light-gray">
        <div className="d-flex gap-2">
          <input 
            type="text" 
            className="form-control rounded-pill px-4 shadow-sm" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()} 
            placeholder="Ask anything about academic life at MMSU..." 
          />
          <button onClick={() => send()} className="btn btn-mmsu rounded-circle" style={{width: '46px', height: '46px'}}><i className="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ user, setUser, onClose }: any) => {
  const [name, setName] = useState(user.name);
  const [coll, setColl] = useState(user.college);
  const save = () => { setUser({ ...user, name, college: coll }); onClose(); };
  return (
    <div className="modal show d-block bg-dark bg-opacity-75" style={{zIndex: 2000, backdropFilter: 'blur(4px)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-5 shadow-lg">
          <div className="modal-header bg-success text-white p-4">
            <h5 className="modal-title fw-black uppercase tracking-tight">Student Profile</h5>
            <button onClick={onClose} className="btn-close btn-close-white"></button>
          </div>
          <div className="modal-body p-4">
            <div className="mb-3">
              <label className="small fw-bold text-muted text-uppercase mb-2">Display Name</label>
              <input type="text" className="form-control rounded-4 p-3 shadow-none border-2" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="small fw-bold text-muted text-uppercase mb-2">Home College</label>
              <select className="form-select rounded-4 p-3 shadow-none border-2" value={coll} onChange={e => setColl(e.target.value)}>
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={save} className="btn btn-mmsu w-100 py-3 rounded-4 shadow-sm fw-bold">Save Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP ENTRY ---
const App = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [mode, setMode] = useState<ChatMode>('GENERAL');
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('stallion_app_final_v1');
    return saved ? JSON.parse(saved) : { 
      name: 'Stallion User', 
      college: 'College of Computing and Information Sciences', 
      campus: 'Batac', 
      theme: 'light', 
      studentId: '' 
    };
  });

  useEffect(() => {
    localStorage.setItem('stallion_app_final_v1', JSON.stringify(user));
    document.body.className = user.theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [user]);

  return (
    <div className="min-vh-100 d-flex flex-column pb-5 mb-5">
      <Header 
        user={user} 
        toggleTheme={() => setUser({...user, theme: user.theme === 'light' ? 'dark' : 'light'})} 
        onOpenSettings={() => setShowSettings(true)} 
        onCollegeChange={(c: string) => setUser({...user, college: c})} 
      />
      
      <main className="container py-4 flex-grow-1">
        {tab === 'home' && <Dashboard user={user} onStartChat={() => setTab('chat')} />}
        {tab === 'chat' && <ChatRoom user={user} mode={mode} setMode={setMode} />}
        {tab === 'courses' && (
          <div className="animate-fadeIn">
            <h4 className="fw-black mb-4">MMSU Course Explorer</h4>
            <div className="row g-4">
              {COLLEGES.slice(0, 9).map(c => (
                <div key={c} className="col-md-4">
                  <div className="stallion-card h-100 d-flex flex-column">
                    <h6 className="fw-bold mb-3">{c}</h6>
                    <button className="btn btn-sm btn-outline-success rounded-pill px-3 mt-auto fw-bold clickable">Browse Catalog</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'tutors' && (
          <div className="text-center p-5 animate-fadeIn">
            <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4 shadow-lg" style={{width: '100px', height: '100px'}}>
              <i className="fas fa-user-graduate h1 m-0"></i>
            </div>
            <h2 className="fw-black">Stallion Tutor Room</h2>
            <p className="opacity-75 mb-4 max-w-sm mx-auto">Access specialized academic guidance tailored specifically to your department's curriculum.</p>
            <button onClick={() => { setTab('chat'); setMode('TUTORING'); }} className="btn btn-gold btn-lg px-5 py-3 rounded-4 fw-bold shadow">Enter Tutor Session</button>
          </div>
        )}
      </main>

      <nav className="bottom-nav shadow-lg">
        {[
          { id: 'home', icon: 'fa-house', label: 'Home' },
          { id: 'chat', icon: 'fa-comments', label: 'AI Chat' },
          { id: 'courses', icon: 'fa-book', label: 'Courses' },
          { id: 'tutors', icon: 'fa-user-graduate', label: 'Tutors' }
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id as Tab)} className={`nav-item ${tab === item.id ? 'active' : ''}`}>
            <i className={`fas ${item.icon} h4 mb-1`}></i>
            <span style={{fontSize: '0.6rem'}}>{item.label}</span>
          </button>
        ))}
      </nav>

      {showSettings && <SettingsModal user={user} setUser={setUser} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) createRoot(rootEl).render(<App />);
