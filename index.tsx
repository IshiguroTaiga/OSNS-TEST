
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
export type Campus = 'Batac' | 'Laoag' | 'Currimao' | 'Dingras';

export type College = 
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

export type ChatMode = 'GENERAL' | 'TUTORING';

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  groundingLinks?: GroundingLink[];
}

export interface UserProfile {
  name: string;
  college: College;
  campus: Campus;
  theme: 'light' | 'dark';
  studentId?: string;
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

const MOCK_COURSES = [
  { id: 'c1', code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', description: 'Fundamental concepts of computer hardware and software.', credits: 3 },
  { id: 'c2', code: 'CMPSC 146', title: 'Software Engineering', college: 'College of Computing and Information Sciences', description: 'Systematic approach to software development.', credits: 3 },
  { id: 'c3', code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', description: 'Study of life and living organisms.', credits: 4 },
  { id: 'c4', code: 'MATH 101', title: 'College Algebra', college: 'College of Arts and Sciences', description: 'Functions and graphs, systems of equations.', credits: 3 },
  { id: 'c5', code: 'ACCTG 101', title: 'Financial Accounting 1', college: 'College of Business, Economics and Accountancy', description: 'Principles and procedures of the accounting cycle.', credits: 3 },
  { id: 'c6', code: 'ENGG 101', title: 'Engineering Graphics', college: 'College of Engineering', description: 'Principles of drafting and visualization.', credits: 2 },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'January 12, 2026', content: 'Final week for adding/dropping subjects. Please visit your college registrar.', category: 'Enrollment' },
  { id: 'a2', title: '2026 Scholarship Renewal', date: 'January 18, 2026', content: 'Submit your 1st Semester grades to the Office of Student Affairs for renewal.', category: 'Scholarship' },
  { id: 'a3', title: 'MMSU 48th Foundation Anniversary', date: 'January 20, 2026', content: 'Happy Foundation Day, Stallions! Join us for the grand celebration at the Sunken Garden.', category: 'Event' },
];

// --- AI SERVICE ---
const GET_SYSTEM_INSTRUCTION = (mode: ChatMode, college: string, studentId?: string) => {
  return `
You are the "MMSU Stallion AI Companion," the EXCLUSIVE academic assistant for Mariano Marcos State University (MMSU).
The current date is January 20, 2026. This is the 2nd Semester of AY 2025-2026.

STRICT OPERATIONAL CONSTRAINTS:
1. SCOPE: Strictly MMSU-based. Politely decline non-university queries with: "As the Stallion AI, my primary function is limited to serving the MMSU community."
2. LANGUAGE: Professional English.
3. TONE: Scholarly, supportive, and formal.
4. CONTEXT: User is from the ${college}. Campus location is selected in profile.

MODE: ${mode} ${studentId ? `(Tutor for Student ${studentId})` : ''}
${mode === 'TUTORING' ? 'Focus on explaining concepts, study techniques, and curriculum specific advice for ' + college : 'Focus on general university navigation, policies, and campus life.'}
`;
};

async function getAIResponse(
  prompt: string, 
  college: string,
  mode: ChatMode,
  studentId?: string,
  history?: Message[]
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const contents = history?.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })) || [];
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: { 
        systemInstruction: GET_SYSTEM_INSTRUCTION(mode, college, studentId),
        tools: [{ googleSearch: {} }] 
      }
    });

    const text = response.text || "The Stallion AI is temporarily resting. Please try again later.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links: GroundingLink[] = groundingChunks
      .filter(c => c.web)
      .map(c => ({ title: c.web?.title || 'University Reference', uri: c.web?.uri || '#' }));

    return { text, links };
  } catch (e) {
    console.error(e);
    return { text: "University servers are currently high capacity. Please check the official portal.", links: [] };
  }
}

// --- COMPONENTS ---

const Header = ({ user, toggleTheme, onOpenSettings, onCollegeChange }: any) => (
  <header className="mmsu-header">
    <div className="container d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <div className="mmsu-logo-box bg-warning text-success rounded-3 d-flex align-items-center justify-content-center me-3">
          <i className="fas fa-horse-head fs-4"></i>
        </div>
        <div className="lh-1">
          <h1 className="h6 mb-0 fw-black text-uppercase tracking-tight">MMSU Stallion</h1>
          <small className="text-warning text-uppercase fw-bold tracking-widest" style={{fontSize: '0.55rem'}}>Academic AI Companion</small>
        </div>
      </div>
      <div className="d-flex align-items-center gap-3">
        <select 
          value={user.college} 
          onChange={e => onCollegeChange(e.target.value)} 
          className="form-select form-select-sm d-none d-lg-block border-0 bg-white bg-opacity-10 text-white shadow-none" 
          style={{maxWidth: '250px'}}
        >
          {COLLEGES.map(c => <option key={c} value={c} className="text-dark">{c}</option>)}
        </select>
        <button onClick={toggleTheme} className="btn btn-link p-0 text-white text-decoration-none">
          <i className={`fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'} fs-5`}></i>
        </button>
        <button onClick={onOpenSettings} className="btn btn-gold btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2">
          <i className="fas fa-user-graduate"></i>
          <span className="d-none d-md-inline">{user.name.split(' ')[0]}</span>
        </button>
      </div>
    </div>
  </header>
);

const Home = ({ user, onStartChat }: any) => (
  <div className="animate-fadeIn">
    <div className="mmsu-banner mb-5">
      <div className="position-relative z-1">
        <span className="badge bg-warning text-dark text-uppercase mb-3 px-3 fw-black">AY 2025-2026 • 2nd SEM</span>
        <h2 className="display-4 fw-black mb-3">Rise Higher, <br/><span className="text-mmsu-gold">Stallion {user.name.split(' ')[0]}!</span></h2>
        <p className="lead opacity-90 mb-4 max-w-lg">{user.college} at the {user.campus} Campus.</p>
        <button onClick={onStartChat} className="btn btn-gold btn-lg shadow-lg px-5">Consult Stallion AI</button>
      </div>
      <i className="fas fa-horse-head position-absolute bottom-0 end-0 p-4 opacity-10" style={{fontSize: '15rem', transform: 'rotate(-10deg) translate(20%, 20%)'}}></i>
    </div>

    <div className="row g-4">
      <div className="col-lg-8">
        <div className="d-flex align-items-center justify-content-between mb-4 px-2">
          <h5 className="fw-black m-0 text-uppercase tracking-wider">
            <span className="text-success me-2">|</span>Latest Bulletins
          </h5>
          <button className="btn btn-link btn-sm text-success text-decoration-none fw-bold">View Portal</button>
        </div>
        {MOCK_ANNOUNCEMENTS.map(ann => (
          <div key={ann.id} className="stallion-card hover-lift transition-all">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <span className={`badge ${ann.category === 'Scholarship' ? 'bg-primary' : ann.category === 'Enrollment' ? 'bg-success' : 'bg-warning text-dark'} text-uppercase`} style={{fontSize: '0.6rem'}}>{ann.category}</span>
              <small className="text-muted fw-bold">{ann.date}</small>
            </div>
            <h6 className="fw-black mb-2 fs-5">{ann.title}</h6>
            <p className="small mb-0 opacity-75">{ann.content}</p>
          </div>
        ))}
      </div>
      <div className="col-lg-4">
        <h5 className="fw-black mb-4 text-uppercase tracking-wider px-2">
          <span className="text-warning me-2">|</span>Stallion Tools
        </h5>
        <div className="row g-3">
          {[
            { label: 'Admission', icon: 'fa-id-card', color: 'bg-info' },
            { label: 'MVLE', icon: 'fa-graduation-cap', color: 'bg-primary' },
            { label: 'Library', icon: 'fa-book-reader', color: 'bg-success' },
            { label: 'Health', icon: 'fa-heartbeat', color: 'bg-danger' }
          ].map(tool => (
            <div key={tool.label} className="col-6">
              <div className="stallion-card text-center py-4 px-2 h-100 d-flex flex-column align-items-center justify-content-center hover-lift">
                <div className={`${tool.color} text-white rounded-3 p-3 mb-3 shadow-sm`}>
                  <i className={`fas ${tool.icon} fs-4`}></i>
                </div>
                <p className="small fw-black text-uppercase m-0 tracking-tighter">{tool.label}</p>
              </div>
            </div>
          ))}
          <div className="col-12 mt-4">
            <div className="bg-success bg-opacity-5 rounded-4 p-4 border border-success border-opacity-10 text-center">
              <i className="fas fa-shield-alt text-success mb-2 fs-3"></i>
              <h6 className="fw-black text-uppercase small mb-2">Student Security</h6>
              <p className="text-muted" style={{fontSize: '0.7rem'}}>Always keep your student ID and credentials confidential. Consult the Registrar for verified documents.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ChatRoom = ({ user, mode, setMode }: any) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: `Greetings, Stallion! 🐎 I am your AI Companion for the **${user.college}**. How may I assist your academic journey today?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, loading]);

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
    <div className="chat-container animate-fadeIn d-flex flex-column h-100 bg-white border-0 shadow-lg rounded-5 overflow-hidden">
      <div className={`p-4 px-4 d-flex justify-content-between align-items-center text-white ${mode === 'TUTORING' ? 'bg-dark' : 'bg-success'}`}>
        <div className="d-flex align-items-center gap-3">
          <div className="bg-white bg-opacity-20 rounded-3 p-2">
            <i className={`fas ${mode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'} fs-5`}></i>
          </div>
          <div>
            <span className="fw-black text-uppercase d-block lh-1 small tracking-widest">Stallion {mode === 'TUTORING' ? 'Tutor' : 'Assistant'}</span>
            <span className="text-warning fw-bold" style={{fontSize: '0.6rem'}}><i className="fas fa-circle me-1" style={{fontSize: '0.4rem'}}></i> ONLINE</span>
          </div>
        </div>
        <div className="btn-group btn-group-sm rounded-pill overflow-hidden border border-white border-opacity-25 p-1 bg-black bg-opacity-10">
          <button onClick={() => setMode('GENERAL')} className={`btn rounded-pill px-3 border-0 fw-bold ${mode === 'GENERAL' ? 'bg-warning text-dark' : 'text-white bg-transparent'}`}>General</button>
          <button onClick={() => setMode('TUTORING')} className={`btn rounded-pill px-3 border-0 fw-bold ${mode === 'TUTORING' ? 'bg-warning text-dark' : 'text-white bg-transparent'}`}>Tutor</button>
        </div>
      </div>
      <div className="messages-area flex-grow-1 p-4 bg-light bg-opacity-50 overflow-auto">
        {messages.map(m => (
          <div key={m.id} className={`message-bubble mb-4 ${m.role === 'user' ? 'ms-auto bg-success text-white' : 'me-auto bg-white border text-dark shadow-sm'}`}>
            <p className="m-0" style={{whiteSpace: 'pre-wrap', fontSize: '0.95rem'}}>{m.content}</p>
            {m.groundingLinks && m.groundingLinks.length > 0 && (
              <div className="mt-3 pt-2 border-top small opacity-75">
                <p className="fw-bold text-uppercase mb-2 tracking-tighter" style={{fontSize: '0.6rem'}}>Verified References:</p>
                {m.groundingLinks.map((l, i) => (
                  <a key={i} href={l.uri} target="_blank" className="d-block text-truncate text-primary text-decoration-none mb-1">
                    <i className="fas fa-link me-1"></i> {l.title}
                  </a>
                ))}
              </div>
            )}
            <small className="d-block mt-2 opacity-50 fw-bold tracking-tighter" style={{fontSize: '0.65rem'}}>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        ))}
        {loading && (
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="spinner-grow spinner-grow-sm text-success" role="status"></div>
            <span className="text-muted small fw-bold text-uppercase tracking-widest">Consulting Stallion Network...</span>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>
      <div className="p-4 border-top bg-white">
        <div className="d-flex gap-3">
          <input 
            type="text" 
            className="form-control rounded-pill px-4 border-0 bg-light shadow-none" 
            style={{height: '52px'}}
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()} 
            placeholder={mode === 'TUTORING' ? "Explain a concept..." : "Ask about enrollment, policies..."} 
          />
          <button onClick={() => send()} className="btn btn-mmsu rounded-circle shadow-lg" style={{width: '52px', height: '52px'}}><i className="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ user, setUser, onClose }: any) => {
  const [name, setName] = useState(user.name);
  const [coll, setColl] = useState(user.college);
  const [camp, setCamp] = useState(user.campus);
  const [sid, setSid] = useState(user.studentId || '');
  
  const save = () => { 
    setUser({ ...user, name, college: coll, campus: camp, studentId: sid }); 
    onClose(); 
  };
  
  return (
    <div className="modal show d-block bg-dark bg-opacity-75" style={{zIndex: 2000, backdropFilter: 'blur(8px)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-5 shadow-lg overflow-hidden">
          <div className="modal-header bg-success text-white p-4 border-0">
            <h5 className="modal-title fw-black text-uppercase tracking-wider">Student Profile</h5>
            <button onClick={onClose} className="btn-close btn-close-white"></button>
          </div>
          <div className="modal-body p-4 bg-light">
            <div className="mb-3">
              <label className="small fw-black text-muted text-uppercase mb-2 tracking-widest">Full Name</label>
              <input type="text" className="form-control rounded-4 p-3 border-0 bg-white shadow-sm" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="small fw-black text-muted text-uppercase mb-2 tracking-widest">Student ID (YY-XXXXXX)</label>
              <input type="text" className="form-control rounded-4 p-3 border-0 bg-white shadow-sm" value={sid} onChange={e => setSid(e.target.value)} placeholder="e.g. 21-123456" />
            </div>
            <div className="row g-3 mb-4">
              <div className="col-6">
                <label className="small fw-black text-muted text-uppercase mb-2 tracking-widest">Campus</label>
                <select className="form-select rounded-4 p-3 border-0 bg-white shadow-sm" value={camp} onChange={e => setCamp(e.target.value)}>
                  <option value="Batac">Batac</option>
                  <option value="Laoag">Laoag</option>
                  <option value="Currimao">Currimao</option>
                  <option value="Dingras">Dingras</option>
                </select>
              </div>
              <div className="col-12">
                <label className="small fw-black text-muted text-uppercase mb-2 tracking-widest">College</label>
                <select className="form-select rounded-4 p-3 border-0 bg-white shadow-sm" value={coll} onChange={e => setColl(e.target.value)}>
                  {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button onClick={save} className="btn btn-mmsu w-100 py-3 rounded-4 fw-black shadow-lg text-uppercase tracking-widest">Save Stallion Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP ENTRY ---
const App = () => {
  const [tab, setTab] = useState<'home' | 'chat' | 'courses' | 'tutors'>('home');
  const [mode, setMode] = useState<ChatMode>('GENERAL');
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('stallion_app_v5');
    return saved ? JSON.parse(saved) : { 
      name: 'Stallion Guest', 
      college: 'College of Computing and Information Sciences', 
      campus: 'Batac', 
      theme: 'light', 
      studentId: '' 
    };
  });

  useEffect(() => {
    localStorage.setItem('stallion_app_v5', JSON.stringify(user));
    const isDark = user.theme === 'dark';
    document.documentElement.className = isDark ? 'dark-theme' : 'light-theme';
    document.body.className = isDark ? 'bg-dark text-light' : 'bg-light text-dark';
  }, [user]);

  return (
    <div className="min-vh-100 d-flex flex-column pb-5 mb-5">
      <Header 
        user={user} 
        toggleTheme={() => setUser({...user, theme: user.theme === 'light' ? 'dark' : 'light'})} 
        onOpenSettings={() => setShowSettings(true)} 
        onCollegeChange={(c: College) => setUser({...user, college: c})} 
      />
      
      <main className="container py-4 flex-grow-1">
        {tab === 'home' && <Home user={user} onStartChat={() => setTab('chat')} />}
        {tab === 'chat' && <div className="h-100" style={{minHeight: '600px'}}><ChatRoom user={user} mode={mode} setMode={setMode} /></div>}
        {tab === 'courses' && (
          <div className="animate-fadeIn">
            <h4 className="fw-black mb-4 text-uppercase tracking-wider px-2">Course Explorer</h4>
            <div className="row g-4">
              {MOCK_COURSES.map(c => (
                <div key={c.id} className="col-md-4">
                  <div className="stallion-card h-100 d-flex flex-column hover-lift">
                    <div className="mb-3 d-flex justify-content-between">
                      <span className="badge bg-warning text-dark text-uppercase">{c.code}</span>
                      <small className="fw-bold text-muted">{c.credits} Units</small>
                    </div>
                    <h6 className="fw-black mb-2">{c.title}</h6>
                    <p className="small mb-4 opacity-75 flex-grow-1 italic">"{c.description}"</p>
                    <button className="btn btn-sm btn-outline-success rounded-pill px-3 mt-auto fw-black text-uppercase" style={{fontSize: '0.65rem'}}>Browse Syllabus</button>
                  </div>
                </div>
              ))}
              <div className="col-12 text-center py-5">
                <p className="text-muted small fw-bold">Looking for more? Check the official student prospectus in the portal.</p>
              </div>
            </div>
          </div>
        )}
        {tab === 'tutors' && (
          <div className="text-center p-5 animate-fadeIn bg-white rounded-5 shadow-lg border border-success border-opacity-10 my-4">
            <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4 shadow-lg" style={{width: '120px', height: '120px'}}>
              <i className="fas fa-user-graduate fs-1"></i>
            </div>
            <h2 className="fw-black text-uppercase tracking-tight">AI Stallion Tutor</h2>
            <p className="opacity-75 mb-4 max-w-sm mx-auto fw-medium">Unlock 24/7 academic support grounded in your college curriculum.</p>
            <div className="p-4 bg-light rounded-4 mb-4 text-start border-start border-success border-4">
               <h6 className="fw-black text-uppercase small mb-2 text-success">Features</h6>
               <ul className="small text-muted mb-0 list-unstyled">
                 <li className="mb-2"><i className="fas fa-check-circle me-2 text-success"></i> Concept explanations using university guidelines.</li>
                 <li className="mb-2"><i className="fas fa-check-circle me-2 text-success"></i> Study tips specialized for {user.college}.</li>
                 <li><i className="fas fa-check-circle me-2 text-success"></i> Thesis methodology support.</li>
               </ul>
            </div>
            <button onClick={() => { setTab('chat'); setMode('TUTORING'); }} className="btn btn-gold btn-lg shadow-lg px-5 text-uppercase fw-black">Start Session</button>
          </div>
        )}
      </main>

      <nav className="bottom-nav shadow-lg rounded-top-5 border-top-0 py-3">
        {[
          { id: 'home', icon: 'fa-house', label: 'Home' },
          { id: 'chat', icon: 'fa-comments', label: 'AI Chat' },
          { id: 'courses', icon: 'fa-book', label: 'Courses' },
          { id: 'tutors', icon: 'fa-graduation-cap', label: 'AI Tutor' }
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id as any)} className={`nav-item border-0 bg-transparent ${tab === item.id ? 'active' : ''}`}>
            <i className={`fas ${item.icon} fs-4 mb-1`}></i>
            <span style={{fontSize: '0.6rem'}}>{item.label}</span>
          </button>
        ))}
      </nav>

      {showSettings && <SettingsModal user={user} setUser={setUser} onClose={() => setShowSettings(false)} />}
      
      <style>{`
        :root {
          --mmsu-green: #014421;
          --mmsu-dark: #002211;
          --mmsu-gold: #FFD700;
        }
        .fw-black { font-weight: 900; }
        .text-mmsu-gold { color: var(--mmsu-gold) !important; }
        .bg-mmsu { background-color: var(--mmsu-green); }
        .mmsu-header {
          background: linear-gradient(to right, var(--mmsu-green), var(--mmsu-dark));
          border-bottom: 3px solid var(--mmsu-gold);
        }
        .mmsu-banner {
          background: linear-gradient(135deg, var(--mmsu-green) 0%, var(--mmsu-dark) 100%);
          color: white;
          padding: 4rem 3rem;
          border-radius: 3rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 34, 17, 0.3);
        }
        .stallion-card {
          background: white;
          border-radius: 2rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .dark-theme .stallion-card {
          background: #1e1e1e;
          border-color: #333;
          color: white;
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.1) !important;
        }
        .btn-gold {
          background-color: var(--mmsu-gold);
          color: var(--mmsu-green);
          border: none;
          border-radius: 0.8rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .btn-gold:hover {
          background-color: #ffe033;
          transform: scale(1.05);
        }
        .btn-mmsu {
          background-color: var(--mmsu-green);
          color: white;
          border: none;
        }
        .btn-mmsu:hover {
          background-color: var(--mmsu-dark);
          color: white;
        }
        .bottom-nav {
          background: white;
          border-top-left-radius: 2.5rem;
          border-top-right-radius: 2.5rem;
          position: fixed;
          bottom: 0;
          width: 100%;
          z-index: 1000;
          display: flex;
          justify-content: space-around;
        }
        .dark-theme .bottom-nav { background: #111; border-color: #333; }
        .nav-item { color: #888; text-transform: uppercase; font-weight: 800; transition: 0.3s; }
        .nav-item.active { color: var(--mmsu-green); transform: scale(1.1); }
        .dark-theme .nav-item.active { color: var(--mmsu-gold); }
        .chat-container { height: 100%; min-height: 600px; }
        .message-bubble { max-width: 80%; padding: 1rem 1.4rem; border-radius: 1.5rem; }
        .user-message { border-bottom-right-radius: 0.2rem; }
        .ai-message { border-bottom-left-radius: 0.2rem; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .mmsu-logo-box { width: 44px; height: 44px; }
      `}</style>
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) createRoot(rootEl).render(<App />);
